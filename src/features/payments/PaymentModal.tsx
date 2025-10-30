import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Payment } from '@/types/payment';
import Modal from '@/components/common/Modal';
import { formatCurrency, formatDateTime } from '@/lib/format';

const refundSchema = z.object({
  refundAmount: z.number().min(0.01, 'Refund amount must be greater than 0'),
  refundReason: z.string().min(1, 'Refund reason is required'),
});

type RefundFormData = z.infer<typeof refundSchema>;

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefund?: (data: RefundFormData) => void;
  payment?: Payment | null;
  mode: 'view' | 'refund';
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onRefund,
  payment,
  mode
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      refundAmount: payment?.amount || 0,
      refundReason: '',
    }
  });

  React.useEffect(() => {
    if (isOpen && payment) {
      reset({
        refundAmount: payment.amount,
        refundReason: '',
      });
    }
  }, [isOpen, payment, reset]);

  const onSubmit = (data: RefundFormData) => {
    if (onRefund) {
      onRefund(data);
    }
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case 'refund': return 'Process Refund';
      case 'view': return 'Payment Details';
      default: return 'Payment';
    }
  };

  const isRefundMode = mode === 'refund';
  const maxRefundAmount = payment ? payment.amount - (payment.refundAmount || 0) : 0;

  if (!payment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle()} size="lg">
      <div className="space-y-6">
        {/* Payment Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
              <p className="mt-1 text-sm font-mono">{payment.gatewayTransactionId || payment.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Number</label>
              <p className="mt-1 text-sm font-mono">{payment.orderNo}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount</label>
              <p className="mt-1 text-sm font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm">{payment.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Method</label>
              <p className="mt-1 text-sm">{payment.method.replace('_', ' ')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider</label>
              <p className="mt-1 text-sm">{payment.provider}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="mt-1 text-sm">{formatDateTime(payment.createdAt)}</p>
            </div>
            {payment.refundAmount && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Refunded Amount</label>
                <p className="mt-1 text-sm text-red-600">{formatCurrency(payment.refundAmount, payment.currency)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Gateway Response */}
        {payment.gatewayResponse && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Gateway Response</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                {JSON.stringify(payment.gatewayResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Refund Form */}
        {isRefundMode && payment.status === 'completed' && maxRefundAmount > 0 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Refund Amount</label>
              <div className="mt-1 relative">
                <input
                  {...register('refundAmount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  max={maxRefundAmount}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{payment.currency}</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Maximum refundable: {formatCurrency(maxRefundAmount, payment.currency)}
              </p>
              {errors.refundAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.refundAmount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Refund Reason</label>
              <textarea
                {...register('refundReason')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Please provide a reason for the refund..."
              />
              {errors.refundReason && (
                <p className="mt-1 text-sm text-red-600">{errors.refundReason.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Process Refund
              </button>
            </div>
          </form>
        )}

        {/* View Mode Actions */}
        {!isRefundMode && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PaymentModal;