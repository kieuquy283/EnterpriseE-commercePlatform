export type UserRole = 'CUSTOMER' | 'STAFF' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  customer?: Customer;
}

export interface Customer {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface InventoryItem {
  id: string;
  variantId: string;
  quantityOnHand: number;
  quantityReserved: number;
  version: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  price: number;
  weight?: number;
  inventory?: InventoryItem | null;
  product?: Product;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  variant: ProductVariant;
  quantity: number;
  unitPrice: number;
}

export interface Cart {
  id: string;
  customerId?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  currency: string;
  subtotal: number;
  total: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  skuSnapshot: string;
  titleSnapshot: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus?: OrderStatus | null;
  toStatus: OrderStatus;
  actorId?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId?: string;
  customer?: Customer;
  cartId: string;
  paymentId: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  total: number;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  request_id: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}
