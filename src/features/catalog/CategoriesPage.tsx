import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  FolderOpen,
  Image as ImageIcon,
  Edit,
  ToggleLeft,
  Trash2,
} from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';

import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';
import CategoryModal, { CategoryFormData } from './CategoryModal';
import EditCategoryModal, { EditCategoryFormData } from './EditCategoryModal';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateCategoryUploadMutation,
  useUpdateCategoryUploadMutation,
} from './api';

/* ------------ Types ------------ */
export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  isActive: boolean;
  productsCount: number;
  createdAt: string;
  imageUrl?: string;
}

/* ------------ Helpers ------------ */
const slugify = (val: string) =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const withVersion = (url?: string, ver?: string | number | null) => {
  if (!url) return undefined;
  const v = ver ?? Date.now();
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}v=${v}`;
};

const mapApiToRow = (c: any): CategoryRow => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description || undefined,
  parentId: c.parentId ?? null,
  isActive: c.status === 'active' || !!c.isActive,
  productsCount: c.productsCount || 0,
  createdAt: new Date(c.createdAt).toISOString(),
  imageUrl: c.image || c.imageUrl || undefined,
});

/* ------------ Image with cache-busting ------------ */
const CacheProofImage: React.FC<{
  id: string;
  baseUrl?: string;
  version?: number | string;
  tempPreviewUrl?: string;
  className?: string;
  alt?: string;
  size?: number;
}> = ({
  id,
  baseUrl,
  version,
  tempPreviewUrl,
  className = '',
  alt = '',
  size = 32,
}) => {
  const [src, setSrc] = React.useState<string | undefined>(undefined);
  const key = `${id}-${version || 0}`;

  React.useEffect(() => {
    const next =
      tempPreviewUrl || (baseUrl ? withVersion(baseUrl, version) : undefined);
    setSrc(next);
  }, [id, baseUrl, version, tempPreviewUrl]);

  if (!src)
    return (
      <div
        className={`h-8 w-8 rounded border border-gray-300 dark:border-darkSurface-stroke flex items-center justify-center text-gray-400 ${className}`}
        style={{ height: size, width: size }}
      >
        <ImageIcon className='h-4 w-4' />
      </div>
    );

  return (
    <img
      key={key}
      src={src}
      alt={alt}
      className={`rounded object-cover border border-gray-200 dark:border-darkSurface-stroke ${className}`}
      style={{ height: size, width: size }}
    />
  );
};

/* ------------ Main Component ------------ */
const CategoriesPage: React.FC = () => {
  const token = useSelector((s: RootState) => s.auth.token);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryRow | null>(null);
  const [parentIdFilter, setParentIdFilter] = React.useState<
    string | undefined | 'null'
  >('null');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryRow | null>(null);

  const [tempPreviewById, setTempPreviewById] = React.useState<
    Record<string, string>
  >({});
  const [imageVersionById, setImageVersionById] = React.useState<
    Record<string, number>
  >({});

  const { data, isLoading, error, refetch } = useListCategoriesQuery(
    parentIdFilter === 'all' ? undefined : parentIdFilter,
    { skip: !token }
  );
  const { data: allCategories } = useListCategoriesQuery(undefined, {
    skip: !token,
  });

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createCategoryUpload] = useCreateCategoryUploadMutation();
  const [updateCategoryUpload] = useUpdateCategoryUploadMutation();

  const rows: CategoryRow[] = React.useMemo(() => {
    if (!data) return [];
    return data.map(mapApiToRow).filter((c) => !c.parentId);
  }, [data]);

  const filtered = React.useMemo(() => {
    const q = searchTerm.toLowerCase();
    return rows.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.isActive) ||
        (statusFilter === 'inactive' && !c.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [rows, searchTerm, statusFilter]);

  const onCreateSave = async (dataForm: CategoryFormData) => {
    const status = dataForm.isActive ? 'active' : 'archived';
    const parentId = dataForm.parentId || null;
    const slug = dataForm.slug || slugify(dataForm.name);

    try {
      if (dataForm.imageFile) {
        const form = new FormData();
        form.append('name', dataForm.name);
        if (parentId) form.append('parentId', parentId);
        form.append('status', status);
        form.append('slug', slug);
        if (dataForm.description)
          form.append('description', dataForm.description);
        form.append('file', dataForm.imageFile);
        await createCategoryUpload(form).unwrap();
      } else {
        await createCategory({
          name: dataForm.name,
          parentId,
          status,
          slug,
        }).unwrap();
      }
      toast.success('Category created successfully');
      setIsCreateOpen(false);
      refetch();
    } catch {
      toast.error('Failed to create category');
    }
  };

  const onEditSave = async (formData: EditCategoryFormData) => {
    if (!editing) return;
    const status = formData.isActive ? 'active' : 'archived';
    try {
      if (formData.imageFile) {
        const form = new FormData();
        form.append('name', formData.name);
        form.append('status', status);
        form.append('slug', formData.slug);
        if (formData.description)
          form.append('description', formData.description);
        form.append('file', formData.imageFile as File);
        await updateCategoryUpload({ id: editing.id, form }).unwrap();
        setImageVersionById((v) => ({ ...v, [editing.id]: Date.now() }));
      } else {
        await updateCategory({
          id: editing.id,
          patch: {
            name: formData.name,
            slug: formData.slug,
            status,
            description: formData.description,
          },
        }).unwrap();
      }
      toast.success('Category updated successfully');
      setEditing(null);
      refetch();
    } catch {
      toast.error('Failed to update category');
    }
  };

  const onDelete = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory({ id: selectedCategory.id, hard: true }).unwrap();
      toast.success('Category deleted successfully');
      setIsDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const onToggleStatus = async () => {
    if (!selectedCategory) return;
    try {
      const newStatus = selectedCategory.isActive ? 'archived' : 'active';
      await updateCategory({
        id: selectedCategory.id,
        patch: { status: newStatus },
      }).unwrap();
      toast.success(`Category set to ${newStatus}`);
      setIsStatusModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to change category status');
    }
  };

  const columns: ColumnDef<CategoryRow>[] = [
    {
      id: 'category',
      header: 'Category',
      cell: ({ row }) => {
        const c = row.original;
        const temp = tempPreviewById[c.id];
        const version = imageVersionById[c.id];
        return (
          <div className='flex items-center'>
            <CacheProofImage
              id={c.id}
              baseUrl={c.imageUrl}
              tempPreviewUrl={temp}
              version={version}
              className='mr-3'
              alt={c.name}
              size={32}
            />
            <div>
              <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                {c.name}
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                /{c.slug}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'productsCount',
      header: 'Products',
      cell: ({ getValue }) => (
        <span className='text-sm font-medium text-gray-900 dark:text-gray-200'>
          {getValue() as number}
        </span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const active = getValue() as boolean;
        return (
          <StatusBadge
            status={active ? 'Active' : 'Inactive'}
            variant={active ? 'success' : 'warning'}
          />
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className='text-sm text-gray-600 dark:text-gray-400'>
          {formatDateTime(getValue() as string)}
        </span>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Categories
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Organize your products with top-level categories
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className='inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
        >
          <Plus className='h-4 w-4 mr-2' />
          New Category
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-darkSurface-elevated border border-gray-200 dark:border-darkSurface-stroke p-4 rounded-lg shadow-sm flex flex-wrap gap-4'>
        <div className='relative flex-1 min-w-[200px]'>
          <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='Search categories...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-darkSurface-stroke rounded-md bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 sm:text-sm'
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
        >
          <option value='all'>All Status</option>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
        </select>

        <select
          value={parentIdFilter}
          onChange={(e) => setParentIdFilter(e.target.value || 'all')}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
        >
          <option value='all'>All Categories</option>
          <option value='null'>Top-Level</option>
          {allCategories?.map((c: any) => (
            <option
              key={c.id}
              value={c.id}
            >
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className='text-gray-500 dark:text-gray-400'>Loading...</div>
      ) : error ? (
        <div className='text-red-600 dark:text-red-400'>
          Failed to load categories.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No categories found'
          description='Create a new category to organize your products.'
          action={{
            label: 'New Category',
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          enableExport
          exportFilename='categories'
          rowActions={[
            {
              id: 'edit',
              label: 'Edit Category',
              icon: <Edit className='h-4 w-4' />,
              onClick: (row) => setEditing(row),
            },
            {
              id: 'toggle',
              label: 'Toggle Status',
              icon: <ToggleLeft className='h-4 w-4' />,
              onClick: (row) => {
                setSelectedCategory(row);
                setIsStatusModalOpen(true);
              },
            },
            {
              id: 'delete',
              label: 'Delete',
              icon: <Trash2 className='h-4 w-4' />,
              tone: 'danger',
              onClick: (row) => {
                setSelectedCategory(row);
                setIsDeleteModalOpen(true);
              },
            },
          ]}
        />
      )}

      {/* Modals */}
      <CategoryModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSave={onCreateSave}
        category={null}
        mode='create'
        parentCategories={(allCategories || []).map(mapApiToRow)}
      />

      {editing && (
        <EditCategoryModal
          isOpen={!!editing}
          onClose={() => setEditing(null)}
          onSave={onEditSave}
          initial={{
            name: editing.name,
            slug: editing.slug,
            description: editing.description ?? '',
            isActive: editing.isActive,
            imageUrl: editing.imageUrl,
          }}
        />
      )}

      {/* Delete Dialog */}
      <Transition
        appear
        show={isDeleteModalOpen}
        as={React.Fragment}
      >
        <Dialog
          as='div'
          className='relative z-10'
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <div className='fixed inset-0 bg-black/40 backdrop-blur-sm' />
          <div className='fixed inset-0 flex items-center justify-center p-4'>
            <Dialog.Panel className='w-full max-w-md rounded-lg bg-white dark:bg-darkSurface-elevated border border-gray-200 dark:border-darkSurface-stroke shadow-xl p-6'>
              <Dialog.Title className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                Delete Category
              </Dialog.Title>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                Are you sure you want to delete “{selectedCategory?.name}”? This
                action cannot be undone.
              </p>
              <div className='mt-4 flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700'
                  onClick={onDelete}
                >
                  Delete
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>

      {/* Status Dialog */}
      <Transition
        appear
        show={isStatusModalOpen}
        as={React.Fragment}
      >
        <Dialog
          as='div'
          className='relative z-10'
          onClose={() => setIsStatusModalOpen(false)}
        >
          <div className='fixed inset-0 bg-black/40 backdrop-blur-sm' />
          <div className='fixed inset-0 flex items-center justify-center p-4'>
            <Dialog.Panel className='w-full max-w-md rounded-lg bg-white dark:bg-darkSurface-elevated border border-gray-200 dark:border-darkSurface-stroke shadow-xl p-6'>
              <Dialog.Title className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                Change Category Status
              </Dialog.Title>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                Change “{selectedCategory?.name}” to{' '}
                {selectedCategory?.isActive ? 'archived' : 'active'}?
              </p>
              <div className='mt-4 flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                  onClick={() => setIsStatusModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  className='px-4 py-2 text-sm rounded-md bg-primary-600 text-white hover:bg-primary-700'
                  onClick={onToggleStatus}
                >
                  Confirm
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CategoriesPage;
