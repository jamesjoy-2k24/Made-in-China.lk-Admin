import React from 'react';
import { Dialog } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { X, Image as ImageIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';

/* ---------------- Schema ---------------- */
const schema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean(),
  imagePreviewUrl: z.string().optional(),
  imageFile: z.any().optional(),
});

export type CategoryFormData = z.infer<typeof schema>;

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => void;
  category?: CategoryFormData | null;
  mode?: 'create' | 'edit';
}

/* ---------------- Utils ---------------- */
const slugify = (val: string) =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

/* ---------------- Toggle ---------------- */
const ToggleBtn: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label = 'Status' }) => (
  <div className='flex items-center justify-between'>
    <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
      {label}
    </span>
    <button
      type='button'
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-green-500' : 'bg-gray-400 dark:bg-darkSurface-stroke'
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

/* ---------------- Modal ---------------- */
const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  mode = 'create',
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: category || {
      name: '',
      slug: '',
      description: '',
      parentId: '',
      isActive: true,
      imagePreviewUrl: '',
      imageFile: undefined,
    },
  });

  React.useEffect(() => {
    reset(
      category || {
        name: '',
        slug: '',
        description: '',
        parentId: '',
        isActive: true,
        imagePreviewUrl: '',
        imageFile: undefined,
      }
    );
  }, [category, reset]);

  const nameVal = watch('name');
  const slugVal = watch('slug');
  const isActiveVal = watch('isActive');
  const imagePreviewUrl = watch('imagePreviewUrl');

  React.useEffect(() => {
    if (!slugVal || slugVal === slugify(slugVal)) {
      setValue('slug', slugify(nameVal || ''));
    }
  }, [nameVal, slugVal, setValue]);

  const onSubmit = (data: CategoryFormData) => onSave(data);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setValue('imagePreviewUrl', url, { shouldDirty: true });
    setValue('imageFile', file as any, { shouldDirty: true });
  };

  const clearImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setValue('imagePreviewUrl', '', { shouldDirty: true });
    setValue('imageFile', undefined, { shouldDirty: true });
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className='relative z-[9999]'
    >
      {/* Glassy backdrop */}
      <div
        className='fixed inset-0 bg-black/40 backdrop-blur-sm'
        aria-hidden='true'
      />
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Dialog.Panel className='w-full max-w-lg rounded-lg bg-white dark:bg-darkSurface-elevated border border-gray-200 dark:border-darkSurface-stroke shadow-xl p-6'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-gray-200 dark:border-darkSurface-stroke pb-3'>
            <Dialog.Title className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
              {mode === 'create' ? 'Add Category' : 'Edit Category'}
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
                className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 px-3 py-2 text-sm'
                placeholder='e.g., Electronics'
              />
              {errors.name && (
                <p className='text-sm text-red-500 mt-1'>
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
                className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 px-3 py-2 text-sm'
                placeholder='electronics'
              />
              {errors.slug && (
                <p className='text-sm text-red-500 mt-1'>
                  {errors.slug.message}
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
                className='mt-1 w-full rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 px-3 py-2 text-sm'
                placeholder='(Optional) Short description…'
              />
            </div>

            {/* Active Toggle */}
            <div className='pt-2'>
              <ToggleBtn
                checked={isActiveVal}
                onChange={(v) => setValue('isActive', v, { shouldDirty: true })}
                label='Active'
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Category Image
              </label>
              {!imagePreviewUrl ? (
                <label className='flex items-center justify-center w-full h-28 border border-dashed border-gray-300 dark:border-darkSurface-stroke rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-darkSurface-floating bg-white dark:bg-darkSurface-base transition'>
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
                    src={imagePreviewUrl}
                    alt='Preview'
                    className='h-20 w-20 rounded object-cover border border-gray-300 dark:border-darkSurface-stroke'
                  />
                  <div className='flex gap-2'>
                    <label className='px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-darkSurface-stroke cursor-pointer hover:bg-gray-50 dark:hover:bg-darkSurface-floating bg-white dark:bg-darkSurface-base text-gray-700 dark:text-gray-200'>
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
                      className='px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-darkSurface-stroke text-red-600 hover:bg-red-50 dark:hover:bg-darkSurface-floating bg-white dark:bg-darkSurface-base'
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-darkSurface-stroke'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-darkSurface-stroke text-gray-700 dark:text-gray-200 bg-white dark:bg-darkSurface-base hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:ring-2 focus:ring-primary-500'
              >
                {mode === 'create' ? 'Create Category' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default CategoryModal;
