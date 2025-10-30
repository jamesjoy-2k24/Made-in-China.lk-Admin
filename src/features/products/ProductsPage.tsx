import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/types';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import ConfirmDialog from '@/components/common/ConfirmDialog';

import { formatCurrency } from '@/lib/format';
import { can } from '@/lib/rbac';

import {
  useListProductsQuery,
  useCreateProductMultipartMutation,
  useUpdateProductMultipartMutation,
  useDeleteProductMutation,
  modalToCreateFormData,
  modalToUpdateFormData,
  Product as BackendProduct,
} from './api';

import { useListCategoriesQuery } from '@/features/catalog/api';
import ProductCreateModal, {
  type ProductFormDataWithFiles as CreatePayload,
} from './ProductModal';
import ProductEditModal, {
  type ProductFormDataWithFiles as EditPayload,
} from './ProductEditModal';
import Switcher4 from '@/components/common/Switcher4';

// ---------------------------
// Helpers
// ---------------------------
type APIError = {
  message?: string;
  data?: { error?: { message?: string }; message?: string };
  error?: string;
};
const getErrorMessage = (error: unknown): string => {
  const e = error as APIError;
  return (
    e?.data?.error?.message ||
    e?.data?.message ||
    e?.error ||
    (typeof error === 'string' ? error : 'Unknown error')
  );
};

// ---------------------------
// Types
// ---------------------------
type Row = {
  id: string;
  name: string;
  brand?: string | null;
  mainCategoryId: string;
  subCategoryId: string | null;
  price: number;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  image?: string;
  shippingType: 'Air-Cargo' | 'Sea-Cargo';
  // deliveryStatus: 'Pending' | 'Dispatched' | 'Delivered' | 'Returned';
  // paymentStatus: 'Unpaid' | 'Paid' | 'Refunded' | 'Failed';
  totalCost: number;
  raw: BackendProduct;
};

