// src/features/products/api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '';

const authorizedBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('idToken');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

/** Backend product model */
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

export type ListResponse = {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/** Shapes produced by your modal */
export type VariantColorSize = {
  color: string;
  sizes: string[];
  quantities: Record<string, number>;
  prices: Record<string, number>;
};

export type VariantColorOnly = {
  color: string;
  colorQuantity: number;
  colorPrice: number;
  sizes?: string[];
  quantities?: Record<string, number>;
  prices?: Record<string, number>;
};

export type ModalVariants = Array<VariantColorSize | VariantColorOnly>;

export type ProductFormFromModal = {
  name: string;
  description: string;
  price: number;
  category: string;      // mainCategoryId
  subcategory: string;   // subCategoryId
  attributes?: Record<string, string>;
  video?: string;
  images: string[];      // URLs (optional, not used by backend create)
  variants?: ModalVariants;
  sku?: string;
  brandId?: string | null;
  status?: 'active' | 'draft' | 'archived';
};

function computeStock(variants?: ModalVariants): number {
  if (!variants?.length) return 0;
  let total = 0;
  for (const v of variants) {
    const hasSizes = Array.isArray((v as any).sizes) && (v as any).sizes.length > 0;
    if (hasSizes) {
      const q = (v as VariantColorSize).quantities || {};
      for (const s of Object.keys(q)) total += Math.max(0, Math.trunc(q[s] || 0));
    } else {
      total += Math.max(0, Math.trunc((v as VariantColorOnly).colorQuantity || 0));
    }
  }
  return total;
}

/** CREATE (multipart) */
export function modalToCreateFormData(
  modal: ProductFormFromModal,
  files: File[],
  opts?: { status?: 'active' | 'draft' | 'archived' }
): FormData {
  if (!files?.length) throw new Error('At least one image file is required');

  const fd = new FormData();
  fd.append('title', modal.name);
  if (modal.sku) fd.append('sku', modal.sku);
  if (modal.description) fd.append('description', modal.description);
  fd.append('price', String(modal.price));
  fd.append('stock', String(computeStock(modal.variants)));
  fd.append('status', opts?.status || modal.status || 'active');

  fd.append('mainCategoryId', modal.category);
  if (modal.subcategory) fd.append('subCategoryId', modal.subcategory);
  if (modal.brandId) fd.append('brandId', modal.brandId);

  const attributes: Record<string, any> = { ...(modal.attributes || {}) };
  if (modal.video) attributes.video = modal.video;
  if (modal.variants?.length) attributes.variants = modal.variants;
  fd.append('attributes', JSON.stringify(attributes));

  files.forEach((f) => fd.append('files', f));
  return fd;
}

/** UPDATE (multipart supported) */
export function modalToUpdateFormData(
  patch: Partial<ProductFormFromModal> & { name?: string },
  options?: {
    files?: File[];
    replaceImages?: boolean;
    removeImageUrls?: string[];
    status?: 'active' | 'draft' | 'archived';
    recomputeStockFromVariants?: boolean;
  }
): FormData {
  const fd = new FormData();

  if (typeof patch.name === 'string') fd.append('title', patch.name);
  if (typeof patch.sku === 'string') fd.append('sku', patch.sku);
  if (typeof patch.description === 'string') fd.append('description', patch.description);
  if (typeof patch.price === 'number') fd.append('price', String(patch.price));
  if (patch.category) fd.append('mainCategoryId', patch.category);
  if (patch.subcategory !== undefined) fd.append('subCategoryId', patch.subcategory || '');
  if (patch.brandId !== undefined && patch.brandId !== null) fd.append('brandId', patch.brandId);
  if (options?.status) fd.append('status', options.status);

  if (patch.attributes || patch.video !== undefined || patch.variants) {
    const attributes: Record<string, any> = {};
    if (patch.attributes) Object.assign(attributes, patch.attributes);
    if (patch.video !== undefined) attributes.video = patch.video;
    if (patch.variants) attributes.variants = patch.variants;
    fd.append('attributes', JSON.stringify(attributes));
  }

  if (options?.recomputeStockFromVariants && patch.variants) {
    fd.append('stock', String(computeStock(patch.variants)));
  }

  if (options?.replaceImages !== undefined) {
    fd.append('replaceImages', String(!!options.replaceImages));
  }
  if (options?.removeImageUrls?.length) {
    fd.append('removeImageUrls', JSON.stringify(options.removeImageUrls));
  }
  if (options?.files?.length) {
    options.files.forEach((f) => fd.append('files', f));
  }

  return fd;
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: authorizedBaseQuery,
  tagTypes: ['Product', 'ProductList'],
  endpoints: (b) => ({
    listProducts: b.query<ListResponse, ListParams | void>({
      query: (p) => {
        const params = new URLSearchParams();
        if (p?.page) params.set('page', String(p.page));
        if (p?.limit) params.set('limit', String(p.limit));
        if (p?.status) params.set('status', p.status);
        if (p?.mainCategoryId) params.set('mainCategoryId', p.mainCategoryId);
        if (p?.subCategoryId) params.set('subCategoryId', p.subCategoryId);
        if (p?.brandId) params.set('brandId', p.brandId);
        if (p?.search) params.set('search', p.search);
        if (p?.orderBy) params.set('orderBy', p.orderBy);
        if (p?.orderDir) params.set('orderDir', p.orderDir);
        const qs = params.toString();
        return { url: `/products${qs ? `?${qs}` : ''}`, method: 'GET' };
      },
      providesTags: (res) =>
        res?.items
          ? [{ type: 'ProductList', id: 'ALL' }, ...res.items.map((p) => ({ type: 'Product' as const, id: p.id }))]
          : [{ type: 'ProductList', id: 'ALL' }],
    }),

    getProduct: b.query<Product, string>({
      query: (id) => ({ url: `/products/${encodeURIComponent(id)}`, method: 'GET' }),
      providesTags: (res, _e, id) => [{ type: 'Product', id }],
    }),

    createProductMultipart: b.mutation<Product, FormData>({
      query: (form) => ({ url: `/products`, method: 'POST', body: form }),
      invalidatesTags: [{ type: 'ProductList', id: 'ALL' }],
    }),

    updateProductMultipart: b.mutation<Product, { id: string; form: FormData }>({
      query: ({ id, form }) => ({ url: `/products/${encodeURIComponent(id)}`, method: 'PATCH', body: form }),
      invalidatesTags: (r, e, a) => [{ type: 'Product', id: a.id }, { type: 'ProductList', id: 'ALL' }],
    }),

    deleteProduct: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/products/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'ProductList', id: 'ALL' }],
    }),
  }),
});

export const {
  useListProductsQuery,
  useGetProductQuery,
  useCreateProductMultipartMutation,
  useUpdateProductMultipartMutation,
  useDeleteProductMutation,
} = productsApi;
