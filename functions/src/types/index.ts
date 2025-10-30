// types/index.ts
export type Category = {
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
  description: string | null;
  /** NEW: Only used/required for subcategories (parentId != null) */
  shippingType?: 'air' | 'sea' | null;
  shippingRate?: number | null;
};

export type Brand = {
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
};
