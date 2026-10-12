'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user, token, cartId, isLoading: isAuthLoading } = useAuth();

  // Auth Guard
  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push('/login?redirect=/cart');
    }
  }, [isAuthLoading, token, router]);

  const { data: cart, isLoading: isCartLoading } = useQuery({
    queryKey: ['cart', cartId],
    queryFn: () => (cartId ? api.getCart(cartId) : null),
    enabled: !!token && !!cartId,
  });

  if (isAuthLoading || (token && cartId && isCartLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang tải giỏ hàng của bạn...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart?.subtotal || items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-blue-600" />
            Giỏ hàng của bạn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý các sản phẩm đã chọn trước khi hoàn tất đặt hàng
          </p>
        </div>

        <Link
          href="/products"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Tiếp tục chọn sản phẩm
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Giỏ hàng của bạn đang trống"
          description="Hãy dạo quanh cửa hàng và chọn những món đồ bạn yêu thích nhé!"
          actionLabel="Khám phá sản phẩm ngay"
          actionHref="/products"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm divide-y divide-slate-100">
            <div className="pb-3 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Sản phẩm ({itemCount})</span>
              <span>Thành tiền</span>
            </div>

            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1 sticky top-24">
            <CartSummary
              subtotal={subtotal}
              currency={cart?.currency || 'VND'}
              itemCount={itemCount}
              checkoutHref="/checkout"
            />
          </div>
        </div>
      )}
    </div>
  );
}
