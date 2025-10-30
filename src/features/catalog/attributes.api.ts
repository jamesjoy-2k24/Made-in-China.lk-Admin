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

/** Types mirrored from your backend */
export type AttributeOption = { value: string; label?: string };
export type AttributeUnit = { code: string; label: string };

export type AttributeDefinition = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  valueType:
    | 'string'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'multi_enum'
    | 'object'
    | 'array_number'
    | 'array_string';
  min?: number | null;
  max?: number | null;
  regex?: string | null;
  options?: AttributeOption[];
  units?: AttributeUnit[];
  defaultUnit?: string | null;
  groupKey?: string | null;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isVariantDimension?: boolean;
  aliases?: string[];

  /** your chosen shape for assignments */
  mainCategoryIds: string[];
  subCategoryIds: (string | null)[];

  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
};

export type CreateAttributeWithAssignJSON = {
  mainCategoryIds: string[];
  subCategoryIds?: (string | null)[];

  key: string;
  label: string;
  description?: string | null;
  valueType:
    | 'string'
    | 'number'
    | 'boolean'
    | 'enum'
    | 'multi_enum'
    | 'object'
    | 'array_number'
    | 'array_string';
  min?: number | null;
  max?: number | null;
  regex?: string | null;
  options?: AttributeOption[];
  units?: AttributeUnit[];
  defaultUnit?: string | null;
  groupKey?: string | null;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isVariantDimension?: boolean;
  aliases?: string[];
  status?: 'active' | 'archived';
};

export type CreateWithAssignResponse = {
  attribute: AttributeDefinition;
  assignedCount: number;
};

export const attributesApi = createApi({
  reducerPath: 'attributesApi',
  baseQuery: authorizedBaseQuery,
  tagTypes: ['Attribute', 'AttributeList'],
  endpoints: (b) => ({
    listAttributes: b.query<AttributeDefinition[], { status?: 'active' | 'archived' } | void>({
      query: (p) => ({
        url: `/attributes/attributes${p?.status ? `?status=${p.status}` : ''}`,
        method: 'GET',
      }),
      providesTags: (result) =>
        result
          ? [{ type: 'AttributeList', id: 'ALL' }, ...result.map((a) => ({ type: 'Attribute' as const, id: a.id }))]
          : [{ type: 'AttributeList', id: 'ALL' }],
    }),

    createWithAssign: b.mutation<CreateWithAssignResponse, CreateAttributeWithAssignJSON>({
      query: (body) => ({
        url: `/attributes/attributes/with-assign`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AttributeList', id: 'ALL' }],
    }),

    updateAttribute: b.mutation<AttributeDefinition, { id: string; patch: Partial<AttributeDefinition> }>({
      query: ({ id, patch }) => ({
        url: `/attributes/attributes/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (r, e, a) => [{ type: 'Attribute', id: a.id }, { type: 'AttributeList', id: 'ALL' }],
    }),

    deleteAttribute: b.mutation<{ removed?: number } | AttributeDefinition, { id: string }>({
      query: ({ id }) => ({
        url: `/attributes/attributes/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'AttributeList', id: 'ALL' }],
    }),
  }),
});

export const {
  useListAttributesQuery,
  useCreateWithAssignMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
} = attributesApi;
