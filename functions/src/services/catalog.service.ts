import { zBrandCreate, zBrandUpdate, zCategoryCreate, zCategoryUpdate } from '../schemas/catalog.schema';
import type { Brand, Category } from '../types';
import { brandsRepo } from '../repositories/brands.repo';
import { categoriesRepo } from '../repositories/categories.repo';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const catalogService = {
  async createCategory(payload: unknown): Promise<Category> {
    const dto = zCategoryCreate.parse(payload);
    const now = Date.now();

    const parentId = dto.parentId ?? null;
    let parent: Category | null = null;

    if (parentId) {
      parent = await categoriesRepo.getById(parentId);
      if (!parent) throw new Error('Parent category not found');
    }

    const slug = dto.slug ?? slugify(dto.name);
    const existing = await categoriesRepo.findBySlugUnderParent(slug, parentId);
    if (existing) throw new Error('Category with same slug already exists under this parent');

    const base: Omit<Category, 'id'> = {
      name: dto.name,
      slug,
      parentId,
      level: parent ? parent.level + 1 : 1,
      path: [],
      sortOrder: dto.sortOrder ?? 0,
      image: dto.image ?? null,
      status: dto.status ?? 'active',
      createdAt: now,
      updatedAt: now,
      description: dto.description ?? null,

      // NEW
      shippingType: dto.shippingType ?? null,
      shippingRate: dto.shippingRate ?? null,
    };

    const created = await categoriesRepo.create(base);
    const path = parent ? [...(parent.path || []), created.id] : [created.id];
    return categoriesRepo.update(created.id, { path });
  },

  async updateCategory(id: string, payload: unknown): Promise<Category> {
    const dto = zCategoryUpdate.parse(payload);
    const existing = await categoriesRepo.getById(id);
    if (!existing) throw new Error('Category not found');

    let patch: Partial<Category> = { updatedAt: Date.now() };

    if (dto.name) patch.name = dto.name;
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder;
    if (dto.image !== undefined) patch.image = dto.image;
    if (dto.status) patch.status = dto.status;
    if (dto.description !== undefined) patch.description = dto.description;

    // NEW shipping fields
    if (dto.shippingType !== undefined) patch.shippingType = dto.shippingType ?? null;
    if (dto.shippingRate !== undefined) patch.shippingRate = dto.shippingRate ?? null;

    // slug & conflict under (possibly changed) parent
    if (dto.slug || dto.name) {
      const targetSlug = dto.slug ?? slugify(dto.name || existing.name);
      const conflict = await categoriesRepo.findBySlugUnderParent(
        targetSlug,
        dto.parentId ?? existing.parentId
      );
      if (conflict && conflict.id !== id) throw new Error('Slug already exists under this parent');
      patch.slug = targetSlug;
    }

    // parent change
    if (dto.parentId !== undefined && dto.parentId !== existing.parentId) {
      const newParent = dto.parentId ? await categoriesRepo.getById(dto.parentId) : null;
      if (dto.parentId && !newParent) throw new Error('New parent not found');
      const newLevel = newParent ? newParent.level + 1 : 1;
      const newPathForSelf = newParent ? [...(newParent.path || []), id] : [id];

      patch.parentId = dto.parentId ?? null;
      patch.level = newLevel;
      patch.path = newPathForSelf;

      const updated = await categoriesRepo.update(id, patch);

      const all = await categoriesRepo.getDescendantsIds(id);
      const children = all.filter((x) => x !== id);
      for (const childId of children) {
        const child = await categoriesRepo.getById(childId);
        if (!child) continue;
        const tailFromSelf = child.path.slice(child.path.indexOf(id));
        const newPath = [...newPathForSelf, ...tailFromSelf.slice(1)];
        await categoriesRepo.update(child.id, { path: newPath, level: newPath.length });
      }
      return updated;
    }

    return categoriesRepo.update(id, patch);
  },

  async getCategory(id: string) {
    const c = await categoriesRepo.getById(id);
    if (!c) throw new Error('Category not found');
    return c;
  },

  async listCategories(parentId?: string) {
    if (parentId === undefined) return categoriesRepo.listAll();
    const pid = parentId === 'null' ? null : parentId || null;
    return categoriesRepo.getChildren(pid);
  },

  async deleteCategory(id: string, { hard = false }: { hard?: boolean } = {}) {
    const cat = await categoriesRepo.getById(id);
    if (!cat) throw new Error('Category not found');

    if (!hard) {
      return categoriesRepo.update(id, { status: 'archived', updatedAt: Date.now() } as Partial<Category>);
    }

    const ids = await categoriesRepo.getDescendantsIds(id);
    for (const cid of ids) await categoriesRepo.remove(cid);

    if (cat.level === 1) {
      const brands = await brandsRepo.listAll(cat.id);
      await Promise.all(brands.map((b) => brandsRepo.update(b.id, { status: 'archived' })));
    }

    return { removed: ids.length };
  },

  // ===== Brands (unchanged) =====
  async createBrand(payload: unknown): Promise<Brand> {
    const dto = zBrandCreate.parse(payload);
    const now = Date.now();

    const main = await categoriesRepo.getById(dto.mainCategoryId);
    if (!main || main.level !== 1) throw new Error('mainCategoryId must reference a main (level-1) category');

    const slug = dto.slug ?? slugify(dto.name);
    const conflict = await brandsRepo.findBySlug(slug);
    if (conflict) throw new Error('Brand slug already exists');

    const base: Omit<Brand, 'id'> = {
      name: dto.name,
      slug,
      mainCategoryId: dto.mainCategoryId,
      image: dto.image ?? null,
      description: dto.description ?? null,
      website: dto.website ?? null,
      status: dto.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    };

    return brandsRepo.create(base);
  },

  async updateBrand(id: string, payload: unknown): Promise<Brand> {
    const dto = zBrandUpdate.parse(payload);
    const existing = await brandsRepo.getById(id);
    if (!existing) throw new Error('Brand not found');

    const patch: Partial<Brand> = { updatedAt: Date.now() };

    if (dto.name) patch.name = dto.name;
    if (dto.image !== undefined) patch.image = dto.image;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.website !== undefined) patch.website = dto.website;
    if (dto.status) patch.status = dto.status;

    if (dto.slug || dto.name) {
      const s = dto.slug ?? slugify(dto.name || existing.name);
      const conflict = await brandsRepo.findBySlug(s);
      if (conflict && conflict.id !== id) throw new Error('Brand slug already exists');
      patch.slug = s;
    }

    if (dto.mainCategoryId && dto.mainCategoryId !== existing.mainCategoryId) {
      const main = await categoriesRepo.getById(dto.mainCategoryId);
      if (!main || main.level !== 1) throw new Error('mainCategoryId must reference a main (level-1) category');
      patch.mainCategoryId = dto.mainCategoryId;
    }

    return brandsRepo.update(id, patch);
  },

  async getBrand(id: string) {
    const b = await brandsRepo.getById(id);
    if (!b) throw new Error('Brand not found');
    return b;
  },

  async listBrands(mainCategoryId?: string) {
    return brandsRepo.listAll(mainCategoryId);
  },

  async deleteBrand(id: string, { hard = false }: { hard?: boolean } = {}) {
    if (!hard) {
      return brandsRepo.update(id, { status: 'archived', updatedAt: Date.now() } as Partial<Brand>);
    }
    await brandsRepo.remove(id);
    return { removed: 1 };
  },
};
