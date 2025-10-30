import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Search,
  MoreHorizontal,
  Eye,
  RefreshCw,
  DollarSign,
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { DataTable } from '@/components/data-grid/DataTable';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import PaymentModal from './PaymentModal';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Payment } from '@/types/payment';

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [paymentModal, setPaymentModal] = React.useState<{
    isOpen: boolean;
    mode: 'view' | 'refund';
    payment: Payment | null;
  }>({
    isOpen: false,
    mode: 'view',
    payment: null,
  });

  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [providerFilter, setProviderFilter] = React.useState('all');

  const openPaymentModal = (mode: 'view' | 'refund', payment: Payment) => {
    setPaymentModal({ isOpen: true, mode, payment });
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, mode: 'view', payment: null });
  };

  const handleRefund = (refundData: any) => {
    if (paymentModal.payment) {
      setPayments((prev) =>
        prev.map((payment) =>
          payment.id === paymentModal.payment!.id
            ? {
                ...payment,
                status: 'refunded',
                refundAmount: refundData.refundAmount,
                refundReason: refundData.refundReason,
                updatedAt: new Date().toISOString(),
              }
            : payment
        )
      );
    }
  };

  const filteredPayments = React.useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        (payment.gatewayTransactionId || payment.id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.orderNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || payment.status === statusFilter;
      const matchesProvider =
        providerFilter === 'all' || payment.provider === providerFilter;
      return matchesSearch && matchesStatus && matchesProvider;
    });
  }, [payments, searchTerm, statusFilter, providerFilter]);

  const columns: ColumnDef<Payment>[] = React.useMemo(
    () => [
      {
        id: 'transactionId',
        header: 'Transaction ID',
        cell: ({ row }) => (
          <span className='font-mono text-sm text-gray-900 dark:text-gray-100'>
            {row.original.gatewayTransactionId || row.original.id}
          </span>
        ),
      },
      {
        accessorKey: 'orderNo',
        header: 'Order',
        cell: ({ getValue }) => (
          <span className='font-mono text-sm text-gray-900 dark:text-gray-100'>
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'method',
        header: 'Method',
        cell: ({ getValue }) => {
          const method = getValue() as string;
          return (
            <StatusBadge
              status={method.replace('_', ' ')}
              variant='default'
              className='capitalize'
            />
          );
        },
      },
      {
        accessorKey: 'provider',
        header: 'Provider',
        cell: ({ getValue }) => (
          <StatusBadge
            status={getValue() as string}
            variant='info'
            className='capitalize'
          />
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() as string;
          const variant =
            status === 'completed'
              ? 'success'
              : status === 'failed'
              ? 'error'
              : status === 'refunded'
              ? 'warning'
              : 'default';
          return (
            <StatusBadge
              status={status}
              variant={variant}
              className='capitalize'
            />
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ getValue }) => (
          <span className='text-sm text-gray-700 dark:text-gray-400'>
            {formatDateTime(getValue() as string)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const payment = row.original;
          return (
            <Menu
              as='div'
              className='relative inline-block text-left'
            >
              <Menu.Button className='flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                <MoreHorizontal className='h-5 w-5' />
              </Menu.Button>
              <Menu.Items className='absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-black dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none'>
                <Menu.Item>
                  <button
                    onClick={() => openPaymentModal('view', payment)}
                    className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface transition'
                  >
                    <Eye className='mr-3 h-4 w-4' />
                    View Details
                  </button>
                </Menu.Item>
                {payment.status === 'completed' && (
                  <Menu.Item>
                    <button
                      onClick={() => openPaymentModal('refund', payment)}
                      className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface transition'
                    >
                      <RefreshCw className='mr-3 h-4 w-4' />
                      Process Refund
                    </button>
                  </Menu.Item>
                )}
                <Menu.Item>
                  <button className='flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface transition'>
                    <DollarSign className='mr-3 h-4 w-4' />
                    View Gateway Response
                  </button>
                </Menu.Item>
              </Menu.Items>
            </Menu>
          );
        },
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
            Payments
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Monitor transactions and manage refunds securely
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-black dark:bg-darkSurface-elevated border border-gray-100 dark:border-gray-700 p-4 rounded-lg shadow-sm flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0 transition-colors'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Search payments...'
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
          <option value='all'>All Status</option>
          <option value='pending'>Pending</option>
          <option value='completed'>Completed</option>
          <option value='failed'>Failed</option>
          <option value='refunded'>Refunded</option>
        </select>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className='px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-black dark:bg-darkSurface text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 text-sm'
        >
          <option value='all'>All Providers</option>
          <option value='stripe'>Stripe</option>
          <option value='paypal'>PayPal</option>
          <option value='razorpay'>Razorpay</option>
        </select>
      </div>

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <EmptyState
          title='No payments found'
          description='Payments will appear once customers complete a transaction.'
          className='dark:text-gray-400'
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPayments}
          enableExport
          exportFilename='payments'
          className='dark:bg-darkSurface-elevated dark:border-gray-700 rounded-lg'
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        onRefund={handleRefund}
        payment={paymentModal.payment}
        mode={paymentModal.mode}
      />
    </div>
  );
};

export default PaymentsPage;
