export type AttributeValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'multi_enum'
  | 'object'
  | 'array_number'
  | 'array_string';

export type AttributeOption = { value: string; label?: string };
export type AttributeUnit = { code: string; label: string };

export type AttributeDefinition = {
  id: string;
  key: string;
  label: string;
  description?: string | null;

  valueType: AttributeValueType;
  min?: number | null;
  max?: number | null;
  regex?: string | null;

  options: AttributeOption[];
  units: AttributeUnit[];
  defaultUnit?: string | null;

  groupKey?: string | null;
  isFilterable?: boolean;
  isSearchable?: boolean;
  isVariantDimension?: boolean;

  aliases?: string[];

  mainCategoryIds: string[];
  subCategoryIds: (string | null)[];

  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
};

export type ResolvedAttributes = {
  mainCategoryId: string;
  subCategoryId: string | null;
  attributeKeys: string[];
  definitions: AttributeDefinition[];
};

export type CategoryAttributeMap = {
  priority: any;
  updatedAt: any;
  id: string;
  mainCategoryId: string;
};
