import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  ToggleLeft,
} from 'lucide-react';
import { Menu, Dialog, Transition } from '@headlessui/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';
import { useListCategoriesQuery } from './api';
import {
  useListAttributesQuery,
  useCreateWithAssignMutation,
  useDeleteAttributeMutation,
  useUpdateAttributeMutation,
  AttributeDefinition,
} from './attributes.api';
import AttributeModal from './CreateAttributeModal';
import EditAttributeModal from './EditAttributeModal';

type AttrRow = {
  id: string;
  name: string;
  slug: string;
  type: AttributeDefinition['valueType'];
  values?: Array<{ display: string; code?: string }>;
  isActive: boolean;
  createdAt: string;
  raw: AttributeDefinition;
};

// helpers
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

export default function AttributesPage() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | AttrRow['type']>(
    'all'
  );
  const [statusFilter, setStatusFilter] = React.useState<
    'all' | 'active' | 'inactive'
  >('all');

  // Modals
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [isEditOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AttributeDefinition | null>(
    null
  );
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = React.useState(false);
  const [selectedAttr, setSelectedAttr] = React.useState<AttrRow | null>(null);

  const { data: categories = [] } = useListCategoriesQuery(undefined);
  const categoryOptions = React.useMemo(
    () =>
      categories.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId })),
    [categories]
  );

  const { data: attributes = [], isFetching } = useListAttributesQuery();
  const [createWithAssign, { isLoading: creating }] =
    useCreateWithAssignMutation();
  const [updateAttribute, { isLoading: updating }] =
    useUpdateAttributeMutation();
  const [deleteAttribute, { isLoading: deleting }] =
    useDeleteAttributeMutation();

  const rows: AttrRow[] = React.useMemo(() => {
    return attributes.map((a) => {
      const normalizedValues =
        a.options?.map((o) => {
          const hexFromValue = looksLikeHex(o.value)
            ? normalizeHex(withHash(o.value))
            : null;
          const hexFromLabel =
            o.label && looksLikeHex(o.label)
              ? normalizeHex(withHash(o.label))
              : null;
          const code = hexFromValue || hexFromLabel || (o as any).code || null;
          const display =
            o.label && !looksLikeHex(o.label)
              ? o.label
              : o.value && !looksLikeHex(o.value)
              ? o.value
              : code;
          return { display, code };
        }) ?? [];
      return {
        id: a.id,
        name: a.label,
        slug: a.key,
        type: a.valueType,
        values: normalizedValues,
        isActive: a.status === 'active',
        createdAt: new Date(a.createdAt).toISOString(),
        raw: a,
      };
    });
  }, [attributes]);

  const filteredAttributes = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return rows.filter((attribute) => {
      const matchesSearch =
        !q ||
        attribute.name.toLowerCase().includes(q) ||
        attribute.slug.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || attribute.type === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && attribute.isActive) ||
        (statusFilter === 'inactive' && !attribute.isActive);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [rows, searchTerm, typeFilter, statusFilter]);

  const openCreate = () => setCreateOpen(true);
  const openEdit = (attr: AttributeDefinition) => {
    setEditing(attr);
    setEditOpen(true);
  };
  const openDeleteModal = (row: AttrRow) => {
    setSelectedAttr(row);
    setIsDeleteModalOpen(true);
  };
  const openStatusModal = (row: AttrRow) => {
    setSelectedAttr(row);
    setIsStatusModalOpen(true);
  };

  const handleCreate = async (payload: any) => {
    try {
      await createWithAssign(payload).unwrap();
      toast.success('Attribute created');
      setCreateOpen(false);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to create attribute');
    }
  };

  const handleEditSave = async (patch: Partial<AttributeDefinition>) => {
    if (!editing) return;
    try {
      await updateAttribute({ id: editing.id, patch }).unwrap();
      toast.success('Attribute updated');
      setEditOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update attribute');
    }
  };

  const onToggleStatusConfirm = async () => {
    if (!selectedAttr) return;
    const next = selectedAttr.isActive ? 'archived' : 'active';
    try {
      await updateAttribute({
        id: selectedAttr.id,
        patch: { status: next },
      }).unwrap();
      toast.success(`Status set to ${next}`);
      setIsStatusModalOpen(false);
      setSelectedAttr(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to update status');
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedAttr) return;
    try {
      await deleteAttribute({ id: selectedAttr.id }).unwrap();
      toast.success('Attribute deleted');
      setIsDeleteModalOpen(false);
      setSelectedAttr(null);
    } catch (e: any) {
      toast.error(e?.data?.message || 'Failed to delete attribute');
    }
  };

  const busy = creating || updating || deleting;

  const columns: ColumnDef<AttrRow>[] = React.useMemo(
    () => [
      {
        id: 'attribute',
        header: 'Attribute',
        cell: ({ row }) => {
          const a = row.original;
          return (
            <div className='flex items-center'>
              <Tag className='h-5 w-5 text-primary-500 mr-3' />
              <div>
                <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                  {a.name}
                </div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  {a.slug}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => (
          <StatusBadge
            status={String(getValue())}
            variant='info'
          />
        ),
      },
      {
        accessorKey: 'values',
        header: 'Values',
        cell: ({ row }) => {
          const vals = row.original.values || [];
          if (!vals.length)
            return (
              <span className='text-sm text-gray-400'>
                No predefined values
              </span>
            );
          const chips = vals.slice(0, 3);
          return (
            <div className='flex flex-wrap gap-1'>
              {chips.map((v, i) => (
                <span
                  key={i}
                  className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-darkSurface-elevated text-gray-800 dark:text-gray-200'
                >
                  {v.code ? (
                    <span className='inline-flex items-center gap-1'>
                      <span
                        className='inline-block h-3 w-3 rounded border'
                        style={{ background: v.code }}
                        title={v.code}
                      />
                      {v.display}
                    </span>
                  ) : (
                    v.display
                  )}
                </span>
              ))}
              {vals.length > 3 && (
                <span className='text-xs text-gray-500'>
                  +{vals.length - 3} more
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          return (
            <button
              onClick={() => openStatusModal(row.original)}
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border transition ${
                isActive
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
              disabled={busy}
            >
              {isActive ? 'Active' : 'Inactive'}
            </button>
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Menu
              as='div'
              className='relative inline-block text-left'
            >
              <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'>
                <MoreHorizontal className='h-5 w-5' />
              </Menu.Button>
              <Menu.Items className='absolute right-0 z-10 mt-2 w-52 origin-top-right rounded-md border border-gray-200 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated shadow-xl ring-1 ring-black/5 focus:outline-none'>
                <Menu.Item>
                  <button
                    onClick={() => openEdit(item.raw)}
                    className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                  >
                    <Edit className='mr-3 h-4 w-4' />
                    Edit Attribute
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button
                    onClick={() => openStatusModal(item)}
                    className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                  >
                    <ToggleLeft className='mr-3 h-4 w-4' />
                    Toggle Status
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button
                    onClick={() => openDeleteModal(item)}
                    className='flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-darkSurface-floating'
                  >
                    <Trash2 className='mr-3 h-4 w-4' />
                    Delete
                  </button>
                </Menu.Item>
              </Menu.Items>
            </Menu>
          );
        },
      },
    ],
    [busy]
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Attributes
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Define product attributes and specifications
          </p>
        </div>
        <button
          onClick={openCreate}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
          disabled={busy}
        >
          <Plus className='h-4 w-4 mr-2' />
          New Attribute
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white dark:bg-darkSurface-elevated p-4 rounded-lg border border-gray-200 dark:border-darkSurface-stroke shadow-sm sm:flex sm:items-center sm:space-x-4'>
        <div className='flex-1 mb-3 sm:mb-0'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search attributes...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-darkSurface-stroke rounded-md leading-5 bg-white dark:bg-darkSurface-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 sm:text-sm'
            />
          </div>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-darkSurface-stroke bg-white dark:bg-darkSurface-elevated text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500'
        >
          <option value='all'>All Types</option>
          <option value='string'>String</option>
          <option value='number'>Number</option>
          <option value='boolean'>Boolean</option>
          <option value='enum'>Enum</option>
          <option value='multi_enum'>Multi Enum</option>
        </select>

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
      {isFetching ? (
        <div className='text-gray-500 dark:text-gray-400'>Loading…</div>
      ) : filteredAttributes.length === 0 ? (
        <EmptyState
          title='No attributes found'
          description='Create your first attribute to define product specifications.'
          action={{ label: 'New Attribute', onClick: openCreate }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredAttributes}
          enableExport
          exportFilename='attributes'
        />
      )}

      {/* Modals */}
      <AttributeModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onSubmitPayload={handleCreate}
        categories={categoryOptions}
        mode='create'
      />
      <EditAttributeModal
        isOpen={isEditOpen}
        onClose={() => {
          setEditOpen(false);
          setEditing(null);
        }}
        attribute={editing}
        onSave={handleEditSave}
      />

      {/* Confirmation Dialogs */}
      {/* (Keep your existing Delete + Status <Dialog> same – can use ConfirmDialog for cleaner re-use later) */}

      <ToastContainer
        position='top-right'
        autoClose={2500}
        hideProgressBar
      />
    </div>
  );
}
