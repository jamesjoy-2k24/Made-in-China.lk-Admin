// src/features/products/ProductCreateModal.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  DollarSign,
  FileText,
  Tag,
  Grid,
  Award,
  Edit3,
  Pencil,
  Check,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import './ModernProductModal.css';

import { useListCategoriesQuery } from '@/features/catalog/api';
import {
  useListAttributesQuery,
  type AttributeDefinition,
} from '../catalog/attributes.api';

import MediaUploadPreview from '../../components/common/MediaUploadPreview';
import VideoPreviewButton from '../../components/common/VideoPreviewButton';

/* -----------------------------------------
   HELPERS
------------------------------------------ */
const looksLikeHex = (s?: string) =>
  !!s && /^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(s);
const withHash = (s: string) => (s.startsWith('#') ? s : `#${s}`);
const normalizeHex = (input: string): string | null => {
  if (!input) return null;
  const v = input.trim();
  const short = v.match(/^#([0-9a-f]{3})$/i);
  if (short)
    return (
      '#' +
      short[1]
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  const long = v.match(/^#([0-9a-f]{6})$/i);
  if (long) return '#' + long[1].toUpperCase();
  if (/^[0-9a-f]{6}$/i.test(v)) return '#' + v.toUpperCase();
  if (/^[0-9a-f]{3}$/i.test(v))
    return (
      '#' +
      v
        .split('')
        .map((c) => c + c)
        .join('')
        .toUpperCase()
    );
  return null;
};

/* -----------------------------------------
   ZOD: variants + product schema
------------------------------------------ */
const variantSchemaColorSize = z.object({
  color: z.string().min(1, 'Color is required'),
  sizes: z.array(z.string()).min(1, 'Add at least one size row'),
  quantities: z.record(
    z.string(),
    z
      .number({ invalid_type_error: 'Quantity must be a number' })
      .int()
      .min(0, 'Must be ≥ 0')
  ),
  prices: z.record(
    z.string(),
    z
      .number({ invalid_type_error: 'Price must be a number' })
      .min(0, 'Must be ≥ 0')
  ),
});

const variantSchemaColorOnly = z.object({
  color: z.string().min(1, 'Color is required'),
  colorQuantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int()
    .min(0, 'Must be ≥ 0'),
  colorPrice: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Must be ≥ 0'),
  sizes: z.array(z.string()).optional().default([]),
  quantities: z.record(z.string(), z.number()).optional().default({}),
  prices: z.record(z.string(), z.number()).optional().default({}),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().min(0, 'Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().min(1, 'Subcategory is required'),
  attributes: z.record(z.string(), z.string()).optional(),
  video: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  images: z
    .preprocess(
      (val) =>
        Array.isArray(val)
          ? (val as unknown[])
              .filter((s) => typeof s === 'string')
              .map((s) => (s as string).trim())
              .filter((s) => s.length > 0)
          : [],
      z.array(z.string().url('Must be a valid URL')).max(5, 'Max 5 images')
    )
    .optional()
    .default([]),
  variants: z
    .array(z.union([variantSchemaColorSize, variantSchemaColorOnly]))
    .optional()
    .default([]),
  stock: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int()
    .min(0, 'Quantity must be ≥ 0')
    .optional(),
  // optional extra fields your page passes through
  sku: z.string().optional(),
  brandId: z.string().nullable().optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export type ProductFormDataWithFiles = {
  formValues: ProductFormData;
  files?: File[];
};

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: ProductFormDataWithFiles) => void;
}

/* ----------------------------------------------------
   Component (CREATE)
----------------------------------------------------- */
const ProductCreateModal: React.FC<ProductCreateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      subcategory: '',
      attributes: {},
      video: '',
      images: [],
      variants: [],
      stock: 0,
      sku: '',
      brandId: null,
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: '',
      description: '',
      price: 0,
      category: '',
      subcategory: '',
      attributes: {},
      video: '',
      images: [],
      variants: [],
      stock: 0,
      sku: '',
      brandId: null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* -----------------------------------------
     DATA: Categories + Attributes
  ------------------------------------------ */
  const { data: catData = [], isFetching: catsFetching } =
    useListCategoriesQuery(undefined);
  const { data: allAttributes = [] } = useListAttributesQuery();

  const mainCategories = useMemo(
    () => (catData || []).filter((c: any) => c.parentId === null),
    [catData]
  );

  const selectedMainId = watch('category');
  const selectedSubId = watch('subcategory');

  const subcategories = useMemo(
    () => (catData || []).filter((c: any) => c.parentId === selectedMainId),
    [catData, selectedMainId]
  );

  const selectedAttributes: AttributeDefinition[] = useMemo(() => {
    if (!selectedMainId || !selectedSubId) return [];
    return (allAttributes || []).filter(
      (a) =>
        a.status === 'active' &&
        Array.isArray(a.mainCategoryIds) &&
        Array.isArray(a.subCategoryIds) &&
        a.mainCategoryIds.includes(selectedMainId) &&
        a.subCategoryIds.includes(selectedSubId)
    );
  }, [allAttributes, selectedMainId, selectedSubId]);

  const colorAttr = useMemo(
    () =>
      selectedAttributes.find(
        (a) => a.key?.toLowerCase() === 'color' && a.valueType === 'multi_enum'
      ),
    [selectedAttributes]
  );
  const sizeAttr = useMemo(
    () =>
      selectedAttributes.find(
        (a) => a.key?.toLowerCase() === 'size' && a.valueType === 'multi_enum'
      ),
    [selectedAttributes]
  );

  const colorChoices = useMemo(() => {
    const opts = colorAttr?.options || [];
    return opts.map((o) => {
      const hex = looksLikeHex(o.value)
        ? normalizeHex(withHash(o.value))
        : null;
      const display = o.label || o.value || '';
      return { display, value: hex || o.value || display };
    });
  }, [colorAttr]);

  const sizeChoices = useMemo(() => {
    const opts = sizeAttr?.options || [];
    return opts.map((o) => o.label || o.value || '').filter(Boolean);
  }, [sizeAttr]);

  const supportsColorAndSize = !!(
    colorAttr &&
    sizeAttr &&
    colorChoices.length &&
    sizeChoices.length
  );
  const supportsColorOnly = !!(colorAttr && !sizeAttr && colorChoices.length);
  const hasMultiInventory = supportsColorOnly || supportsColorAndSize;

  /* -----------------------------------------
     MEDIA (files + URL list)
  ------------------------------------------ */
  const [imageInputs, setImageInputs] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);

  const addImageInput = () => {
    if (imageInputs.length < 5) {
      setImageInputs((n) => [...n, '']);
    }
  };
  const removeImageInput = (index: number) => {
    const next = imageInputs.filter((_, i) => i !== index);
    setImageInputs(next);
    setValue(
      'images',
      next.filter((u) => u && u.trim() !== '')
    );
  };
  const updateImageUrl = (index: number, url: string) => {
    const next = [...imageInputs];
    next[index] = url;
    setImageInputs(next);
    setValue(
      'images',
      next.filter((u) => u && u.trim() !== '')
    );
  };

  /* -----------------------------------------
     VARIANTS state (for color+size staging)
  ------------------------------------------ */
  const variants = watch('variants') || [];
  const [tempSize, setTempSize] = useState<Record<number, string>>({});
  const [tempQty, setTempQty] = useState<Record<number, number>>({});
  const [tempPrice, setTempPrice] = useState<Record<number, number>>({});
  const [editingRow, setEditingRow] = useState<Record<number, string | null>>(
    {}
  );

  const addVariantColorSize = () => {
    const next = [
      ...variants,
      {
        color: '',
        sizes: [] as string[],
        quantities: {} as Record<string, number>,
        prices: {} as Record<string, number>,
      },
    ];
    setValue('variants', next, { shouldValidate: true });
  };

  const addVariantColorOnly = () => {
    const next = [
      ...variants,
      {
        color: '',
        colorQuantity: 0,
        colorPrice: 0,
        sizes: [],
        quantities: {},
        prices: {},
      },
    ];
    setValue('variants', next, { shouldValidate: true });
  };

  const deleteVariant = (idx: number) => {
    const next = variants.filter((_: any, i: number) => i !== idx);
    setValue('variants', next, { shouldValidate: true });
  };

  const updateVariantColor = (idx: number, color: string) => {
    const next = variants.map((v: any, i: number) =>
      i === idx ? { ...v, color } : v
    );
    setValue('variants', next, { shouldValidate: true });
  };

  const addSizeRow = (idx: number) => {
    const size = (tempSize[idx] || '').trim();
    const qty = Math.max(0, Math.trunc(tempQty[idx] || 0));
    const price = Math.max(0, Number(tempPrice[idx] || 0));
    if (!size) return;

    const v = variants[idx] || {};
    const sizesSet = new Set([...(v.sizes || [])]);
    sizesSet.add(size);

    const next = variants.map((item: any, i: number) => {
      if (i !== idx) return item;
      return {
        ...item,
        sizes: Array.from(sizesSet),
        quantities: { ...(item.quantities || {}), [size]: qty },
        prices: { ...(item.prices || {}), [size]: price },
      };
    });

    setValue('variants', next, { shouldValidate: true });

    setTempSize((prev) => ({ ...prev, [idx]: '' }));
    setTempQty((prev) => ({ ...prev, [idx]: 0 }));
    setTempPrice((prev) => ({ ...prev, [idx]: 0 }));
    setEditingRow((prev) => ({ ...prev, [idx]: null }));
  };

  const startEditSizeRow = (idx: number, size: string) => {
    const v = variants[idx] || {};
    setTempSize((prev) => ({ ...prev, [idx]: size }));
    setTempQty((prev) => ({ ...prev, [idx]: v.quantities?.[size] ?? 0 }));
    setTempPrice((prev) => ({ ...prev, [idx]: v.prices?.[size] ?? 0 }));
    setEditingRow((prev) => ({ ...prev, [idx]: size }));
  };

  const deleteSizeRow = (idx: number, size: string) => {
    const v = variants[idx] || {};
    const sizes = (v.sizes || []).filter((s: string) => s !== size);
    const { [size]: _q, ...restQ } = v.quantities || {};
    const { [size]: _p, ...restP } = v.prices || {};
    const next = variants.map((item: any, i: number) =>
      i === idx ? { ...item, sizes, quantities: restQ, prices: restP } : item
    );
    setValue('variants', next, { shouldValidate: true });

    if (editingRow[idx] === size) {
      setEditingRow((prev) => ({ ...prev, [idx]: null }));
      setTempSize((prev) => ({ ...prev, [idx]: '' }));
      setTempQty((prev) => ({ ...prev, [idx]: 0 }));
      setTempPrice((prev) => ({ ...prev, [idx]: 0 }));
    }
  };

  /* -----------------------------------------
     Dynamic attributes (exclude color/size)
  ------------------------------------------ */
  const dynamicAttributes = useMemo(() => {
    const excludeKeys = new Set<string>();
    if (colorAttr?.key) excludeKeys.add(colorAttr.key);
    if (sizeAttr?.key) excludeKeys.add(sizeAttr.key);
    return selectedAttributes.filter((a) => !excludeKeys.has(a.key));
  }, [selectedAttributes, colorAttr, sizeAttr]);

  const renderAttributeField = (attr: AttributeDefinition) => {
    const path = `attributes.${attr.key}` as const;
    const commonProps = {
      className: 'form-input',
      placeholder: attr.label || attr.key,
    };

    switch (attr.valueType) {
      case 'number':
        return (
          <input
            type='number'
            step='any'
            {...register(path)}
            {...commonProps}
          />
        );
      case 'boolean':
        return (
          <select
            {...register(path)}
            className='form-input'
          >
            <option value=''>Select</option>
            <option value='true'>True</option>
            <option value='false'>False</option>
          </select>
        );
      case 'enum':
        return (
          <select
            {...register(path)}
            className='form-input'
          >
            <option value=''>Select {attr.label || attr.key}</option>
            {(attr.options || []).map((o, i) => (
              <option
                key={i}
                value={o.value}
              >
                {o.label || o.value}
              </option>
            ))}
          </select>
        );
      case 'multi_enum':
        return (
          <Controller
            control={control}
            name={path as any}
            render={({ field }) => {
              const selectedCSV = field.value || '';
              const selected = new Set(
                selectedCSV
                  .split(',')
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              );
              const toggle = (val: string) => {
                const next = new Set(selected);
                if (next.has(val)) next.delete(val);
                else next.add(val);
                field.onChange(Array.from(next).join(','));
              };
              return (
                <div className='flex flex-wrap gap-2'>
                  {(attr.options || []).map((o, i) => {
                    const val = o.value;
                    const isOn = selected.has(val);
                    return (
                      <button
                        type='button'
                        key={i}
                        onClick={() => toggle(val)}
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                          isOn
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        )}
                        title={o.label || o.value}
                      >
                        {looksLikeHex(val) ? (
                          <span className='inline-flex items-center gap-2'>
                            <span
                              className='inline-block h-3 w-3 rounded border'
                              style={{
                                background: normalizeHex(withHash(val)) || val,
                              }}
                            />
                            {o.label || val}
                          </span>
                        ) : (
                          o.label || val
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            }}
          />
        );
      default:
        return (
          <input
            {...register(path)}
            {...commonProps}
          />
        );
    }
  };

  /* -----------------------------------------
     INVENTORY helpers
  ------------------------------------------ */
  const computeStockFromVariants = (vv: any[]): number => {
    let total = 0;
    for (const v of vv || []) {
      if (Array.isArray(v.sizes) && v.sizes.length > 0) {
        for (const s of v.sizes)
          total += Math.max(0, Math.trunc(Number(v.quantities?.[s] || 0)));
      } else if (Number.isFinite(v.colorQuantity)) {
        total += Math.max(0, Math.trunc(Number(v.colorQuantity || 0)));
      }
    }
    return total;
  };

  const computedTotalStock = useMemo(
    () => computeStockFromVariants(variants),
    [variants]
  );

  /* -----------------------------------------
     SUBMIT
  ------------------------------------------ */
  const onSubmit = async (data: ProductFormData) => {
    const filteredImages = (data.images || [])
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const cleanedVariants = (data.variants || []).map((v: any) => {
      if (Array.isArray(v.sizes) && v.sizes.length > 0) {
        const sizes = Array.from(new Set(v.sizes));
        const q: Record<string, number> = {};
        const p: Record<string, number> = {};
        sizes.forEach((s) => {
          q[s] = Number.isFinite(v.quantities?.[s])
            ? Math.trunc(Number(v.quantities[s]))
            : 0;
          p[s] = Number.isFinite(v.prices?.[s]) ? Number(v.prices[s]) : 0;
        });
        return {
          ...v,
          sizes,
          quantities: q,
          prices: p,
          colorQuantity: undefined,
          colorPrice: undefined,
        };
      }
      const colorQuantity = Number.isFinite(v.colorQuantity)
        ? Math.trunc(Number(v.colorQuantity))
        : 0;
      const colorPrice = Number.isFinite(v.colorPrice)
        ? Number(v.colorPrice)
        : 0;
      return {
        color: v.color,
        colorQuantity: Math.max(0, colorQuantity),
        colorPrice: Math.max(0, colorPrice),
        sizes: [],
        quantities: {},
        prices: {},
      };
    });

    const finalStock = hasMultiInventory
      ? computeStockFromVariants(cleanedVariants)
      : Math.max(0, Math.trunc(Number(data.stock || 0)));

    const finalValues: ProductFormData = {
      ...data,
      images: filteredImages,
      variants: cleanedVariants,
      stock: finalStock,
      sku: data.sku?.trim() || '',
      brandId: data.brandId ?? null,
    };

    onCreate({ formValues: finalValues, files });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className='modern-product-modal'
    >
      <div
        className='modal-overlay'
        aria-hidden='true'
      />
      <div className='modal-container'>
        <Dialog.Panel className='modal-panel'>
          {/* Header */}
          <div className='modal-header'>
            <div className='header-content'>
              <div className='header-icon'>
                <div className='icon-backdrop'>
                  <Award className='icon' />
                </div>
              </div>
              <div className='header-text'>
                <Dialog.Title className='modal-title'>
                  Add New Product
                </Dialog.Title>
                <p className='modal-subtitle'>
                  Add a new product to your catalog
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='close-button'
              aria-label='Close modal'
            >
              <X className='close-icon' />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='modal-form'
          >
            <div className='form-scrollable-content'>
              {/* Basic Information */}
              <div className='form-section'>
                <div className='section-header'>
                  <FileText className='section-icon' />
                  <h3 className='section-title'>Basic Information</h3>
                </div>

                <div className='form-grid'>
                  <div className='form-group'>
                    <label className='form-label'>
                      Product Name <span className='required-indicator'>*</span>
                    </label>
                    <div className='input-container'>
                      <input
                        {...register('name')}
                        className={cn(
                          'form-input',
                          errors.name && 'input-error'
                        )}
                        placeholder='Enter product name'
                      />
                      {errors.name && (
                        <div className='error-message'>
                          <span>{errors.name.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='form-group'>
                    <label className='form-label'>
                      Base Price ($){' '}
                      <span className='required-indicator'>*</span>
                    </label>
                    <div className='input-container'>
                      <div className='input-with-icon'>
                        <DollarSign className='input-icon' />
                        <input
                          type='number'
                          step='0.01'
                          {...register('price', { valueAsNumber: true })}
                          className={cn(
                            'form-input pl-9',
                            errors.price && 'input-error'
                          )}
                          placeholder='0.00'
                        />
                      </div>
                      {errors.price && (
                        <div className='error-message'>
                          <span>{errors.price.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional SKU / Brand */}
                <div className='form-grid'>
                  <div className='form-group'>
                    <label className='form-label'>SKU</label>
                    <div className='input-container'>
                      <input
                        {...register('sku')}
                        className='form-input'
                        placeholder='SKU-12345'
                      />
                    </div>
                  </div>
                  <div className='form-group'>
                    <label className='form-label'>Brand ID</label>
                    <div className='input-container'>
                      <input
                        {...register('brandId')}
                        className='form-input'
                        placeholder='brand-id (optional)'
                      />
                    </div>
                  </div>
                </div>

                <div className='form-group'>
                  <label className='form-label'>
                    Description <span className='required-indicator'>*</span>
                  </label>
                  <div className='input-container'>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className={cn(
                        'form-input',
                        errors.description && 'input-error'
                      )}
                      placeholder='Describe your product in detail...'
                    />
                    {errors.description && (
                      <div className='error-message'>
                        <span>{errors.description.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category & Attributes */}
              <div className='form-section'>
                <div className='section-header'>
                  <Grid className='section-icon' />
                  <h3 className='section-title'>Category & Attributes</h3>
                </div>

                <div className='form-grid'>
                  <div className='form-group'>
                    <label className='form-label'>
                      Category <span className='required-indicator'>*</span>
                    </label>
                    <div className='input-container'>
                      <select
                        {...register('category')}
                        disabled={catsFetching}
                        className={cn(
                          'form-input',
                          errors.category && 'input-error'
                        )}
                        onChange={(e) => {
                          setValue('category', e.target.value);
                          setValue('subcategory', '');
                          setValue('attributes', {});
                          setValue('variants', []);
                        }}
                      >
                        <option value=''>Select Category</option>
                        {mainCategories.map((c: any) => (
                          <option
                            key={c.id}
                            value={c.id}
                          >
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <div className='error-message'>
                          <span>{errors.category.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='form-group'>
                    <label className='form-label'>
                      Subcategory <span className='required-indicator'>*</span>
                    </label>
                    <div className='input-container'>
                      <select
                        {...register('subcategory')}
                        disabled={!selectedMainId}
                        className={cn(
                          'form-input',
                          errors.subcategory && 'input-error'
                        )}
                        onChange={(e) => {
                          setValue('subcategory', e.target.value);
                          setValue('attributes', {});
                          setValue('variants', []);
                        }}
                      >
                        <option value=''>Select Subcategory</option>
                        {subcategories.map((s: any) => (
                          <option
                            key={s.id}
                            value={s.id}
                          >
                            {s.name}
                          </option>
                        ))}
                      </select>
                      {errors.subcategory && (
                        <div className='error-message'>
                          <span>{errors.subcategory.message}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {!!selectedMainId &&
                  !!selectedSubId &&
                  dynamicAttributes.length > 0 && (
                    <div className='attributes-section'>
                      <div className='section-subheader'>
                        <Tag className='subheader-icon' />
                        <h4 className='subheader-title'>Product Attributes</h4>
                      </div>
                      <div className='form-grid'>
                        {dynamicAttributes.map((attr) => (
                          <div
                            key={attr.id}
                            className='form-group'
                          >
                            <label className='form-label'>
                              {attr.label || attr.key}
                            </label>
                            <div className='input-container'>
                              {renderAttributeField(attr)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Inventory */}
              <div className='form-section'>
                <div className='section-header'>
                  <Package className='section-icon' />
                  <h3 className='section-title'>Inventory</h3>
                </div>
                {!hasMultiInventory ? (
                  <div className='form-grid'>
                    <div className='form-group'>
                      <label className='form-label'>Quantity</label>
                      <div className='input-container'>
                        <input
                          type='number'
                          min={0}
                          className={cn(
                            'form-input',
                            errors.stock && 'input-error'
                          )}
                          {...register('stock', { valueAsNumber: true })}
                          placeholder='0'
                        />
                        {errors.stock && (
                          <div className='error-message'>
                            <span>{errors.stock.message as string}</span>
                          </div>
                        )}
                      </div>
                      <p className='text-xs text-gray-500 mt-1'>
                        No multi-value variants — set a single quantity.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className='rounded-md border p-3 bg-gray-50 text-sm text-gray-700'>
                    Quantities are set <strong>per variant</strong> below.
                    <span className='ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-white'>
                      Total stock:{' '}
                      <span className='font-semibold'>
                        {computedTotalStock}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* VARIANTS: Color + Size */}
              {supportsColorAndSize && (
                <div className='form-section'>
                  <div className='section-header'>
                    <Edit3 className='section-icon' />
                    <h3 className='section-title'>
                      Variants (Color • Size • Quantity • Price)
                    </h3>
                  </div>
                  <div className='space-y-4'>
                    {(variants || []).map((v: any, idx: number) => {
                      const sizeList: string[] = v.sizes || [];
                      return (
                        <div
                          key={idx}
                          className='variant-card'
                        >
                          <div className='variant-head'>
                            <span className='variant-title'>
                              Variant {idx + 1} {v.color ? `• ${v.color}` : ''}
                            </span>
                            <button
                              type='button'
                              onClick={() => deleteVariant(idx)}
                              className='remove-image-btn'
                              aria-label='Delete variant'
                            >
                              <Trash2 className='remove-icon' />
                            </button>
                          </div>

                          <div className='form-grid'>
                            <div className='form-group'>
                              <label className='form-label'>
                                Color
                                <span className='required-indicator'>*</span>
                              </label>
                              <div className='input-container'>
                                <select
                                  className={cn(
                                    'form-input',
                                    !v.color && 'input-error'
                                  )}
                                  value={v.color || ''}
                                  onChange={(e) =>
                                    updateVariantColor(idx, e.target.value)
                                  }
                                >
                                  <option value=''>Select color</option>
                                  {colorChoices.map((c) => (
                                    <option
                                      key={c.value}
                                      value={c.value}
                                    >
                                      {c.display}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Add size row */}
                          <div className='form-grid'>
                            <div className='form-group'>
                              <label className='form-label'>Size</label>
                              <div className='input-container'>
                                <select
                                  className='form-input'
                                  value={tempSize[idx] ?? ''}
                                  onChange={(e) =>
                                    setTempSize((prev) => ({
                                      ...prev,
                                      [idx]: e.target.value,
                                    }))
                                  }
                                >
                                  <option value=''>Select size</option>
                                  {sizeChoices.map((s) => (
                                    <option
                                      key={s}
                                      value={s}
                                    >
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className='form-group'>
                              <label className='form-label'>Qty</label>
                              <div className='input-container'>
                                <input
                                  type='number'
                                  min={0}
                                  className='form-input'
                                  value={tempQty[idx] ?? 0}
                                  onChange={(e) =>
                                    setTempQty((prev) => ({
                                      ...prev,
                                      [idx]: Math.max(
                                        0,
                                        Math.trunc(Number(e.target.value || 0))
                                      ),
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className='form-group'>
                              <label className='form-label'>Price</label>
                              <div className='input-container'>
                                <input
                                  type='number'
                                  step='0.01'
                                  min={0}
                                  className='form-input'
                                  value={tempPrice[idx] ?? 0}
                                  onChange={(e) =>
                                    setTempPrice((prev) => ({
                                      ...prev,
                                      [idx]: Math.max(
                                        0,
                                        Number(e.target.value || 0)
                                      ),
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className='form-group'>
                              <label className='form-label invisible'>
                                Add
                              </label>
                              <div className='input-container'>
                                <button
                                  type='button'
                                  onClick={() => addSizeRow(idx)}
                                  className='add-image-btn'
                                  disabled={!tempSize[idx]}
                                  title={
                                    editingRow[idx]
                                      ? 'Save changes to this size'
                                      : 'Add size row'
                                  }
                                >
                                  {editingRow[idx] ? (
                                    <>
                                      <Check className='btn-icon' />
                                      Save Size
                                    </>
                                  ) : (
                                    <>
                                      <Plus className='btn-icon' />
                                      Add Size
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Existing size rows */}
                          {sizeList.length > 0 && (
                            <div className='form-group'>
                              <label className='form-label'>Added Sizes</label>
                              <div className='variant-qty-grid'>
                                {sizeList.map((s: string) => (
                                  <div
                                    key={s}
                                    className='qty-cell flex items-center gap-3'
                                  >
                                    <span className='qty-size min-w-[56px] font-medium'>
                                      {s}
                                    </span>

                                    <div className='flex items-center gap-2'>
                                      <span className='text-sm opacity-80'>
                                        Qty
                                      </span>
                                      <input
                                        type='number'
                                        min={0}
                                        className='form-input w-24'
                                        value={
                                          Number.isFinite(v.quantities?.[s])
                                            ? v.quantities[s]
                                            : 0
                                        }
                                        onChange={(e) => {
                                          const val = Math.max(
                                            0,
                                            Math.trunc(
                                              Number(e.target.value || 0)
                                            )
                                          );
                                          const next = variants.map(
                                            (item: any, i: number) =>
                                              i !== idx
                                                ? item
                                                : {
                                                    ...item,
                                                    quantities: {
                                                      ...(item.quantities ||
                                                        {}),
                                                      [s]: val,
                                                    },
                                                  }
                                          );
                                          setValue('variants', next, {
                                            shouldValidate: true,
                                          });
                                        }}
                                      />
                                    </div>

                                    <div className='flex items-center gap-2'>
                                      <span className='text-sm opacity-80'>
                                        Price
                                      </span>
                                      <input
                                        type='number'
                                        step='0.01'
                                        min={0}
                                        className='form-input w-28'
                                        value={
                                          Number.isFinite(v.prices?.[s])
                                            ? v.prices[s]
                                            : 0
                                        }
                                        onChange={(e) => {
                                          const val = Math.max(
                                            0,
                                            Number(e.target.value || 0)
                                          );
                                          const next = variants.map(
                                            (item: any, i: number) =>
                                              i !== idx
                                                ? item
                                                : {
                                                    ...item,
                                                    prices: {
                                                      ...(item.prices || {}),
                                                      [s]: val,
                                                    },
                                                  }
                                          );
                                          setValue('variants', next, {
                                            shouldValidate: true,
                                          });
                                        }}
                                      />
                                    </div>

                                    <>
                                      <button
                                        type='button'
                                        className='remove-image-btn'
                                        onClick={() => startEditSizeRow(idx, s)}
                                        title='Edit with Add bar'
                                      >
                                        <Pencil className='remove-icon' />
                                      </button>
                                      <button
                                        type='button'
                                        className='remove-image-btn'
                                        onClick={() => deleteSizeRow(idx, s)}
                                        title='Delete size row'
                                      >
                                        <Trash2 className='remove-icon' />
                                      </button>
                                    </>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <button
                      type='button'
                      onClick={addVariantColorSize}
                      className='add-image-btn'
                    >
                      <Plus className='btn-icon' />
                      Add Color Variant
                    </button>

                    {errors.variants && (
                      <div className='error-message'>
                        <span>
                          Check your variants (color + at least one size row
                          with qty & price).
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VARIANTS: Color only */}
              {supportsColorOnly && (
                <div className='form-section'>
                  <div className='section-header'>
                    <Edit3 className='section-icon' />
                    <h3 className='section-title'>
                      Variants (Color • Quantity • Price)
                    </h3>
                  </div>
                  <div className='space-y-4'>
                    {(variants || []).map((v: any, idx: number) => (
                      <div
                        key={idx}
                        className='variant-card'
                      >
                        <div className='variant-head'>
                          <span className='variant-title'>
                            Variant {idx + 1} {v.color ? `• ${v.color}` : ''}
                          </span>
                          <button
                            type='button'
                            onClick={() => deleteVariant(idx)}
                            className='remove-image-btn'
                            aria-label='Delete variant'
                          >
                            <Trash2 className='remove-icon' />
                          </button>
                        </div>

                        <div className='form-grid'>
                          <div className='form-group'>
                            <label className='form-label'>
                              Color<span className='required-indicator'>*</span>
                            </label>
                            <div className='input-container'>
                              <select
                                className={cn(
                                  'form-input',
                                  !v.color && 'input-error'
                                )}
                                value={v.color || ''}
                                onChange={(e) => {
                                  const next = variants.map(
                                    (it: any, i: number) =>
                                      i === idx
                                        ? { ...it, color: e.target.value }
                                        : it
                                  );
                                  setValue('variants', next, {
                                    shouldValidate: true,
                                  });
                                }}
                              >
                                <option value=''>Select color</option>
                                {colorChoices.map((c) => (
                                  <option
                                    key={c.value}
                                    value={c.value}
                                  >
                                    {c.display}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className='form-group'>
                            <label className='form-label'>Quantity</label>
                            <div className='input-container'>
                              <input
                                type='number'
                                min={0}
                                className='form-input'
                                value={
                                  Number.isFinite(v.colorQuantity)
                                    ? v.colorQuantity
                                    : 0
                                }
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Math.trunc(Number(e.target.value || 0))
                                  );
                                  const next = variants.map(
                                    (it: any, i: number) =>
                                      i === idx
                                        ? { ...it, colorQuantity: val }
                                        : it
                                  );
                                  setValue('variants', next, {
                                    shouldValidate: true,
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className='form-group'>
                            <label className='form-label'>Price</label>
                            <div className='input-container'>
                              <input
                                type='number'
                                step='0.01'
                                min={0}
                                className='form-input'
                                value={
                                  Number.isFinite(v.colorPrice)
                                    ? v.colorPrice
                                    : 0
                                }
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    Number(e.target.value || 0)
                                  );
                                  const next = variants.map(
                                    (it: any, i: number) =>
                                      i === idx
                                        ? { ...it, colorPrice: val }
                                        : it
                                  );
                                  setValue('variants', next, {
                                    shouldValidate: true,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type='button'
                      onClick={addVariantColorOnly}
                      className='add-image-btn'
                    >
                      <Plus className='btn-icon' />
                      Add Color Variant
                    </button>

                    {errors.variants && (
                      <div className='error-message'>
                        <span>Each color must include quantity and price.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Media */}
              <div className='form-section'>
                <div className='section-header'>
                  <ImageIcon className='section-icon' />
                  <h3 className='section-title'>Media</h3>
                </div>

                <div className='form-group'>
                  <label className='form-label'>Product Video URL</label>
                  <div className='input-container'>
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 input-with-icon'>
                        <Video className='input-icon' />
                        <input
                          {...register('video')}
                          type='url'
                          className={cn(
                            'form-input pl-9',
                            errors.video && 'input-error'
                          )}
                          placeholder='https://example.com/video.mp4'
                        />
                      </div>
                      <VideoPreviewButton
                        url={watch('video')}
                        disabled={!!errors.video || !watch('video')}
                      />
                    </div>
                    {errors.video && (
                      <div className='error-message'>
                        <span>{errors.video.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='form-group'>
                  <label className='form-label'>
                    Upload Images (1–5 files)
                  </label>
                  <div className='input-container'>
                    <MediaUploadPreview
                      files={files}
                      onChange={setFiles}
                      max={5}
                    />
                    {files.length === 0 && (
                      <div className='text-xs text-amber-600 mt-2'>
                        At least one image file is recommended for a new
                        product.
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional URL inputs */}
                <div className='form-group'>
                  <label className='form-label'>Video URLs (optional)</label>
                  <div className='input-container'>
                    <Controller
                      name='images'
                      control={control}
                      render={() => (
                        <div className='images-container'>
                          {imageInputs.map((url, index) => (
                            <div
                              key={index}
                              className='image-input-group'
                            >
                              <div className='input-with-icon'>
                                <ImageIcon className='input-icon' />
                                <input
                                  type='url'
                                  value={url}
                                  onChange={(e) =>
                                    updateImageUrl(index, e.target.value)
                                  }
                                  className={cn(
                                    'form-input pl-9',
                                    errors.images && 'input-error'
                                  )}
                                  placeholder='https://example.com/image.jpg'
                                />
                              </div>
                              {imageInputs.length > 1 && (
                                <button
                                  type='button'
                                  onClick={() => removeImageInput(index)}
                                  className='remove-image-btn'
                                  aria-label='Remove image'
                                >
                                  <Trash2 className='remove-icon' />
                                </button>
                              )}
                            </div>
                          ))}

                          {imageInputs.length < 5 && (
                            <button
                              type='button'
                              onClick={addImageInput}
                              className='add-image-btn'
                            >
                              <Plus className='btn-icon' />
                              Add Image URL
                            </button>
                          )}
                        </div>
                      )}
                    />
                    {errors.images && (
                      <div className='error-message'>
                        <span>{(errors.images as any).message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='modal-actions'>
              <button
                type='button'
                onClick={onClose}
                className='cancel-button'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className={cn('submit-button', isSubmitting && 'submitting')}
              >
                {isSubmitting ? (
                  <div className='button-loading'>
                    <div className='button-spinner'></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ProductCreateModal;
