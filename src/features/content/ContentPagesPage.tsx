import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';

interface ContentPage {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  author: string;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const mockPages: ContentPage[] = [
  {
    id: 'page_001',
    title: 'About Us',
    slug: 'about-us',
    status: 'published',
    author: 'Admin User',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'page_002',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    status: 'published',
    author: 'Admin User',
    createdAt: '2024-01-08T14:20:00Z',
    updatedAt: '2024-01-12T16:45:00Z',
  },
  {
    id: 'page_003',
    title: 'Terms of Service',
    slug: 'terms-of-service',
    status: 'draft',
    author: 'Admin User',
    createdAt: '2024-01-05T11:15:00Z',
    updatedAt: '2024-01-05T11:15:00Z',
  },
];

const ContentPagesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredPages = React.useMemo(() => {
    return mockPages.filter((page) => {
      const matchesSearch =
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || page.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [mockPages, searchTerm, statusFilter]);

  const columns: ColumnDef<ContentPage>[] = React.useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => {
          const page = row.original;
          return (
            <div className='flex items-center'>
              <FileText className='h-5 w-5 text-gray-400 mr-3' />
              <div>
                <div className='text-sm font-medium text-gray-900'>
                  {page.title}
                </div>
                <div className='text-sm text-gray-500'>/{page.slug}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          const variant = status === 'published' ? 'success' : 'warning';
          return (
            <StatusBadge
              status={status}
              variant={variant}
            />
          );
        },
      },
      {
        accessorKey: 'author',
        header: 'Author',
        cell: ({ getValue }) => (
          <span className='text-sm'>{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Modified',
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Menu
            as='div'
            className='relative inline-block text-left'
          >
            <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600'>
              <MoreHorizontal className='h-5 w-5' />
            </Menu.Button>
            <Menu.Items className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
              <Menu.Item>
                <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                  <Eye className='mr-3 h-4 w-4' />
                  Preview
                </button>
              </Menu.Item>
              <Menu.Item>
                <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                  <Edit className='mr-3 h-4 w-4' />
                  Edit Page
                </button>
              </Menu.Item>
              <Menu.Item>
                <button className='flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100'>
                  <Trash2 className='mr-3 h-4 w-4' />
                  Delete
                </button>
              </Menu.Item>
            </Menu.Items>
          </Menu>
        ),
      },
    ],
    []
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Content Pages</h1>
          <p className='text-gray-600'>Manage website pages and content</p>
        </div>
        <button className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'>
          <Plus className='h-4 w-4 mr-2' />
          New Page
        </button>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search pages...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
            />
          </div>
        </div>

        <div className='flex space-x-4'>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md'
          >
            <option value='all'>All Status</option>
            <option value='published'>Published</option>
            <option value='draft'>Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredPages.length === 0 ? (
        <EmptyState
          title='No pages found'
          description='Create your first content page to get started.'
          action={{
            label: 'New Page',
            onClick: () => {},
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPages}
          enableExport={true}
          exportFilename='content-pages'
        />
      )}
    </div>
  );
};

export default ContentPagesPage;
