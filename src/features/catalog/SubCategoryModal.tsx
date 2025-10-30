import React from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Image as ImageIcon } from 'lucide-react';

export interface CategoryOption {
  id: string;
  name: string;
  parentId?: string;
}

/* ------------------ Schema ------------------ */
const schema = z.object({
  name: z.string().min(1, 'Subcategory name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  parentId: z.string().min(1, 'Please select a Category'),
  isActive: z.boolean(),
  imagePreviewUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
  shippingType: z.enum(['air', 'sea'], {
    required_error: 'Select a shipping type',
  }),
  shippingRate: z
    .number({
      required_error: 'Shipping rate is required',
      invalid_type_error: 'Enter a valid number',
    })
    .min(0, 'Rate must be positive'),
});

export type SubCategoryFormData = z.infer<typeof schema>;

/* ------------------ Component ------------------ */
export default function SubCategoryModal({
  isOpen,
  onClose,
  onSave,
  subCategory,
  categories,
  mode = 'create',
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SubCategoryFormData) => void;
  subCategory?: SubCategoryFormData | null;
  categories: CategoryOption[];
  mode?: 'create' | 'edit';
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SubCategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: subCategory || {
      name: '',
      slug: '',
      description: '',
      parentId: '',
      isActive: true,
      imagePreviewUrl: '',
      imageFile: undefined,
      shippingType: 'air',
      shippingRate: 0,
    },
  });

  /* ------------- Effects ------------- */
  React.useEffect(() => {
    reset(
      subCategory || {
        name: '',
        slug: '',
        description: '',
        parentId: '',
        isActive: true,
        imagePreviewUrl: '',
        imageFile: undefined,
        shippingType: 'air',
        shippingRate: 0,
      }
    );
  }, [subCategory, reset]);

  const nameVal = watch('name');
  const slugVal = watch('slug');
  const isActive = watch('isActive');
  const img = watch('imagePreviewUrl');
  const hasCategories = categories?.length > 0;
  const shippingType = watch('shippingType');

  const slugify = (val: string) =>
    val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  React.useEffect(() => {
    if (!slugVal || slugVal === slugify(slugVal)) {
      setValue('slug', slugify(nameVal || ''));
    }
  }, [nameVal, slugVal, setValue]);

  const onSubmit = (data: SubCategoryFormData) => {
    if (import.meta.env.DEV)
      console.log('[SubCategoryModal] Submitting form:', data);
    onSave(data);
  };

  /* ------------- Image Handling ------------- */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setValue('imagePreviewUrl', url, { shouldDirty: true });
    setValue('imageFile', file, { shouldDirty: true });
  };

  const clearImage = () => {
    if (img) URL.revokeObjectURL(img);
    setValue('imagePreviewUrl', '', { shouldDirty: true });
    setValue('imageFile', undefined, { shouldDirty: true });
  };

  const topLevelCategories = categories.filter((c) => !c.parentId);

  /* ------------------ UI ------------------ */
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className='relative z-[9999]'
    >
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-sm'
        aria-hidden='true'
      />
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Dialog.Panel className='w-full max-w-lg rounded-lg bg-black dark:bg-darkSurface-elevated p-6 shadow-xl transition-all'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3'>
            <Dialog.Title className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {mode === 'create' ? 'Add Subcategory' : 'Edit Subcategory'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              aria-label='Close'
            >
              <X className='h-5 w-5' />
            </button>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='space-y-4 mt-4'
          >
            {/* Name */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Name
              </label>
              <input
                {...register('name')}
                className='mt-1 w-full bg-black dark:bg-darkSurface text-black dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2'
                placeholder='e.g., Laptop Bags'
              />
              {errors.name && (
                <p className='text-sm text-red-500'>{errors.name.message}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Slug
              </label>
              <input
                {...register('slug')}
                className='mt-1 w-full bg-black dark:bg-darkSurface text-black dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2'
                placeholder='laptop-bags'
              />
              {errors.slug && (
                <p className='text-sm text-red-500'>{errors.slug.message}</p>
              )}
            </div>

            {/* Parent Category */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Category
              </label>
              <select
                {...register('parentId')}
                className='mt-1 w-full bg-black dark:bg-darkSurface text-black dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2'
                disabled={!hasCategories}
              >
                <option value=''>Select a Category</option>
                {topLevelCategories.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.parentId && (
                <p className='text-sm text-red-500'>
                  {errors.parentId.message}
                </p>
              )}
            </div>

            {/* Shipping Type + Rate */}
            <div className='space-y-2'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Shipping Type
              </label>
              <select
                {...register('shippingType')}
                className='mt-1 w-full bg-black dark:bg-darkSurface text-black dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2'
              >
                <option value='air'>✈️ Air Cargo — Based on kilograms</option>
                <option value='sea'>🚢 Sea Cargo — Based on volume</option>
              </select>
              {errors.shippingType && (
                <p className='text-sm text-red-500'>
                  {errors.shippingType.message}
                </p>
              )}

              <div className='mt-3'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  {shippingType === 'air'
                    ? 'Price per kilogram (LKR/kg)'
                    : 'Price per cubic meter (LKR/m³)'}
                </label>
                <input
                  type='number'
                  step='0.01'
                  min='0'
                  {...register('shippingRate', { valueAsNumber: true })}
                  className='mt-1 w-full bg-black dark:bg-darkSurface text-black dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2'
                  placeholder={
                    shippingType === 'air'
                      ? 'e.g. 120 (per kg)'
                      : 'e.g. 80 (per m³)'
                  }
                />
                {errors.shippingRate && (
                  <p className='text-sm text-red-500'>
                    {errors.shippingRate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className='mt-1 w-full bg-black dark:bg-darkSurface text-black dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2'
                placeholder='(Optional) Short description…'
              />
            </div>

            {/* Status Toggle */}
            <div className='flex items-center justify-between pt-1'>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Active
              </span>
              <button
                type='button'
                onClick={() =>
                  setValue('isActive', !isActive, { shouldDirty: true })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  isActive ? 'bg-green-500' : 'bg-gray-400'
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Image Upload */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Subcategory Image
              </label>
              {!img ? (
                <label className='flex items-center justify-center w-full h-28 border border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-darkSurface'>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageChange}
                  />
                  <div className='flex items-center space-x-2 text-gray-500 dark:text-gray-400'>
                    <ImageIcon className='h-5 w-5' />
                    <span className='text-sm'>Click to upload</span>
                  </div>
                </label>
              ) : (
                <div className='flex items-start space-x-3'>
                  <img
                    src={img}
                    alt='Preview'
                    className='h-20 w-20 rounded object-cover border dark:border-gray-600'
                  />
                  <div className='flex gap-2'>
                    <label className='px-3 py-2 text-sm rounded-md border cursor-pointer hover:bg-gray-50 dark:hover:bg-darkSurface dark:text-gray-100'>
                      <input
                        type='file'
                        accept='image/*'
                        className='hidden'
                        onChange={handleImageChange}
                      />
                      Change
                    </label>
                    <button
                      type='button'
                      onClick={clearImage}
                      className='px-3 py-2 text-sm rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-darkSurface'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 text-sm rounded-md bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60'
                disabled={!hasCategories}
                title={!hasCategories ? 'Create a Category first' : undefined}
              >
                {mode === 'create' ? 'Create Subcategory' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
