'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { ProductPrice } from '@/components/product/ProductPrice';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import {
  Package,
  ArrowLeft,
  Calendar,
  CreditCard,
  History,
  AlertCircle,
  Truck,
} from 'lucide-react';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user, token, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !token) {
      router.push(`/login?redirect=/orders/${id}`);
    }
  }, [isAuthLoading, token, router, id]);

  const { data: order, isLoading: isOrderLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: !!token && !!id,
  });

  if (isAuthLoading || (token && isOrderLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy đơn hàng</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Đơn hàng không tồn tại hoặc bạn không có quyền xem đơn hàng này.
        </p>
        <Link href="/orders">
          <Button variant="outline">Quay lại danh sách đơn hàng</Button>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách đơn hàng
        </Link>
      </div>

      {/* Order Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Chi tiết đơn hàng
            </h1>
            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
              #{order.id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Ngày đặt: {dateStr}</span>
          </div>
        </div>

        <div>
          <OrderStatusBadge status={order.status} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Items and Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Purchased Items */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package className="w-5 h-5 text-blue-600" />
              Sản phẩm đã đặt ({order.items.length})
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 flex justify-between items-center gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {item.titleSnapshot}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">SKU: {item.skuSnapshot}</span>
                      <span>&bull;</span>
                      <span>
                        <ProductPrice amount={item.unitPrice} size="sm" /> &times; {item.quantity}
                      </span>
                    </div>
                  </div>

                  <ProductPrice amount={item.unitPrice * item.quantity} size="md" />
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính:</span>
                <ProductPrice amount={order.subtotal} currency={order.currency} size="sm" />
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Vận chuyển:</span>
                <span className="text-emerald-600 font-medium">Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                <span>Tổng cộng:</span>
                <ProductPrice amount={order.total} currency={order.currency} size="lg" className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-400">
                <Truck className="w-4 h-4 text-blue-600" /> Vận chuyển
              </h4>
              <p className="font-semibold text-slate-800">Giao hàng tiêu chuẩn</p>
              <p className="text-slate-500">Khách hàng: {user?.customer?.firstName} {user?.customer?.lastName}</p>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-slate-400">
                <CreditCard className="w-4 h-4 text-emerald-600" /> Thanh toán
              </h4>
              <p className="font-semibold text-slate-800">Cổng Mock Payment</p>
              <p className="text-slate-500 font-mono text-[11px] truncate">Mã thanh toán: {order.paymentId}</p>
            </div>
          </div>
        </div>

        {/* Right Column: Status Timeline */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Tiến trình đơn hàng
            </h3>
          </div>

          <OrderTimeline history={order.statusHistory || []} />
        </div>
      </div>
    </div>
  );
}
