// schemas/catalog.schema.ts
import { z } from 'zod';

export const zCategoryCreate = z.object({
  name: z.string().min(2).max(120),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional().default(0),
  image: z.string().url().nullable().optional(),
  status: z.enum(['active', 'archived']).optional().default('active'),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  description: z.string().max(1000).nullable().optional(),
  /** NEW */
  shippingType: z.enum(['air', 'sea']).nullable().optional(),
  shippingRate: z.number().min(0).nullable().optional(),
}).refine(
  (d) => {
    // If subcategory (has parentId), shipping fields must be present
    const isSub = d.parentId != null && d.parentId !== undefined;
    return !isSub || (!!d.shippingType && typeof d.shippingRate === 'number');
  },
  {
    message: 'shippingType and shippingRate are required for subcategories',
    path: ['shippingType'],
  }
);

export const zCategoryUpdate = z.object({
  name: z.string().min(2).max(120).optional(),
  parentId: z.string().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  image: z.string().url().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
  description: z.string().max(1000).nullable().optional(),
  /** NEW */
  shippingType: z.enum(['air', 'sea']).nullable().optional(),
  shippingRate: z.number().min(0).nullable().optional(),
});

export const zBrandCreate = z.object({
  name: z.string().min(2).max(120),
  mainCategoryId: z.string().min(1),
  image: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  website: z.string().url().nullable().optional(),
  status: z.enum(['active', 'archived']).optional().default('active'),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
});

export const zBrandUpdate = z.object({
  name: z.string().min(2).max(120).optional(),
  mainCategoryId: z.string().min(1).optional(),
  image: z.string().url().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  website: z.string().url().nullable().optional(),
  status: z.enum(['active', 'archived']).optional(),
  slug: z.string().min(1).max(140).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional(),
});
