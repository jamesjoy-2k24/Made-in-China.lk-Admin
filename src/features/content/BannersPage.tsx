import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Image } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';

interface Banner {
  id: string;
  title: string;
  placement: 'hero' | 'sidebar' | 'footer';
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Mock data
const mockBanners: Banner[] = [
  {
    id: 'banner_001',
    title: 'Summer Sale 2024',
    placement: 'hero',
    imageUrl: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkUrl: '/products?sale=true',
    isActive: true,
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-12-31T23:59:59Z',
    createdAt: '2024-01-01T09:00:00Z'
  },
  {
    id: 'banner_002',
    title: 'New Electronics Collection',
    placement: 'sidebar',
    imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkUrl: '/products?category=electronics',
    isActive: true,
    createdAt: '2024-01-05T10:30:00Z'
  },
  {
    id: 'banner_003',
    title: 'Free Shipping Offer',
    placement: 'footer',
    imageUrl: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400',
    isActive: false,
    createdAt: '2024-01-03T14:20:00Z'
  }
];

const BannersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [placementFilter, setPlacementFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredBanners = React.useMemo(() => {
    return mockBanners.filter(banner => {
      const matchesSearch = banner.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlacement = placementFilter === 'all' || banner.placement === placementFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && banner.isActive) ||
                           (statusFilter === 'inactive' && !banner.isActive);
      
      return matchesSearch && matchesPlacement && matchesStatus;
    });
  }, [mockBanners, searchTerm, placementFilter, statusFilter]);

  const columns: ColumnDef<Banner>[] = React.useMemo(() => [
    {
      id: 'banner',
      header: 'Banner',
      cell: ({ row }) => {
        const banner = row.original;
        return (
          <div className="flex items-center">
            <img
              className="h-12 w-20 rounded object-cover"
              src={banner.imageUrl}
              alt={banner.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-banner.jpg';
              }}
            />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{banner.title}</div>
              <div className="text-sm text-gray-500">{banner.placement}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'placement',
      header: 'Placement',
      cell: ({ getValue }) => (
        <StatusBadge status={getValue() as string} variant="info" />
      ),
    },
    {
      accessorKey: 'linkUrl',
      header: 'Link',
      cell: ({ getValue }) => {
        const url = getValue() as string;
        return url ? (
          <span className="text-sm text-blue-600 truncate max-w-xs block">{url}</span>
        ) : (
          <span className="text-sm text-gray-400">No link</span>
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
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => formatDateTime(getValue() as string),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="flex items-center text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-5 w-5" />
          </Menu.Button>
          <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <Menu.Item>
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Eye className="mr-3 h-4 w-4" />
                Preview
              </button>
            </Menu.Item>
            <Menu.Item>
              <button className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Edit className="mr-3 h-4 w-4" />
                Edit Banner
              </button>
            </Menu.Item>
            <Menu.Item>
              <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                <Trash2 className="mr-3 h-4 w-4" />
                Delete
              </button>
            </Menu.Item>
          </Menu.Items>
        </Menu>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-600">Manage promotional banners and advertisements</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
          <Plus className="h-4 w-4 mr-2" />
          New Banner
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="all">All Placements</option>
            <option value="hero">Hero</option>
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredBanners.length === 0 ? (
        <EmptyState
          title="No banners found"
          description="Create your first banner to promote products and offers."
          action={{
            label: 'New Banner',
            onClick: () => {}
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredBanners}
          enableExport={true}
          exportFilename="banners"
        />
      )}
    </div>
  );
};

export default BannersPage;