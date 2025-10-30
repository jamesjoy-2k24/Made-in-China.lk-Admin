import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Order } from '@/types/order';
import Modal from '@/components/common/Modal';
import { formatCurrency } from '@/lib/format';

const orderSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OrderFormData) => void;
  order?: Order | null;
  mode: 'edit' | 'view';
}

const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  order,
  mode,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: order
      ? {
          status: order.status,
          notes: order.notes || '',
        }
      : {
          status: 'pending',
          notes: '',
        },
  });

  React.useEffect(() => {
    if (isOpen && order) {
      reset({
        status: order.status,
        notes: order.notes || '',
      });
    }
  }, [isOpen, order, reset]);

  const onSubmit = (data: OrderFormData) => {
    onSave(data);
    onClose();
  };

  const getTitle = () => (mode === 'edit' ? 'Update Order' : 'Order Details');

  const isReadOnly = mode === 'view';
  if (!order) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size='lg'
      className='dark:bg-darkSurface-elevated'
    >
      <div className='space-y-6 text-gray-900 dark:text-gray-100'>
        {/* Order Info */}
        <div className='bg-gray-50 dark:bg-darkSurface p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Order Number
              </label>
              <p className='mt-1 text-sm font-mono text-gray-900 dark:text-gray-100'>
                {order.orderNo}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Customer
              </label>
              <p className='mt-1 text-sm'>{order.userName}</p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>
                {order.userEmail}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Total Amount
              </label>
              <p className='mt-1 text-sm font-medium text-gray-900 dark:text-gray-100'>
                {formatCurrency(order.grandTotal)}
              </p>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                Payment Status
              </label>
              <p className='mt-1 text-sm capitalize text-gray-800 dark:text-gray-200'>
                {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h4 className='text-sm font-medium text-gray-900 dark:text-gray-200 mb-3'>
            Order Items
          </h4>
          <div className='border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-darkSurface'>
                <tr>
                  {['Product', 'SKU', 'Qty', 'Price', 'Total'].map((head) => (
                    <th
                      key={head}
                      className='px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider'
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='bg-white dark:bg-darkSurface divide-y divide-gray-200 dark:divide-gray-700'>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td className='px-4 py-2 text-sm text-gray-900 dark:text-gray-100'>
                      {item.productName}
                    </td>
                    <td className='px-4 py-2 text-sm font-mono text-gray-500 dark:text-gray-400'>
                      {item.sku}
                    </td>
                    <td className='px-4 py-2 text-sm'>{item.quantity}</td>
                    <td className='px-4 py-2 text-sm'>
                      {formatCurrency(item.price)}
                    </td>
                    <td className='px-4 py-2 text-sm font-medium'>
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipping Address */}
        <div>
          <h4 className='text-sm font-medium text-gray-900 dark:text-gray-200 mb-3'>
            Shipping Address
          </h4>
          <div className='bg-gray-50 dark:bg-darkSurface p-4 rounded-lg border border-gray-200 dark:border-gray-700'>
            <p className='text-sm'>{order.shippingAddress.fullName}</p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {order.shippingAddress.address}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}
            </p>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {order.shippingAddress.country}
            </p>
          </div>
        </div>

        {/* Editable Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Order Status
            </label>
            <select
              {...register('status')}
              disabled={isReadOnly}
              className='mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:opacity-60'
            >
              <option value='pending'>Pending</option>
              <option value='confirmed'>Confirmed</option>
              <option value='processing'>Processing</option>
              <option value='shipped'>Shipped</option>
              <option value='delivered'>Delivered</option>
              <option value='cancelled'>Cancelled</option>
            </select>
            {errors.status && (
              <p className='mt-1 text-sm text-red-500'>
                {errors.status.message}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              disabled={isReadOnly}
              className='mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-darkSurface text-gray-900 dark:text-gray-100 shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:opacity-60'
              placeholder='Add any notes about this order...'
            />
          </div>

          {!isReadOnly && (
            <div className='flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-darkSurface focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                Cancel
              </button>
              <button
                type='submit'
                className='px-4 py-2 text-sm font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400'
              >
                Update Order
              </button>
            </div>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default OrderModal;
