import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Search, MoreHorizontal, Eye, Edit, Package } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import OrderModal from './OrderModal';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Order } from '@/types/order';

/* =============================================
   Orders Management — Pro Dark UI Version
============================================= */
const OrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [orderModal, setOrderModal] = React.useState<{
    isOpen: boolean;
    mode: 'edit' | 'view';
    order: Order | null;
  }>({
    isOpen: false,
    mode: 'view',
    order: null,
  });

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [paymentFilter, setPaymentFilter] = React.useState('all');

  const openOrderModal = (mode: 'edit' | 'view', order: Order) =>
    setOrderModal({ isOpen: true, mode, order });

  const closeOrderModal = () =>
    setOrderModal({ isOpen: false, mode: 'view', order: null });

  const handleSaveOrder = (updatedData: any) => {
    if (orderModal.order) {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderModal.order!.id
            ? {
                ...order,
                status: updatedData.status,
                paymentStatus: updatedData.paymentStatus,
                deliveryStatus: updatedData.deliveryStatus,
                notes: updatedData.notes,
                updatedAt: new Date().toISOString(),
              }
            : order
        )
      );
    }
  };

  /* ------------- Filters ------------- */
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === 'all' || order.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  /* ------------- Table Columns ------------- */
  const columns: ColumnDef<Order>[] = React.useMemo(
    () => [
      {
        accessorKey: 'orderNo',
        header: 'Order No',
        cell: ({ getValue }) => (
          <span className='font-mono text-sm text-gray-900 dark:text-gray-100'>
            {getValue() as string}
          </span>
        ),
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div>
              <div className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                {order.userName}
              </div>
              <div className='text-sm text-gray-500 dark:text-gray-400'>
                {order.userEmail}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <span className='text-sm text-gray-700 dark:text-gray-300'>
            {row.original.items.length} items
          </span>
        ),
      },
      {
        accessorKey: 'grandTotal',
        header: 'Total',
        cell: ({ getValue }) => (
          <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
            {formatCurrency(getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Order Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          const variant =
            status === 'delivered'
              ? 'success'
              : status === 'cancelled'
              ? 'error'
              : status === 'shipped'
              ? 'info'
              : 'warning';
          return (
            <StatusBadge
              status={status}
              variant={variant}
            />
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ getValue }) => {
          const payment = getValue() as string;
          const variant =
            payment === 'paid'
              ? 'success'
              : payment === 'failed'
              ? 'error'
              : 'warning';
          return (
            <StatusBadge
              status={payment}
              variant={variant}
            />
          );
        },
      },
      {
        accessorKey: 'deliveryStatus',
        header: 'Delivery',
        cell: ({ getValue }) => {
          const delivery = getValue() as string;
          const variant =
            delivery === 'delivered'
              ? 'success'
              : delivery === 'in_transit'
              ? 'info'
              : 'warning';
          return (
            <StatusBadge
              status={delivery}
              variant={variant}
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
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Menu
            as='div'
            className='relative inline-block text-left'
          >
            <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition'>
              <MoreHorizontal className='h-5 w-5' />
            </Menu.Button>
            <Menu.Items className='absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none transition-colors'>
              <Menu.Item>
                <button
                  onClick={() => openOrderModal('view', row.original)}
                  className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface transition'
                >
                  <Eye className='mr-3 h-4 w-4' />
                  View Details
                </button>
              </Menu.Item>
              <Menu.Item>
                <button
                  onClick={() => openOrderModal('edit', row.original)}
                  className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface transition'
                >
                  <Edit className='mr-3 h-4 w-4' />
                  Update Status
                </button>
              </Menu.Item>
              <Menu.Item>
                <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface transition'>
                  <Package className='mr-3 h-4 w-4' />
                  Track Shipment
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
          <h1 className='text-2xl font-bold text-gray-900 dark:text-gray-100'>
            Orders
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Manage customer orders, payments, and delivery statuses.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-black dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 transition-colors'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-black dark:text-gray-400' />
            <input
              type='text'
              placeholder='Search orders...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='block w-full pl-10 pr-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-black dark:bg-darkSurface text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none'
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-black dark:bg-darkSurface text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 text-sm'
        >
          <option value='all'>All Orders</option>
          <option value='pending'>Pending</option>
          <option value='confirmed'>Confirmed</option>
          <option value='processing'>Processing</option>
          <option value='shipped'>Shipped</option>
          <option value='delivered'>Delivered</option>
          <option value='cancelled'>Cancelled</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-black dark:bg-darkSurface text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 text-sm'
        >
          <option value='all'>All Payments</option>
          <option value='pending'>Pending</option>
          <option value='paid'>Paid</option>
          <option value='failed'>Failed</option>
          <option value='refunded'>Refunded</option>
        </select>
      </div>

      {/* Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          title='No orders found'
          description='Orders will appear here once customers place them.'
          className='dark:text-gray-400'
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          enableExport
          exportFilename='orders'
          className='dark:bg-darkSurface-elevated dark:border-gray-700 rounded-lg'
        />
      )}

      {/* Order Modal */}
      <OrderModal
        isOpen={orderModal.isOpen}
        onClose={closeOrderModal}
        onSave={handleSaveOrder}
        order={orderModal.order}
        mode={orderModal.mode}
      />
    </div>
  );
};

export default OrdersPage;
