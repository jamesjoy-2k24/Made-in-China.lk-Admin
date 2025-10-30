import { z } from "zod";

export const statusEnum = z.enum(["active", "draft", "archived"]);

export const createProductSchema = z.object({
  title: z.string().min(1, "title required"),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).default(0),
  status: statusEnum.default("active"),

  // relations
  mainCategoryId: z.string().min(1, "mainCategoryId required"),
  subCategoryId: z.string().optional(),
  brandId: z.string().optional(),

  // misc
  attributes: z.record(z.any()).optional(),
});
export type CreateProductDTO = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  status: statusEnum.optional(),

  mainCategoryId: z.string().optional(),
  subCategoryId: z.string().optional(),
  brandId: z.string().optional(),

  attributes: z.record(z.any()).optional(),

  // image management flags (multipart only)
  replaceImages: z.coerce.boolean().optional(),
  removeImageUrls: z.preprocess(
    (v) => {
      if (typeof v === "string") {
        try { return JSON.parse(v); } catch { return [v]; }
      }
      return v;
    },
    z.array(z.string().url()).optional()
  ),
});
export type UpdateProductDTO = z.infer<typeof updateProductSchema>;
