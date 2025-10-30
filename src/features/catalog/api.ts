import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '';

const authorizedBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('idToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

/** ====== TYPES (Frontend API DTOs) ====== */
export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  path: string[];
  sortOrder: number;
  image: string | null;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
  description?: string | null;
  /** NEW: shipping for subcategories */
  shippingType?: 'air' | 'sea' | null;
  shippingRate?: number | null;
};

export type ApiBrand = {
  id: string;
  name: string;
  slug: string;
  mainCategoryId: string;
  image: string | null;
  description: string | null;
  website: string | null;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
  productsCount?: number;
};

/** Category payloads (JSON) */
type CreateCategoryJSON = {
  name: string;
  parentId?: string | null;
  sortOrder?: number;
  image?: string | null;
  status?: 'active' | 'archived';
  slug?: string;
  description?: string | null;
  /** NEW */
  shippingType?: 'air' | 'sea' | null;
  shippingRate?: number | null;
};

type UpdateCategoryJSON = Partial<CreateCategoryJSON>;

/** Brand payloads (JSON) */
type CreateBrandJSON = {
  name: string;
  mainCategoryId: string;
  slug?: string;
  description?: string;
  website?: string | null;
  image?: string | null;
  status?: 'active' | 'archived';
};

type UpdateBrandJSON = Partial<CreateBrandJSON>;

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: authorizedBaseQuery,
  tagTypes: ['Category', 'CategoryList', 'Brand', 'BrandList'],
  endpoints: (b) => ({
    listCategories: b.query<ApiCategory[], string | undefined>({
      query: (parentId) => {
        if (parentId === undefined) {
          return { url: `/catalog/categories`, method: 'GET' };
        }
        const paramValue = parentId === null ? 'null' : parentId;
        return {
          url: `/catalog/categories?parentId=${encodeURIComponent(paramValue)}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'CategoryList', id: 'ALL' },
              ...result.map((c) => ({ type: 'Category' as const, id: c.id })),
            ]
          : [{ type: 'CategoryList', id: 'ALL' }],
    }),

    createCategory: b.mutation<ApiCategory, CreateCategoryJSON>({
      query: (body) => ({
        url: `/catalog/categories`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CategoryList', id: 'ALL' }],
    }),

    updateCategory: b.mutation<ApiCategory, { id: string; patch: UpdateCategoryJSON }>({
      query: ({ id, patch }) => ({
        url: `/catalog/categories/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (r, e, a) => [
        { type: 'Category', id: a.id },
        { type: 'CategoryList', id: 'ALL' },
      ],
    }),

    deleteCategory: b.mutation<{ removed?: number } | ApiCategory, { id: string; hard?: boolean }>(
      {
        query: ({ id, hard }) => ({
          url: `/catalog/categories/${encodeURIComponent(id)}${hard ? `?hard=true` : ''}`,
          method: 'DELETE',
        }),
        invalidatesTags: [{ type: 'CategoryList', id: 'ALL' }],
      }
    ),

    createCategoryUpload: b.mutation<ApiCategory, FormData>({
      query: (form) => ({
        url: `/catalog/categories/upload`,
        method: 'POST',
        body: form,
      }),
      invalidatesTags: [{ type: 'CategoryList', id: 'ALL' }],
    }),

    updateCategoryUpload: b.mutation<ApiCategory, { id: string; form: FormData }>({
      query: ({ id, form }) => ({
        url: `/catalog/categories/${encodeURIComponent(id)}/upload`,
        method: 'PATCH',
        body: form,
      }),
      invalidatesTags: (r, e, a) => [
        { type: 'Category', id: a.id },
        { type: 'CategoryList', id: 'ALL' },
      ],
    }),

    listBrands: b.query<ApiBrand[], string | undefined>({
      query: (mainCategoryId) => {
        if (mainCategoryId === undefined) {
          return { url: `/catalog/brands`, method: 'GET' };
        }
        return {
          url: `/catalog/brands?mainCategoryId=${encodeURIComponent(mainCategoryId)}`,
          method: 'GET',
        };
      },
      providesTags: (result) =>
        result
          ? [
              { type: 'BrandList', id: 'ALL' },
              ...result.map((bb) => ({ type: 'Brand' as const, id: bb.id })),
            ]
          : [{ type: 'BrandList', id: 'ALL' }],
    }),

    createBrand: b.mutation<ApiBrand, CreateBrandJSON>({
      query: (body) => ({
        url: `/catalog/brands`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'BrandList', id: 'ALL' }],
    }),

    updateBrand: b.mutation<ApiBrand, { id: string; patch: UpdateBrandJSON }>({
      query: ({ id, patch }) => ({
        url: `/catalog/brands/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (r, e, a) => [
        { type: 'Brand', id: a.id },
        { type: 'BrandList', id: 'ALL' },
      ],
    }),

    deleteBrand: b.mutation<{ removed?: number } | ApiBrand, { id: string; hard?: boolean }>(
      {
        query: ({ id, hard }) => ({
          url: `/catalog/brands/${encodeURIComponent(id)}${hard ? `?hard=true` : ''}`,
          method: 'DELETE',
        }),
        invalidatesTags: [{ type: 'BrandList', id: 'ALL' }],
      }
    ),

    createBrandUpload: b.mutation<ApiBrand, FormData>({
      query: (form) => ({
        url: `/catalog/brands/upload`,
        method: 'POST',
        body: form,
      }),
      invalidatesTags: [{ type: 'BrandList', id: 'ALL' }],
    }),

    updateBrandUpload: b.mutation<ApiBrand, { id: string; form: FormData }>({
      query: ({ id, form }) => ({
        url: `/catalog/brands/${encodeURIComponent(id)}/upload`,
        method: 'PATCH',
        body: form,
      }),
      invalidatesTags: (r, e, a) => [
        { type: 'Brand', id: a.id },
        { type: 'BrandList', id: 'ALL' },
      ],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateCategoryUploadMutation,
  useUpdateCategoryUploadMutation,
  useListBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useCreateBrandUploadMutation,
  useUpdateBrandUploadMutation,
} = catalogApi;
