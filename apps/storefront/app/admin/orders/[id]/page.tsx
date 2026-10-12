'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { OrderTimeline } from '@/components/order/OrderTimeline';
import { ProductPrice } from '@/components/product/ProductPrice';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { OrderStatus } from '@/lib/types';
import {
  Package,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Save,
} from 'lucide-react';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const { user, token, isAdmin, isLoading: isAuthLoading } = useAuth();

  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('PENDING');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Admin Guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!token || !isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [isAuthLoading, token, isAdmin, router]);

  const { data: order, isLoading: isOrderLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(id),
    enabled: !!token && isAdmin && !!id,
  });

  useEffect(() => {
    if (order?.status) {
      setSelectedStatus(order.status);
    }
  }, [order?.status]);

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      setFeedback(null);
      return api.updateAdminOrderStatus(id, selectedStatus);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setFeedback({
        type: 'success',
        message: `Đã cập nhật trạng thái đơn hàng thành ${selectedStatus} thành công!`,
      });
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        message: err?.message || 'Không thể cập nhật trạng thái đơn hàng.',
      });
    },
  });

  if (isAuthLoading || (token && isAdmin && isOrderLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang tải thông tin chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-900">Không tìm thấy đơn hàng</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">Mã đơn hàng không hợp lệ.</p>
        <Link href="/admin/orders">
          <Button variant="outline" size="sm">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const availableStatuses: { value: OrderStatus; label: string }[] = [
    { value: 'PENDING', label: 'PENDING — Chờ xử lý' },
    { value: 'PROCESSING', label: 'PROCESSING — Đang xử lý đóng gói' },
    { value: 'SHIPPED', label: 'SHIPPED — Đã giao cho đơn vị vận chuyển' },
    { value: 'DELIVERED', label: 'DELIVERED — Đã giao thành công' },
    { value: 'CANCELLED', label: 'CANCELLED — Hủy đơn hàng' },
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách đơn hàng
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Xử lý đơn hàng</h1>
            <span className="font-mono text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded">
              #{order.id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Tạo lúc: {dateStr}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">Trạng thái hiện tại:</span>
          <OrderStatusBadge status={order.status} size="md" />
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Order Items & Customer details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update Control Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-blue-600" />
              Cập nhật trạng thái xử lý
            </h3>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  {availableStatuses.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                size="md"
                className="py-2.5"
                onClick={() => updateStatusMutation.mutate()}
                isLoading={updateStatusMutation.isPending}
                disabled={selectedStatus === order.status}
              >
                <Save className="w-4 h-4 mr-1" />
                Lưu trạng thái
              </Button>
            </div>

            <p className="text-[11px] text-slate-400">
              * Hành động cập nhật trạng thái sẽ tự động ghi log vào bảng OrderStatusHistory và phát sinh sự kiện outbox &ldquo;order.status_changed&rdquo;.
            </p>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100 uppercase tracking-wider">
              <Package className="w-4 h-4 text-blue-600" />
              Sản phẩm trong đơn ({order.items.length})
            </h3>

            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.titleSnapshot}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      SKU: {item.skuSnapshot} &bull; SL: {item.quantity}
                    </p>
                  </div>
                  <ProductPrice amount={item.unitPrice * item.quantity} size="sm" />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-xs">
              <span className="font-bold text-slate-900">Tổng tiền thanh toán:</span>
              <ProductPrice amount={order.total} currency={order.currency} size="lg" className="text-blue-600" />
            </div>
          </div>

          {/* Customer & Technical Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Thông tin kỹ thuật & Thanh toán
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">CUSTOMER ID:</span>
                <span className="font-mono text-slate-900">{order.customerId || 'Khách vãng lai'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">CART ID:</span>
                <span className="font-mono text-slate-900">{order.cartId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">PAYMENT ID:</span>
                <span className="font-mono text-slate-900">{order.paymentId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-mono text-[10px]">TIỀN TỆ:</span>
                <span className="font-mono text-slate-900">{order.currency}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 uppercase tracking-wider">
            Lịch sử thay đổi trạng thái
          </h3>
          <OrderTimeline history={order.statusHistory || []} />
        </div>
      </div>
    </div>
  );
}
