// src/services/products.service.ts
import { getFirestore } from 'firebase-admin/firestore';
import { env } from '../config/env';
import {
  createProductSchema,
  updateProductSchema,
  CreateProductDTO,
  UpdateProductDTO,
} from '../schemas/products.schema';
import {
  createProduct,
  getProduct,
  setProduct,
  deleteProduct,
  listProducts,
  ListParams,
  Product,
} from '../repositories/products.repo';
import { uploadManyImages, deleteByUrl } from './upload.service';

// ✅ IMPORTANT: use the same named database (madeinchina02)
const db = env.DATABASE_ID
  ? getFirestore(undefined, env.DATABASE_ID)
  : getFirestore();

function slugify(s: string) {
  return s
    .toString()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 120);
}

async function ensureCategory(id?: string | null) {
  if (!id) return null;
  const doc = await db.collection('categories').doc(id).get();
  if (!doc.exists) throw new Error('Category not found');
  return { id: doc.id, ...(doc.data() || {}) } as any;
}

async function ensureBrand(id?: string | null) {
  if (!id) return null;
  const doc = await db.collection('brands').doc(id).get();
  if (!doc.exists) throw new Error('Brand not found');
  return { id: doc.id, ...(doc.data() || {}) } as any;
}

/** CREATE (multipart/form-data) – images REQUIRED, 1–5 */
export async function createFromForm(
  fields: any,
  files: Express.Multer.File[]
) {
  if (!files || files.length === 0)
    throw new Error('At least 1 image is required');
  if (files.length > 5) throw new Error('Max 5 images allowed');

  const toJson = (v: any) => {
    if (typeof v === 'string') {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  };

  const dto = createProductSchema.parse({
    title: String(fields.title || ''),
    sku: fields.sku ? String(fields.sku) : undefined,
    description: fields.description ? String(fields.description) : undefined,
    price: fields.price ?? 0,
    stock: fields.stock ?? 0,
    status: (fields.status as any) || 'active',
    mainCategoryId: String(fields.mainCategoryId || ''),
    subCategoryId: fields.subCategoryId
      ? String(fields.subCategoryId)
      : undefined,
    brandId: fields.brandId ? String(fields.brandId) : undefined,
    attributes: toJson(fields.attributes) as any,
  } as Partial<CreateProductDTO>);

  const main = await ensureCategory(dto.mainCategoryId);
  if (!main || (main as any).level !== 1)
    throw new Error('mainCategoryId must be a level-1 category');
  if (dto.subCategoryId) {
    const sub = await ensureCategory(dto.subCategoryId);
    if (!sub || (sub as any).parentId !== (main as any).id) {
      throw new Error('subCategoryId must be child of mainCategoryId');
    }
  }
  if (dto.brandId) await ensureBrand(dto.brandId);

  const uploaded = await uploadManyImages(files, 'products');
  const imageUrls = uploaded.map((u) => u.url);

  const now = Date.now();
  const data: Omit<Product, 'id'> = {
    title: dto.title,
    slug: slugify(dto.title),
    titleLower: dto.title.toLowerCase(),
    sku: dto.sku,
    description: dto.description,
    price: dto.price,
    stock: dto.stock ?? 0,
    status: dto.status ?? 'active',
    mainCategoryId: dto.mainCategoryId,
    subCategoryId: dto.subCategoryId ?? null,
    brandId: dto.brandId ?? null,
    attributes: dto.attributes ?? {},
    images: imageUrls,
    createdAt: now,
    updatedAt: now,
  };

  return await createProduct(data);
}

export async function getOne(id: string) {
  const doc = await getProduct(id);
  if (!doc) throw new Error('Product not found');
  return doc;
}

/** UPDATE (multipart) – add/replace/remove images */
export async function updateOne(
  id: string,
  fields: any,
  files?: Express.Multer.File[]
) {
  const existing = await getProduct(id);
  if (!existing) throw new Error('Product not found');

  const toJson = (v: any) => {
    if (typeof v === 'string') {
      try {
        return JSON.parse(v);
      } catch {
        return v;
      }
    }
    return v;
  };

  const dto = updateProductSchema.parse({
    title: fields?.title,
    sku: fields?.sku,
    description: fields?.description,
    price: fields?.price,
    stock: fields?.stock,
    status: fields?.status,
    mainCategoryId: fields?.mainCategoryId,
    subCategoryId: fields?.subCategoryId,
    brandId: fields?.brandId,
    attributes: fields?.attributes ? toJson(fields.attributes) : undefined,
    replaceImages: fields?.replaceImages,
    removeImageUrls: fields?.removeImageUrls,
  } as Partial<UpdateProductDTO>);

  if (dto.mainCategoryId) {
    const main = await ensureCategory(dto.mainCategoryId);
    if (!main || (main as any).level !== 1)
      throw new Error('mainCategoryId must be level-1');
    if (dto.subCategoryId) {
      const sub = await ensureCategory(dto.subCategoryId);
      if (!sub || (sub as any).parentId !== (main as any).id) {
        throw new Error('subCategoryId must be child of mainCategoryId');
      }
    }
  }
  if (dto.brandId) await ensureBrand(dto.brandId);

  let images: string[] | undefined = undefined;

  if (dto.replaceImages) {
    if (!files || files.length === 0)
      throw new Error('replaceImages requires files');
    if (files.length > 5) throw new Error('Max 5 images allowed');

    await Promise.all(
      (existing.images || []).map((url) => deleteByUrl(url).catch(() => {}))
    );
    const uploaded = await uploadManyImages(files, 'products');
    images = uploaded.map((u) => u.url);
  } else if (files && files.length > 0) {
    const uploaded = await uploadManyImages(files, 'products');
    const merged = [...(existing.images || []), ...uploaded.map((u) => u.url)];
    if (merged.length > 5) throw new Error('Max 5 images allowed total');
    images = merged;
  }

  if (dto.removeImageUrls?.length) {
    const removeSet = new Set(dto.removeImageUrls);
    const base = images ?? existing.images ?? [];
    const remain = base.filter((u) => !removeSet.has(u));
    await Promise.all(
      dto.removeImageUrls.map((url) => deleteByUrl(url).catch(() => {}))
    );
    images = remain;
  }

  const patch: Partial<Product> = { ...dto } as any;
  if (dto.title) {
    patch.slug = slugify(dto.title);
    patch.titleLower = dto.title.toLowerCase();
  }
  if (images) patch.images = images;
  patch.updatedAt = Date.now();

  await setProduct(id, patch);
  return await getProduct(id);
}

export async function removeOne(id: string) {
  const existing = await getProduct(id);
  if (existing?.images?.length) {
    await Promise.all(
      existing.images.map((url) => deleteByUrl(url).catch(() => {}))
    );
  }
  await deleteProduct(id);
  return { ok: true };
}

export async function listMany(params: ListParams) {
  return await listProducts(params);
}
