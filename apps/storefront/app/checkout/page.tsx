'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api-client';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { Spinner } from '@/components/ui/Spinner';
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, cartId, setCartId, isLoading: isAuthLoading } = useAuth();

  // Generate or persist idempotency key for this checkout attempt
  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = crypto.randomUUID();
  }

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthLoading, token, router]);

  const { data: cart, isLoading: isCartLoading } = useQuery({
    queryKey: ['cart', cartId],
    queryFn: () => (cartId ? api.getCart(cartId) : null),
    enabled: !!token && !!cartId,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (!cartId) throw new Error('Không tìm thấy giỏ hàng để thanh toán');
      return api.checkout(cartId, idempotencyKeyRef.current);
    },
    onSuccess: (order) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Reset cartId since it's completed
      setCartId(null);
      // Redirect to order details
      router.push(`/orders/${order.id}`);
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'OUT_OF_STOCK') {
          setErrorMessage('Một số mặt hàng trong giỏ đã hết hàng hoặc không đủ số lượng.');
        } else if (err.code === 'CART_INVALID') {
          setErrorMessage('Giỏ hàng trống hoặc không hợp lệ.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err?.message || 'Có lỗi xảy ra trong quá trình thanh toán.');
      }
    },
  });

  if (isAuthLoading || (token && cartId && isCartLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang chuẩn bị trang thanh toán...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart?.subtotal || items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Giỏ hàng của bạn đang trống</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Vui lòng thêm sản phẩm vào giỏ trước khi tiến hành thanh toán.
        </p>
        <Link href="/products">
          <button className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Xem sản phẩm
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-emerald-600" />
            Xác nhận thanh toán an toàn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kiểm tra thông tin giao hàng và xác nhận đơn hàng
          </p>
        </div>

        <Link
          href="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại giỏ hàng
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Customer Details & Mock Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Thông tin người nhận
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Họ và tên:</span>
                <span className="font-semibold text-slate-900">
                  {user?.customer?.firstName} {user?.customer?.lastName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email liên hệ:</span>
                <span className="font-semibold text-slate-900">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Địa chỉ nhận hàng:</span>
                <span className="font-semibold text-slate-900">
                  Giao hàng tiêu chuẩn (Địa chỉ mặc định)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Thời gian nhận dự kiến:</span>
                <span className="font-semibold text-emerald-600">1 - 3 ngày làm việc</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Phương thức thanh toán
            </h3>

            <div className="p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Mock Payment Provider</p>
                  <p className="text-xs text-slate-500">
                    Cổng thanh toán tự động giả lập (Môi trường MVP)
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Idempotency Guarantee
              </div>
              <p className="font-mono text-[11px] text-slate-400 break-all">
                Key: {idempotencyKeyRef.current}
              </p>
            </div>
          </div>

          {/* Order Items Review */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 mb-2">
              Sản phẩm trong đơn hàng ({itemCount})
            </h3>
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1 sticky top-24">
          <CartSummary
            subtotal={subtotal}
            currency={cart?.currency || 'VND'}
            itemCount={itemCount}
            isCheckoutPage
            isLoading={checkoutMutation.isPending}
            onCheckout={() => checkoutMutation.mutate()}
          />
        </div>
      </div>
    </div>
  );
}
