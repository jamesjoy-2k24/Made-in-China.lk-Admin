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
  Building,
} from 'lucide-react';
import { Menu, Dialog, Transition } from '@headlessui/react';
import { toast } from 'react-toastify';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';
import BrandModal, { BrandFormData } from './BrandModal';
import {
  useListCategoriesQuery,
  useListBrandsQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useCreateBrandUploadMutation,
  useUpdateBrandUploadMutation,
} from './api';

/* ---------- Types ---------- */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  productsCount: number;
  createdAt: string;
  imageUrl?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  mainCategoryId: string;
  isActive: boolean;
  productsCount: number;
  createdAt: string;
}

/* ---------- Utils ---------- */
const slugify = (val: string) =>
  val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const mapApiToCategory = (c: any): Category => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description || undefined,
  parentId: c.parentId || undefined,
  isActive: c.status === 'active' || c.isActive,
  productsCount: c.productsCount || 0,
  createdAt: new Date(c.createdAt).toISOString(),
  imageUrl: c.image || c.imageUrl || undefined,
});

const mapApiToBrand = (b: any): Brand => ({
  id: b.id,
  name: b.name,
  slug: b.slug,
  description: b.description || undefined,
  logoUrl: b.image || b.logoUrl || undefined,
  website: b.website || undefined,
  mainCategoryId: b.mainCategoryId,
  isActive: b.status === 'active' || b.isActive,
  productsCount: b.productsCount || 0,
  createdAt: new Date(b.createdAt).toISOString(),
});

