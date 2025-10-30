import React from 'react';
import {
  Upload,
  Search,
  Grid,
  List,
  MoreHorizontal,
  Eye,
  Download,
  Trash2,
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import EmptyState from '@/components/common/EmptyState';
import { formatFileSize } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
}

// Mock data
const mockMediaFiles: MediaFile[] = [
  {
    id: 'media_001',
    filename: 'product-image-1.jpg',
    originalName: 'smartphone-hero.jpg',
    mimeType: 'image/jpeg',
    size: 245760,
    url: 'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=400',
    uploadedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'media_002',
    filename: 'banner-summer-sale.jpg',
    originalName: 'summer-sale-banner.jpg',
    mimeType: 'image/jpeg',
    size: 512000,
    url: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400',
    uploadedAt: '2024-01-14T14:20:00Z',
  },
  {
    id: 'media_003',
    filename: 'laptop-product.jpg',
    originalName: 'ultrabook-pro.jpg',
    mimeType: 'image/jpeg',
    size: 189440,
    url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=400',
    uploadedAt: '2024-01-13T09:15:00Z',
  },
];

const MediaPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const filteredFiles = React.useMemo(() => {
    return mockMediaFiles.filter((file) => {
      const matchesSearch =
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.filename.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        typeFilter === 'all' || file.mimeType.startsWith(typeFilter);

      return matchesSearch && matchesType;
    });
  }, [mockMediaFiles, searchTerm, typeFilter]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Handle file upload logic here
      console.log('Files to upload:', files);
    }
  };

  const GridView = () => (
    <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'>
      {filteredFiles.map((file) => (
        <div
          key={file.id}
          className='group relative bg-white rounded-lg shadow hover:shadow-md transition-shadow'
        >
          <div className='aspect-square overflow-hidden rounded-t-lg'>
            <img
              src={file.url}
              alt={file.originalName}
              className='h-full w-full object-cover group-hover:scale-105 transition-transform'
            />
          </div>
          <div className='p-3'>
            <p className='text-sm font-medium text-gray-900 truncate'>
              {file.originalName}
            </p>
            <p className='text-xs text-gray-500'>{formatFileSize(file.size)}</p>
          </div>
          <div className='absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity'>
            <Menu
              as='div'
              className='relative'
            >
              <Menu.Button className='p-1 bg-white rounded-full shadow-sm hover:bg-gray-50'>
                <MoreHorizontal className='h-4 w-4 text-gray-600' />
              </Menu.Button>
              <Menu.Items className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'>
                <Menu.Item>
                  <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                    <Eye className='mr-3 h-4 w-4' />
                    View
                  </button>
                </Menu.Item>
                <Menu.Item>
                  <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                    <Download className='mr-3 h-4 w-4' />
                    Download
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
          </div>
        </div>
      ))}
    </div>
  );

  const ListView = () => (
    <div className='bg-white shadow rounded-lg overflow-hidden'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              File
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Type
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Size
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Uploaded
            </th>
            <th className='relative px-6 py-3'>
              <span className='sr-only'>Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {filteredFiles.map((file) => (
            <tr
              key={file.id}
              className='hover:bg-gray-50'
            >
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='flex items-center'>
                  <img
                    className='h-10 w-10 rounded object-cover'
                    src={file.url}
                    alt={file.originalName}
                  />
                  <div className='ml-4'>
                    <div className='text-sm font-medium text-gray-900'>
                      {file.originalName}
                    </div>
                    <div className='text-sm text-gray-500'>{file.filename}</div>
                  </div>
                </div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {file.mimeType}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {formatFileSize(file.size)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                {formatDateTime(file.uploadedAt)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
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
                        View
                      </button>
                    </Menu.Item>
                    <Menu.Item>
                      <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
                        <Download className='mr-3 h-4 w-4' />
                        Download
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Media Library</h1>
          <p className='text-gray-600'>Upload and manage your media files</p>
        </div>
        <div className='flex items-center space-x-3'>
          <input
            type='file'
            id='file-upload'
            multiple
            accept='image/*'
            onChange={handleFileUpload}
            className='hidden'
          />
          <label
            htmlFor='file-upload'
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 cursor-pointer'
          >
            <Upload className='h-4 w-4 mr-2' />
            Upload Files
          </label>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className='bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search files...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className='block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md'
          >
            <option value='all'>All Types</option>
            <option value='image'>Images</option>
            <option value='video'>Videos</option>
            <option value='application'>Documents</option>
          </select>
        </div>

        <div className='flex items-center space-x-2'>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Grid className='h-5 w-5' />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <List className='h-5 w-5' />
          </button>
        </div>
      </div>

      {/* Content */}
      {filteredFiles.length === 0 ? (
        <EmptyState
          title='No media files found'
          description='Upload your first media file to get started.'
          action={{
            label: 'Upload Files',
            onClick: () => document.getElementById('file-upload')?.click(),
          }}
        />
      ) : viewMode === 'grid' ? (
        <GridView />
      ) : (
        <ListView />
      )}
    </div>
  );
};

export default MediaPage;
