export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash_on_delivery';
export type PaymentProvider = 'stripe' | 'paypal' | 'razorpay' | 'bank';

export interface Payment {
  id: string;
  orderId: string;
  orderNo: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gatewayTransactionId?: string;
  gatewayResponse?: Record<string, unknown>;
  refundAmount?: number;
  refundReason?: string;
  createdAt: string;
  updatedAt: string;
}