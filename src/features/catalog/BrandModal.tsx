import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Image as ImageIcon } from 'lucide-react';

export interface CategoryOption {
  id: string;
  name: string;
  parentId?: string;
}

const schema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  website: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^(https?:\/\/)/i.test(v), {
      message: 'Website must start with http:// or https://',
    }),
  mainCategoryId: z.string().min(1, 'Please select a main category'),
  isActive: z.boolean(),
  imagePreviewUrl: z.string().optional(),
  imageFile: z.instanceof(File).optional(),
});

export type BrandFormData = z.infer<typeof schema>;

export default function BrandModal({
  isOpen,
  onClose,
  onSave,
  brand,
  categories,
  mode = 'create',
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BrandFormData) => void;
  brand?: BrandFormData | null;
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
  } = useForm<BrandFormData>({
    resolver: zodResolver(schema),
    defaultValues: brand || {
      name: '',
      slug: '',
      description: '',
      website: '',
      mainCategoryId: '',
      isActive: true,
      imagePreviewUrl: '',
      imageFile: undefined,
    },
  });

  React.useEffect(() => {
    reset(
      brand || {
        name: '',
        slug: '',
        description: '',
        website: '',
        mainCategoryId: '',
        isActive: true,
        imagePreviewUrl: '',
        imageFile: undefined,
      }
    );
  }, [brand, reset]);

  const nameVal = watch('name');
  const slugVal = watch('slug');
  const isActive = watch('isActive');
  const img = watch('imagePreviewUrl');

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

  const hasCategories = categories?.length > 0;
  const topLevelCategories = categories.filter((c) => !c.parentId);

  const onSubmit = (data: BrandFormData) => {
    onSave(data);
  };

  return (
    <Transition
      show={isOpen}
      as={React.Fragment}
    >
      <Dialog
        as='div'
        className='relative z-[9999]'
        onClose={onClose}
      >
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm' />
        <div className='fixed inset-0 flex items-center justify-center p-4'>
          <Dialog.Panel className='w-full max-w-lg rounded-lg border border-gray-200 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated shadow-xl transition-all'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-gray-200 dark:border-darkSurface-stroke px-6 py-3'>
              <Dialog.Title className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
                {mode === 'create' ? 'Add Brand' : 'Edit Brand'}
              </Dialog.Title>
              <button
                onClick={onClose}
                className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='p-6 space-y-4'
            >
              {/* Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Name
                </label>
                <input
                  {...register('name')}
                  className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-none p-2.5 text-sm'
                  placeholder='e.g., TechBrand'
                />
                {errors.name && (
                  <p className='text-xs text-red-500 mt-1'>
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Slug
                </label>
                <input
                  {...register('slug')}
                  className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-none p-2.5 text-sm'
                  placeholder='techbrand'
                />
                {errors.slug && (
                  <p className='text-xs text-red-500 mt-1'>
                    {errors.slug.message}
                  </p>
                )}
              </div>

              {/* Main Category */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Main Category
                </label>
                <select
                  {...register('mainCategoryId')}
                  className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none p-2.5 text-sm'
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
                {errors.mainCategoryId && (
                  <p className='text-xs text-red-500 mt-1'>
                    {errors.mainCategoryId.message}
                  </p>
                )}
              </div>

              {/* Website */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Website
                </label>
                <input
                  {...register('website')}
                  className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-none p-2.5 text-sm'
                  placeholder='https://example.com'
                />
                {errors.website && (
                  <p className='text-xs text-red-500 mt-1'>
                    {errors.website.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-none p-2.5 text-sm'
                  placeholder='(Optional) Short description…'
                />
              </div>

              {/* Active toggle */}
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Active
                </span>
                <button
                  type='button'
                  onClick={() =>
                    setValue('isActive', !isActive, { shouldDirty: true })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    isActive ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Logo */}
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Brand Logo
                </label>
                {!img ? (
                  <label className='flex items-center justify-center w-full h-28 border border-dashed rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-darkSurface-floating bg-white dark:bg-darkSurface-base transition'>
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
                      className='h-20 w-20 rounded object-cover border dark:border-darkSurface-stroke'
                    />
                    <div className='flex gap-2'>
                      <label className='px-3 py-2 text-sm rounded-md border dark:border-darkSurface-stroke cursor-pointer bg-white dark:bg-darkSurface-elevated hover:bg-gray-50 dark:hover:bg-darkSurface-floating transition'>
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
                        className='px-3 py-2 text-sm rounded-md border text-red-600 hover:bg-red-50 dark:hover:bg-darkSurface-floating bg-white dark:bg-darkSurface-elevated transition'
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-darkSurface-stroke'>
                <button
                  type='button'
                  onClick={onClose}
                  className='px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-darkSurface-stroke text-gray-700 dark:text-gray-300 bg-white dark:bg-darkSurface-base hover:bg-gray-50 dark:hover:bg-darkSurface-floating transition'
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 transition'
                  disabled={!hasCategories}
                >
                  {mode === 'create' ? 'Create Brand' : 'Save Changes'}
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Transition>
  );
}
