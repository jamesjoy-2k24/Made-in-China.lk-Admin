// schemas/attributes.schema.ts
import { z } from "zod";

export const zAttrValueType = z.enum([
  "string",
  "number",
  "boolean",
  "enum",
  "multi_enum",
  "object",
  "array_number",
  "array_string",
]);

const zOption = z.object({
  value: z.string().min(1),
  label: z.string().min(1).optional(),
});

const zUnit = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
});

export const zAttributeCreate = z.object({
  key: z.string().min(1).regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/),
  label: z.string().min(1).max(140),
  description: z.string().max(1000).nullable().optional(),

  valueType: zAttrValueType,

  min: z.number().optional(),
  max: z.number().optional(),
  regex: z.string().optional(),

  options: z.array(zOption).optional(),
  units: z.array(zUnit).optional(),
  defaultUnit: z.string().optional(),

  groupKey: z.string().optional(),
  isFilterable: z.boolean().optional().default(true),
  isSearchable: z.boolean().optional().default(false),
  isVariantDimension: z.boolean().optional().default(false),

  aliases: z.array(z.string()).optional(),
  status: z.enum(["active", "archived"]).optional().default("active"),
});

export const zAttributeUpdate = zAttributeCreate.partial();

export const zResolveQuery = z.object({
  mainCategoryId: z.string().min(1),
  subCategoryId: z.string().optional(),
});

// One-shot: create/update + assign
export const zAttributeCreateWithAssign = z.object({
  mainCategoryIds: z.array(z.string().min(1)).min(1),
  // allow [null] to mean "all subs under those mains"
  subCategoryIds: z.array(z.string().min(1).nullable()).min(1).optional(),

  key: z.string().min(1).regex(/^[a-z0-9_]+(?:-[a-z0-9_]+)*$/),
  label: z.string().min(1).max(140),
  description: z.string().max(1000).nullable().optional(),
  valueType: zAttrValueType,
  min: z.number().optional(),
  max: z.number().optional(),
  regex: z.string().optional(),
  options: z.array(zOption).optional(),
  units: z.array(zUnit).optional(),
  defaultUnit: z.string().optional(),
  groupKey: z.string().optional(),
  isFilterable: z.boolean().optional().default(true),
  isSearchable: z.boolean().optional().default(false),
  isVariantDimension: z.boolean().optional().default(false),
  aliases: z.array(z.string()).optional(),
  status: z.enum(["active", "archived"]).optional().default("active"),
});
