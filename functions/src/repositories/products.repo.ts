// src/repositories/products.repo.ts
// import { getFirestore } from 'firebase-admin/firestore';
// import { env } from '../config/env';
import { col } from './firestore';

export type Product = {
  id: string;
  title: string;
  slug: string;
  titleLower: string;
  sku?: string;
  description?: string;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  mainCategoryId: string;
  subCategoryId: string | null;
  brandId: string | null;
  attributes: Record<string, any>;
  images: string[];
  createdAt: number;
  updatedAt: number;
};

export type ListParams = {
  page?: number;
  limit?: number;
  status?: 'active' | 'draft' | 'archived';
  mainCategoryId?: string;
  subCategoryId?: string;
  brandId?: string;
  search?: string;
  orderBy?: 'createdAt' | 'price' | 'titleLower';
  orderDir?: 'asc' | 'desc';
};


const productsCol = () => col('products');

export async function createProduct(data: Omit<Product, 'id'>) {
  const ref = productsCol().doc();
  await ref.set(data);
  const snap = await ref.get();
  return { id: ref.id, ...(snap.data() as any) } as Product;
}

export async function getProduct(id: string) {
  const snap = await productsCol().doc(id).get();
  return snap.exists
    ? ({ id: snap.id, ...(snap.data() as any) } as Product)
    : null;
}

export async function setProduct(id: string, patch: Partial<Product>) {
  await productsCol().doc(id).set(patch, { merge: true });
}

export async function deleteProduct(id: string) {
  await productsCol().doc(id).delete();
  return { ok: true };
}

export async function listProducts(params: ListParams) {
  const {
    page = 1,
    limit = 20,
    status,
    mainCategoryId,
    subCategoryId,
    brandId,
    search,
    orderBy = 'createdAt',
    orderDir = 'desc',
  } = params;

  let q: FirebaseFirestore.Query = productsCol();

  if (status) q = q.where('status', '==', status);
  if (mainCategoryId) q = q.where('mainCategoryId', '==', mainCategoryId);
  if (subCategoryId) q = q.where('subCategoryId', '==', subCategoryId);
  if (brandId) q = q.where('brandId', '==', brandId);

  // simple title search using titleLower range
  if (search && search.trim()) {
    const s = search.trim().toLowerCase();
    q = q.where('titleLower', '>=', s).where('titleLower', '<=', s + '\uf8ff');
  }

  q = q.orderBy(orderBy, orderDir as FirebaseFirestore.OrderByDirection);

  // pagination
  const offset = (page - 1) * limit;
  q = q.offset(offset).limit(limit);

  const snap = await q.get();
  const items = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as any),
  })) as Product[];

  // (optional) a quick count — Firestore count() aggregation is better if you need exact
  const totalApprox = items.length + offset; // rough; keep simple for now

  return {
    items,
    page,
    limit,
    total: totalApprox,
    hasMore: items.length === limit,
  };
}