const ProductsPage: React.FC = () => {
  const { role } = useSelector((state: RootState) => state.auth);

  // API
  const {
    data: list = { items: [], page: 1, limit: 20, total: 0, hasMore: false },
    isLoading,
    refetch,
  } = useListProductsQuery();

  const [createProduct] = useCreateProductMultipartMutation();
  const [updateProduct] = useUpdateProductMultipartMutation();
  const [deleteProduct] = useDeleteProductMutation();

  // Derived rows
  const rows: Row[] = React.useMemo(
    () =>
      (list.items || []).map((p) => ({
        id: p.id,
        name: p.title,
        brand: 'brandId' in p ? (p as any).brandId ?? null : null,
        mainCategoryId: p.mainCategoryId,
        subCategoryId: p.subCategoryId,
        price: p.price,
        stock: p.stock,
        status: p.status,
        image: p.images?.[0],
        shippingType: (p as any).shippingType || 'Standard',
        totalCost: p.price * p.stock,
        raw: p,
      })),
    [list.items]
  );

  const { data: cats = [] } = useListCategoriesQuery(undefined);
  const catById = React.useMemo(
    () => Object.fromEntries(cats.map((c) => [c.id, c])),
    [cats]
  );

  // Modals: create/edit/delete
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [editProductState, setEditProductState] =
    React.useState<BackendProduct | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    product: Row | null;
  }>({ isOpen: false, product: null });

  // Filters
  const [searchTerm, setSearchTerm] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

  // Status toggle confirmation
  const [pendingToggle, setPendingToggle] = React.useState<{
    row: Row;
    next: 'active' | 'draft';
  } | null>(null);
  const [isToggling, setIsToggling] = React.useState(false);

  const openCreateModal = () => setCreateOpen(true);
  const closeCreateModal = () => setCreateOpen(false);
  const openEditModal = (p: BackendProduct) => setEditProductState(p);
  const closeEditModal = () => setEditProductState(null);

  // CRUD handlers
  const handleCreate = async (payload: CreatePayload) => {
    try {
      const { formValues, files } = payload;
      const form = modalToCreateFormData(
        { ...formValues, status: 'active' },
        files
      );
      await createProduct(form).unwrap();
      toast.success('Product created');
      closeCreateModal();
      await refetch();
    } catch (e: unknown) {
      toast.error(`Failed to create: ${getErrorMessage(e)}`);
    }
  };

  const handleUpdate = async (payload: EditPayload) => {
    if (!editProductState) return;
    try {
      const { formValues, files, replaceImages, removeImageUrls } = payload;
      const form = modalToUpdateFormData(
        { ...formValues },
        {
          files,
          replaceImages,
          removeImageUrls,
          recomputeStockFromVariants: true,
        }
      );
      await updateProduct({ id: editProductState.id, form }).unwrap();
      toast.success('Product updated');
      closeEditModal();
      await refetch();
    } catch (e: unknown) {
      toast.error(`Failed to update: ${getErrorMessage(e)}`);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteDialog.product) return;
    try {
      await deleteProduct(deleteDialog.product.id).unwrap();
      toast.success('Product deleted');
      setDeleteDialog({ isOpen: false, product: null });
      await refetch();
    } catch (e: unknown) {
      toast.error(`Delete failed: ${getErrorMessage(e)}`);
    }
  };

  // Status toggle handlers
  const requestToggle = (row: Row) => {
    if (!can(role, 'products:update')) return;
    const next = row.status === 'active' ? 'draft' : 'active';
    setPendingToggle({ row, next });
  };

  const confirmToggle = async () => {
    if (!pendingToggle) return;
    try {
      setIsToggling(true);
      const { row, next } = pendingToggle;
      const form = modalToUpdateFormData(
        { ...row.raw, status: next } as any,
        {}
      );
      await updateProduct({ id: row.id, form }).unwrap();
      toast.success(`Status changed to ${next}`);
      setPendingToggle(null);
      await refetch();
    } catch (e) {
      toast.error(`Failed to change status: ${getErrorMessage(e)}`);
    } finally {
      setIsToggling(false);
    }
  };

  // Filtering
  const filtered = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.brand || '').toLowerCase().includes(q);
      const matchesCat =
        categoryFilter === 'all' || r.mainCategoryId === categoryFilter;
      return matchesQ && matchesCat;
    });
  }, [rows, searchTerm, categoryFilter]);

  const categories = React.useMemo(() => {
    const ids = Array.from(new Set(rows.map((r) => r.mainCategoryId)));
    return ids.map((id) => ({ id, name: catById[id]?.name || id }));
  }, [rows, catById]);

  // ---------------------------
  // Table Columns
  // ---------------------------
  const columns: ColumnDef<Row>[] = React.useMemo(
    () => [
      {
        id: 'product',
        header: 'Product',
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className='flex items-center'>
              <img
                className='h-12 w-12 rounded-lg object-cover border'
                src={p.image || '/placeholder-product.jpg'}
                alt={p.name}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.jpg';
                }}
              />
              <div className='ml-4'>
                <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {p.name}
                </div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  Stock: {p.stock}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const p = row.original;
          const main = catById[p.mainCategoryId]?.name || p.mainCategoryId;
          const sub = p.subCategoryId
            ? catById[p.subCategoryId]?.name || p.subCategoryId
            : null;
          return (
            <StatusBadge
              status={sub ? `${main} / ${sub}` : main}
              variant='default'
            />
          );
        },
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ getValue }) => (
          <span className='font-medium'>
            {formatCurrency(getValue() as number, 'LKR')}
          </span>
        ),
      },
      {
        accessorKey: 'totalCost',
        header: 'Total Value',
        cell: ({ getValue }) => (
          <span className='text-gray-800 dark:text-gray-200 font-semibold'>
            {formatCurrency(getValue() as number, 'LKR')}
          </span>
        ),
      },
      {
        accessorKey: 'shippingType',
        header: 'Shipping Type',
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue() as string}
            variant='info'
          />
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const s = row.original.status;
          const variant =
            s === 'active' ? 'success' : s === 'draft' ? 'warning' : 'default';
          const checked = s === 'active';

          return (
            <div className='flex items-center gap-3'>
              <StatusBadge
                status={s}
                variant={variant}
              />
              {can(role, 'products:update') && (
                <Switcher4
                  checked={checked}
                  onChange={() => requestToggle(row.original)}
                  disabled={isToggling}
                  title='Toggle active/draft'
                />
              )}
            </div>
          );
        },
      },
    ],
    [catById, role, isToggling, requestToggle]
  );

  // Row actions
  const rowActions = React.useMemo(
    () =>
      [
        can(role, 'products:update') && {
          id: 'edit',
          label: 'Edit',
          icon: <Edit className='h-4 w-4' />,
          onClick: (row: Row) => openEditModal(row.raw),
        },
        can(role, 'products:delete') && {
          id: 'delete',
          label: 'Delete',
          icon: <Trash2 className='h-4 w-4' />,
          tone: 'danger' as const,
          onClick: (row: Row) =>
            setDeleteDialog({ isOpen: true, product: row }),
        },
      ].filter(Boolean) as {
        id: string;
        label: string;
        icon?: React.ReactNode;
        onClick: (row: Row) => void;
        tone?: 'default' | 'danger';
      }[],
    [role]
  );

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Products
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Manage products, payments, and delivery.
          </p>
        </div>
        {can(role, 'products:create') && (
          <button
            onClick={openCreateModal}
            className='inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          >
            <Plus className='h-4 w-4 mr-2' />
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-darkSurface-base p-4 rounded-lg shadow flex flex-wrap gap-4 items-center'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
          <input
            type='text'
            placeholder='Search products...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-3 py-2 border rounded-md bg-white dark:bg-darkSurface-elevated text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
          />
        </div>
        <Listbox
          value={categoryFilter}
          onChange={setCategoryFilter}
        >
          <div className='relative w-56'>
            <Listbox.Button className='relative w-full cursor-pointer rounded-md border border-gray-300 bg-white dark:bg-darkSurface-elevated py-2 pl-3 pr-10 text-left text-sm text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-150'>
              <span className='block truncate'>
                {categoryFilter === 'all'
                  ? 'All Categories'
                  : categories.find((c) => c.id === categoryFilter)?.name ||
                    'Select Category'}
              </span>
              <span className='absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none'>
                <ChevronsUpDown className='h-5 w-5 text-gray-400' />
              </span>
            </Listbox.Button>

            <Transition
              as={React.Fragment}
              leave='transition ease-in duration-100'
              leaveFrom='opacity-100'
              leaveTo='opacity-0'
            >
              <Listbox.Options className='absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-darkSurface-elevated dark:bg-darkSurface-floating py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50'>
                <Listbox.Option
                  key='all'
                  value='all'
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active
                        ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        All Categories
                      </span>
                      {selected && (
                        <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600'>
                          <Check className='h-4 w-4' />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
                {categories.map((c) => (
                  <Listbox.Option
                    key={c.id}
                    value={c.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {c.name}
                        </span>
                        {selected && (
                          <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600'>
                            <Check className='h-4 w-4' />
                          </span>
                        )}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title='No products found'
          description='Start by adding your first product.'
          action={
            can(role, 'products:create')
              ? { label: 'Add Product', onClick: openCreateModal }
              : undefined
          }
        />
      ) : (
        <DataTable<Row, any>
          columns={columns}
          data={filtered}
          exportFilename='products'
          rowActions={rowActions}
          onRowClick={
            can(role, 'products:update')
              ? (r: Row) => openEditModal(r.raw)
              : undefined
          }
          getRowId={(r: Row) => r.id}
        />
      )}

      {/* Modals */}
      <ProductCreateModal
        isOpen={isCreateOpen}
        onClose={closeCreateModal}
        onCreate={handleCreate}
      />
      {editProductState && (
        <ProductEditModal
          isOpen={!!editProductState}
          onClose={closeEditModal}
          product={editProductState}
          onUpdate={handleUpdate}
        />
      )}

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, product: null })}
        onConfirm={confirmDeleteProduct}
        title='Delete Product'
        message={`Are you sure you want to delete "${deleteDialog.product?.name}"?`}
        confirmText='Delete'
        type='danger'
      />

      {/* Status Toggle Confirmation */}
      <ConfirmDialog
        isOpen={!!pendingToggle}
        onClose={() => setPendingToggle(null)}
        onConfirm={confirmToggle}
        title='Change Status'
        message={
          pendingToggle
            ? `Are you sure you want to set "${
                pendingToggle.row.name
              }" to ${pendingToggle.next.toUpperCase()}?`
            : ''
        }
        confirmText={isToggling ? 'Changing...' : 'Yes, change'}
        type='warning'
      />
    </div>
  );
};

export default ProductsPage;
