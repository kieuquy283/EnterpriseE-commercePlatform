import { ApiResponse, ApiError, Product, Cart, CartItem, Order, AuthResponse, OrderStatus } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiClientError extends Error {
  code: string;
  requestId?: string;
  status: number;

  constructor(code: string, message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response
  }

  if (!res.ok) {
    const errorData = (json as ApiError)?.error;
    const code = errorData?.code || `HTTP_${res.status}`;
    const message = errorData?.message || res.statusText || 'Có lỗi xảy ra khi gọi máy chủ';
    const requestId = errorData?.request_id;
    throw new ApiClientError(code, message, res.status, requestId);
  }

  // API returns { data, request_id }
  if (json && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; firstName: string; lastName: string }) =>
    request<AuthResponse>('/store/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/store/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Products
  getProducts: (params?: { q?: string; category?: string; limit?: number; offset?: number }) => {
    const search = new URLSearchParams();
    if (params?.q) search.append('q', params.q);
    if (params?.category) search.append('category', params.category);
    if (params?.limit) search.append('limit', String(params.limit));
    if (params?.offset) search.append('offset', String(params.offset));
    const qs = search.toString();
    return request<Product[]>(`/store/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: string) => request<Product>(`/store/products/${id}`),

  // Carts
  createCart: () =>
    request<Cart>('/store/carts', {
      method: 'POST',
    }),

  getCart: (id: string) => request<Cart>(`/store/carts/${id}`),

  addCartItem: (cartId: string, item: { variantId: string; quantity: number }) =>
    request<CartItem>(`/store/carts/${cartId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  checkout: (cartId: string, idempotencyKey: string) =>
    request<Order>(`/store/carts/${cartId}/checkout`, {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    }),

  // Customer Orders
  getOrders: () => request<Order[]>('/store/orders'),

  getOrder: (id: string) => request<Order>(`/store/orders/${id}`),

  // Admin
  getAdminOrders: () => request<Order[]>('/admin/orders'),

  updateAdminOrderStatus: (id: string, status: OrderStatus) =>
    request<Order>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};
