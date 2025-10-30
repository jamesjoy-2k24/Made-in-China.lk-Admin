import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Search,
  Filter,
  Activity,
  User,
  Package,
  ShoppingCart,
  CreditCard,
} from 'lucide-react';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/format';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Mock data
const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit_001',
    userId: 'admin_001',
    userName: 'Admin User',
    action: 'product:create',
    resource: 'product',
    resourceId: 'p_001',
    details: { name: 'New Smartphone' },
    timestamp: '2024-01-15T10:30:00Z',
  },
  {
    id: 'audit_002',
    userId: 'admin_001',
    userName: 'Admin User',
    action: 'user:update',
    resource: 'user',
    resourceId: 'u_1001',
    details: { field: 'status', oldValue: 'active', newValue: 'suspended' },
    timestamp: '2024-01-15T09:45:00Z',
  },
  {
    id: 'audit_003',
    userId: 'admin_001',
    userName: 'Admin User',
    action: 'order:update',
    resource: 'order',
    resourceId: 'ord_001',
    details: { field: 'status', oldValue: 'pending', newValue: 'shipped' },
    timestamp: '2024-01-14T16:20:00Z',
  },
  {
    id: 'audit_004',
    userId: 'admin_001',
    userName: 'Admin User',
    action: 'payment:refund',
    resource: 'payment',
    resourceId: 'pay_001',
    details: { amount: 299.99, reason: 'Customer request' },
    timestamp: '2024-01-14T14:15:00Z',
  },
  {
    id: 'audit_005',
    userId: 'admin_001',
    userName: 'Admin User',
    action: 'product:delete',
    resource: 'product',
    resourceId: 'p_999',
    details: { name: 'Discontinued Item' },
    timestamp: '2024-01-13T11:30:00Z',
  },
];

const getActionIcon = (action: string) => {
  if (action.includes('user')) return User;
  if (action.includes('product')) return Package;
  if (action.includes('order')) return ShoppingCart;
  if (action.includes('payment')) return CreditCard;
  return Activity;
};

const getActionColor = (action: string) => {
  if (action.includes('create')) return 'success';
  if (action.includes('update')) return 'info';
  if (action.includes('delete')) return 'error';
  return 'default';
};

const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [resourceFilter, setResourceFilter] = React.useState('all');
  const [actionFilter, setActionFilter] = React.useState('all');

  const filteredLogs = React.useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchesSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resourceId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesResource =
        resourceFilter === 'all' || log.resource === resourceFilter;
      const matchesAction =
        actionFilter === 'all' || log.action.includes(actionFilter);

      return matchesSearch && matchesResource && matchesAction;
    });
  }, [mockAuditLogs, searchTerm, resourceFilter, actionFilter]);

  const columns: ColumnDef<AuditLog>[] = React.useMemo(
    () => [
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const log = row.original;
          const Icon = getActionIcon(log.action);
          const color = getActionColor(log.action);
          return (
            <div className='flex items-center'>
              <Icon className='h-5 w-5 text-gray-400 mr-3' />
              <div>
                <StatusBadge
                  status={log.action}
                  variant={color as any}
                />
                <div className='text-sm text-gray-500 mt-1'>
                  {log.resource}:{log.resourceId}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'userName',
        header: 'User',
        cell: ({ getValue }) => (
          <span className='text-sm font-medium'>{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'details',
        header: 'Details',
        cell: ({ getValue }) => {
          const details = getValue() as Record<string, unknown>;
          if (!details)
            return <span className='text-sm text-gray-400'>No details</span>;

          return (
            <div className='text-sm text-gray-600'>
              {Object.entries(details).map(([key, value]) => (
                <div key={key}>
                  <span className='font-medium'>{key}:</span> {String(value)}
                </div>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
    ],
    []
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Audit Logs</h1>
        <p className='text-gray-600'>Track all system activities and changes</p>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg shadow space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search logs...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
            />
          </div>
        </div>

        <div className='flex space-x-4'>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md'
          >
            <option value='all'>All Resources</option>
            <option value='user'>Users</option>
            <option value='product'>Products</option>
            <option value='order'>Orders</option>
            <option value='payment'>Payments</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className='block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md'
          >
            <option value='all'>All Actions</option>
            <option value='create'>Create</option>
            <option value='update'>Update</option>
            <option value='delete'>Delete</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          title='No audit logs found'
          description='System activities will be logged here.'
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredLogs}
          enableExport={true}
          exportFilename='audit-logs'
        />
      )}
    </div>
  );
};

export default AuditLogsPage;
