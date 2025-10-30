import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Image as ImageIcon,
  ToggleLeft,
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { toast } from 'react-toastify';

import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';
import SubCategoryModal, { SubCategoryFormData } from './SubCategoryModal';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateCategoryUploadMutation,
  useUpdateCategoryUploadMutation,
} from './api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  isActive: boolean;
  productsCount?: number;
  createdAt?: string | number;
  imageUrl?: string | null;
}

export interface SubCategory extends Category {
  parentId: string;
  /** NEW */
  shippingType?: 'air' | 'sea' | null;
  shippingRate?: number | null;
}

/* ------------ Helpers ------------ */
const slugify = (val: string) =>
  val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

const SubCategoriesPage: React.FC = () => {
  const token = useSelector((s: RootState) => s.auth.token);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SubCategory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = React.useState<SubCategory | null>(null);

  // API hooks
  const {
    data: allCategories,
    isLoading,
    error,
    refetch,
  } = useListCategoriesQuery(undefined, { skip: !token });

  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [createCategoryUpload] = useCreateCategoryUploadMutation();
  const [updateCategoryUpload] = useUpdateCategoryUploadMutation();

  const categories = React.useMemo(
    () =>
      allCategories
        ?.filter((c: any) => !c.parentId)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          isActive: c.status === 'active',
        })) ?? [],
    [allCategories]
  );

  const subCategories: SubCategory[] = React.useMemo(
    () =>
      allCategories
        ?.filter((c: any) => c.parentId)
        .map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          parentId: c.parentId,
          isActive: c.status === 'active',
          createdAt: c.createdAt,
          imageUrl: c.image,
          productsCount: c.productsCount,
          // NEW
          shippingType: c.shippingType ?? null,
          shippingRate: c.shippingRate ?? null,
        })) ?? [],
    [allCategories]
  );

  const filtered = React.useMemo(() => {
    const q = searchTerm.toLowerCase();
    return subCategories.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.isActive) ||
        (statusFilter === 'inactive' && !s.isActive);
      return matchSearch && matchStatus;
    });
  }, [subCategories, searchTerm, statusFilter]);

  /* ------------ CRUD ------------ */
  const handleSave = async (data: SubCategoryFormData) => {
    const status = data.isActive ? 'active' : 'archived';
    const slug = data.slug || slugify(data.name);
    try {
      if (editing) {
        const patch: any = {
          name: data.name,
          slug,
          parentId: data.parentId,
          description: data.description,
          status,
          // NEW
          shippingType: data.shippingType,
          shippingRate: data.shippingRate,
        };

        if (data.imageFile) {
          const form = new FormData();
          for (const [k, v] of Object.entries(patch)) form.append(k, String(v ?? ''));
          form.append('file', data.imageFile);
          await updateCategoryUpload({ id: editing.id, form }).unwrap();
        } else {
          await updateCategory({ id: editing.id, patch }).unwrap();
        }
        toast.success('Subcategory updated successfully');
      } else {
        const body: any = {
          name: data.name,
          slug,
          parentId: data.parentId,
          description: data.description,
          status,
          // NEW
          shippingType: data.shippingType,
          shippingRate: data.shippingRate,
        };

        if (data.imageFile) {
          const form = new FormData();
          for (const [k, v] of Object.entries(body)) form.append(k, String(v ?? ''));
          form.append('file', data.imageFile);
          await createCategoryUpload(form).unwrap();
        } else {
          await createCategory(body).unwrap();
        }
        toast.success('Subcategory created successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Error saving subcategory');
    }
  };

  const handleDelete = async () => {
    if (!selectedSubCategory) return;
    try {
      await deleteCategory({ id: selectedSubCategory.id, hard: true }).unwrap();
      toast.success('Subcategory deleted');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedSubCategory) return;
    try {
      const newStatus = selectedSubCategory.isActive ? 'archived' : 'active';
      await updateCategory({
        id: selectedSubCategory.id,
        patch: { status: newStatus },
      }).unwrap();
      toast.success(`Status changed to ${newStatus}`);
      setIsStatusModalOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update status');
    }
  };

  /* ------------ Columns ------------ */
  const columns: ColumnDef<SubCategory>[] = [
    {
      id: 'subcategory',
      header: 'Subcategory',
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className='flex items-center gap-3'>
            {s.imageUrl ? (
              <img src={s.imageUrl} className='h-10 w-10 rounded object-cover border' alt='' />
            ) : (
              <div className='h-10 w-10 rounded border flex items-center justify-center dark:border-gray-700'>
                <ImageIcon className='h-4 w-4 text-gray-400' />
              </div>
            )}
            <div>
              <div className='font-medium text-gray-900 dark:text-gray-100'>{s.name}</div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>/{s.slug}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'parent',
      header: 'Category',
      cell: ({ row }) => {
        const parent = categories.find((c) => c.id === row.original.parentId);
        return <span className='text-sm text-gray-700 dark:text-gray-300'>{parent?.name || '—'}</span>;
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ getValue }) => (
        <span className='text-sm text-gray-600 dark:text-gray-400'>{(getValue() as string) || '—'}</span>
      ),
    },
    /** Optional: show shipping info */
    {
      id: 'shipping',
      header: 'Shipping',
      cell: ({ row }) => {
        const s = row.original;
        if (!s.shippingType || s.shippingRate == null) {
          return <span className='text-sm text-gray-500 dark:text-gray-400'>—</span>;
        }
        const label = s.shippingType === 'air' ? `LKR ${s.shippingRate}/kg` : `LKR ${s.shippingRate}/m³`;
        return <span className='text-sm text-gray-700 dark:text-gray-300'>{label}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return <StatusBadge status={isActive ? 'Active' : 'Inactive'} variant={isActive ? 'success' : 'warning'} />;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => (
        <span className='text-sm text-gray-500 dark:text-gray-400'>{formatDateTime(getValue() as string)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Menu as='div' className='relative inline-block text-left'>
          <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
            <MoreHorizontal className='h-5 w-5' />
          </Menu.Button>
          <Menu.Items className='absolute right-0 z-20 mt-2 w-44 origin-top-right rounded-md bg-white dark:bg-darkSurface-elevated shadow-md ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none'>
            <Menu.Item>
              <button
                onClick={() => {
                  setEditing(row.original);
                  setIsModalOpen(true);
                }}
                className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface'
              >
                <Edit className='mr-3 h-4 w-4' /> Edit
              </button>
            </Menu.Item>
            <Menu.Item>
              <button
                onClick={() => {
                  setSelectedSubCategory(row.original);
                  setIsStatusModalOpen(true);
                }}
                className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface'
              >
                <ToggleLeft className='mr-3 h-4 w-4' /> Toggle Status
              </button>
            </Menu.Item>
            <Menu.Item>
              <button
                onClick={() => {
                  setSelectedSubCategory(row.original);
                  setIsDeleteModalOpen(true);
                }}
                className='flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-darkSurface'
              >
                <Trash2 className='mr-3 h-4 w-4' /> Delete
              </button>
            </Menu.Item>
          </Menu.Items>
        </Menu>
      ),
    },
  ];

  /* ------------ Render ------------ */
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-900 dark:text-gray-100'>Subcategories</h1>
          <p className='text-gray-600 dark:text-gray-400'>Manage and organize subcategories linked to main categories</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setIsModalOpen(true);
          }}
          className='inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
        >
          <Plus className='h-4 w-4 mr-2' /> New Subcategory
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-darkSurface-elevated p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
          <input
            type='text'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='Search subcategories...'
            className='w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-darkSurface focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-500 dark:placeholder-gray-400'
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className='w-48 pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-darkSurface text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
        >
          <option value='all'>All Status</option>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className='text-sm text-gray-500 dark:text-gray-400'>Loading...</div>
      ) : error ? (
        <div className='text-sm text-red-600 dark:text-red-400'>Error loading subcategories.</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No subcategories found'
          description='Create your first subcategory linked to a main category.'
          action={{
            label: 'New Subcategory',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <DataTable columns={columns} data={filtered} enableExport exportFilename='subcategories' className='h-[500px]' />
      )}

      {/* Modal */}
      <SubCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        subCategory={
          editing
            ? {
                name: editing.name,
                slug: editing.slug,
                description: editing.description ?? '',
                parentId: editing.parentId,
                isActive: editing.isActive,
                imagePreviewUrl: editing.imageUrl || undefined,
                // NEW
                shippingType: (editing.shippingType as 'air' | 'sea') ?? 'air',
                shippingRate: Number(editing.shippingRate ?? 0),
              }
            : null
        }
        mode={editing ? 'edit' : 'create'}
      />
    </div>
  );
};

export default SubCategoriesPage;
