'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { ProductPrice } from '@/components/product/ProductPrice';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Package, ArrowRight, Calendar, ShoppingBag } from 'lucide-react';

export default function CustomerOrdersPage() {
  const router = useRouter();
  const { user, token, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push('/login?redirect=/orders');
    }
  }, [isAuthLoading, token, router]);

  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders(),
    enabled: !!token,
  });

  if (isAuthLoading || (token && isOrdersLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  const orderList = orders || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Package className="w-7 h-7 text-blue-600" />
          Đơn hàng của tôi
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi và xem lại thông tin tất cả các đơn hàng đã thực hiện
        </p>
      </div>

      {orderList.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Bạn chưa có đơn hàng nào"
          description="Hãy lựa chọn những sản phẩm ưng ý và đặt đơn hàng đầu tiên ngay nhé!"
          actionLabel="Bắt đầu mua sắm"
          actionHref="/products"
        />
      ) : (
        <div className="space-y-4">
          {orderList.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-blue-300 transition-all space-y-4"
              >
                {/* Order Top Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã đơn:</span>
                      <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        #{order.id.slice(0, 12)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} size="md" />
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        <span className="font-semibold text-slate-900">{item.titleSnapshot}</span>
                        <span className="text-slate-400">({item.skuSnapshot})</span>
                        <span className="text-slate-500 font-medium">&times; {item.quantity}</span>
                      </div>
                      <ProductPrice amount={item.unitPrice * item.quantity} size="sm" />
                    </div>
                  ))}
                </div>

                {/* Bottom Bar: Total & Detail Link */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500">Tổng thanh toán ({itemCount} sp):</span>
                    <ProductPrice amount={order.total} currency={order.currency} size="lg" className="text-blue-600" />
                  </div>

                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all"
                  >
                    Xem chi tiết
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
