export interface Price {
  amount: number;
  currency: string;
  originalAmount?: number;
}

export interface Rating {
  avg: number;
  count: number;
}

export interface Variant {
  sku: string;
  attributes: Record<string, string>;
  price: Price;
  stock: number;
  images?: string[];
}

export interface Shipping {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  freeShipping: boolean;
  estimatedDays: number;
}

export interface Seller {
  id: string;
  name: string;
  location: string;
  rating: number;
}

export interface QA {
  question: string;
  answer: string;
  askedBy: string;
  askedAt: string;
  answeredAt?: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  rating: number;
  createdAt: string;
  isVerified?: boolean;
}

export interface SEO {
  title?: string;
  description?: string;
  keywords?: string[];
  slug?: string;
}

export interface Product {
  id: string;
  type: string;
  category: string;
  subCategory?: string;
  name: string;
  brand: string;
  price: {
    currency: string;
    value: number;
  };
  images: string[];
  video?: string;
  description: string;
  rating: {
    average: number;
    count: number;
  };
  variants: Array<{
    sku: string;
    attributes: Record<string, string>;
    stock: number;
  }>;
  order_type: 'bulk order' | 'single order' | 'both';
  shipping: {
    est_delivery_days: string;
    warehouse: string;
    shipping_methods: Array<{
      name: string;
      cost: {
        currency: string;
        value: number;
      };
    }>;
  };
  seller: {
    id: string;
    name: string;
  };
  attributes: Record<string, unknown>;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    comment: string;
    rating: number;
    createdAt: string;
  }>;
  qa: Array<{
    question: string;
    answer: string;
    askedBy: string;
    askedAt: string;
    answeredAt?: string;
  }>;
}