const BrandsPage: React.FC = () => {
  const token = useSelector((s: RootState) => s.auth.token);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [selectedBrand, setSelectedBrand] = React.useState<Brand | null>(null);

  // Queries
  const { data: allCategories } = useListCategoriesQuery(undefined, {
    skip: !token,
  });
  const {
    data: allBrands,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useListBrandsQuery(undefined, {
    skip: !token,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const [createBrand] = useCreateBrandMutation();
  const [updateBrand] = useUpdateBrandMutation();
  const [deleteBrand] = useDeleteBrandMutation();
  const [createBrandUpload] = useCreateBrandUploadMutation();
  const [updateBrandUpload] = useUpdateBrandUploadMutation();

  const categories: Category[] = React.useMemo(() => {
    if (!allCategories) return [];
    return allCategories.map(mapApiToCategory);
  }, [allCategories]);

  const brands: Brand[] = React.useMemo(() => {
    if (!allBrands) return [];
    return allBrands.map(mapApiToBrand);
  }, [allBrands]);

  const filteredBrands = React.useMemo(() => {
    const q = searchTerm.toLowerCase();
    return brands.filter((brand) => {
      const matchesSearch =
        brand.name.toLowerCase().includes(q) ||
        brand.slug.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && brand.isActive) ||
        (statusFilter === 'inactive' && !brand.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [brands, searchTerm, statusFilter]);

  const openNewBrand = () => {
    setEditingBrand(null);
    setIsModalOpen(true);
  };

  const openEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const openDeleteModal = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteModalOpen(true);
  };

  const onSaveBrand = async (data: BrandFormData) => {
    const status = data.isActive ? 'active' : 'archived';
    const slug = data.slug || slugify(data.name);
    try {
      if (editingBrand) {
        if (data.imageFile) {
          const form = new FormData();
          form.append('name', data.name);
          form.append('mainCategoryId', data.mainCategoryId);
          form.append('status', status);
          form.append('slug', slug);
          if (data.description) form.append('description', data.description);
          if (data.website) form.append('website', data.website);
          form.append('file', data.imageFile);
          await updateBrandUpload({ id: editingBrand.id, form }).unwrap();
        } else {
          const patch: any = {
            name: data.name,
            mainCategoryId: data.mainCategoryId,
            status,
            slug,
            description: data.description ?? '',
            website: data.website ?? '',
          };
          await updateBrand({ id: editingBrand.id, patch }).unwrap();
        }
        toast.success('Brand updated successfully');
      } else {
        if (data.imageFile) {
          const form = new FormData();
          form.append('name', data.name);
          form.append('mainCategoryId', data.mainCategoryId);
          form.append('status', status);
          form.append('slug', slug);
          if (data.description) form.append('description', data.description);
          if (data.website) form.append('website', data.website);
          form.append('file', data.imageFile);
          await createBrandUpload(form).unwrap();
        } else {
          const body: any = {
            name: data.name,
            mainCategoryId: data.mainCategoryId,
            status,
            slug,
            description: data.description ?? '',
            website: data.website ?? '',
          };
          await createBrand(body).unwrap();
        }
        toast.success('Brand created successfully');
      }
      setIsModalOpen(false);
      refetch();
    } catch (e: any) {
      toast.error(`Failed to ${editingBrand ? 'update' : 'create'} brand`);
    }
  };

  const onDelete = async () => {
    if (!selectedBrand) return;
    try {
      await deleteBrand({ id: selectedBrand.id, hard: true }).unwrap();
      toast.success('Brand deleted successfully');
      setIsDeleteModalOpen(false);
      refetch();
    } catch {
      toast.error('Failed to delete brand');
    }
  };

  /* ---------- Columns ---------- */
  const columns: ColumnDef<Brand>[] = React.useMemo(
    () => [
      {
        id: 'brand',
        header: 'Brand',
        cell: ({ row }) => {
          const brand = row.original;
          return (
            <div className='flex items-center'>
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className='h-10 w-10 rounded object-cover border dark:border-darkSurface-stroke'
                />
              ) : (
                <div className='h-10 w-10 rounded border dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-base flex items-center justify-center'>
                  <Building className='h-5 w-5 text-gray-400' />
                </div>
              )}
              <div className='ml-4'>
                <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {brand.name}
                </div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  /{brand.slug}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'mainCategory',
        header: 'Main Category',
        cell: ({ row }) => {
          const mainCategory = categories.find(
            (c) => c.id === row.original.mainCategoryId
          );
          return (
            <span className='text-sm text-gray-700 dark:text-gray-300'>
              {mainCategory ? mainCategory.name : '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ getValue }) => {
          const isActive = getValue() as boolean;
          return (
            <StatusBadge
              status={isActive ? 'Active' : 'Inactive'}
              variant={isActive ? 'success' : 'warning'}
            />
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
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => (
          <span className='text-sm text-gray-600 dark:text-gray-400'>
            {formatDateTime(getValue() as string)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Menu
            as='div'
            className='relative inline-block text-left'
          >
            <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'>
              <MoreHorizontal className='h-5 w-5' />
            </Menu.Button>
            <Menu.Items className='absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md border border-gray-200 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated shadow-xl ring-1 ring-black/5 focus:outline-none'>
              <Menu.Item>
                <button
                  onClick={() => openEditBrand(row.original)}
                  className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                >
                  <Edit className='mr-3 h-4 w-4' />
                  Edit Brand
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  onClick={() => openDeleteModal(row.original)}
                  className='flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                >
                  <Trash2 className='mr-3 h-4 w-4' />
                  Delete
                </button>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        ),
      },
    ],
    [categories]
  );

  /* ---------- Render ---------- */
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Brands
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Manage product brands and manufacturers
          </p>
        </div>
        <button
          onClick={openNewBrand}
          className='inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition'
        >
          <Plus className='h-4 w-4 mr-2' />
          New Brand
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-darkSurface-elevated p-4 rounded-lg border border-gray-200 dark:border-darkSurface-stroke shadow-sm sm:flex sm:items-center sm:space-x-4'>
        <div className='flex-1 mb-3 sm:mb-0'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search brands...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-darkSurface-stroke rounded-md leading-5 bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm'
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
        >
          <option value='all'>All Status</option>
          <option value='active'>Active</option>
          <option value='inactive'>Inactive</option>
        </select>
      </div>

      {/* Table */}
      {isLoading || isFetching ? (
        <div className='text-gray-500 dark:text-gray-400'>Loading…</div>
      ) : filteredBrands.length === 0 ? (
        <EmptyState
          title='No brands found'
          description='Add your first brand to organize products by manufacturer.'
          action={{ label: 'New Brand', onClick: openNewBrand }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredBrands}
          enableExport
          exportFilename='brands'
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
                Delete Brand
              </Dialog.Title>
              <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                Are you sure you want to delete "{selectedBrand?.name}"? This
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

      {/* Brand Modal */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveBrand}
        categories={categories}
        brand={
          editingBrand
            ? {
                name: editingBrand.name,
                slug: editingBrand.slug,
                description: editingBrand.description ?? '',
                website: editingBrand.website ?? '',
                mainCategoryId: editingBrand.mainCategoryId,
                isActive: editingBrand.isActive,
                imagePreviewUrl: editingBrand.logoUrl ?? '',
                imageFile: undefined,
              }
            : null
        }
        mode={editingBrand ? 'edit' : 'create'}
      />
    </div>
  );
};

export default BrandsPage;
