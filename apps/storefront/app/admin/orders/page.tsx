'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/order/OrderStatusBadge';
import { ProductPrice } from '@/components/product/ProductPrice';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { OrderStatus } from '@/lib/types';
import {
  Package,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, token, isAdmin, isLoading: isAuthLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Admin Guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!token || !isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [isAuthLoading, token, isAdmin, router]);

  const { data: orders, isLoading: isOrdersLoading, refetch } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => api.getAdminOrders(),
    enabled: !!token && isAdmin,
  });

  if (isAuthLoading || (token && isAdmin && isOrdersLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang tải danh sách đơn hàng quản trị...</p>
      </div>
    );
  }

  const allOrders = orders || [];

  const filteredOrders = allOrders.filter((order) => {
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some((i) => i.titleSnapshot.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const statuses: { id: string; label: string }[] = [
    { id: 'ALL', label: 'Tất cả đơn' },
    { id: 'PENDING', label: 'Chờ xử lý' },
    { id: 'PROCESSING', label: 'Đang xử lý' },
    { id: 'SHIPPED', label: 'Đang giao' },
    { id: 'DELIVERED', label: 'Đã giao' },
    { id: 'CANCELLED', label: 'Đã hủy' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Quản lý Đơn hàng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng cộng: <span className="font-bold text-slate-900">{allOrders.length}</span> đơn hàng trong hệ thống
          </p>
        </div>

        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, khách hàng, sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => {
            const isActive = statusFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="Không tìm thấy đơn hàng nào"
          description="Chưa có đơn hàng nào khớp với điều kiện lọc hiện tại."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đơn hàng</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Sản phẩm</th>
                  <th className="py-3 px-4">Tổng tiền</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString('vi-VN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });
                  const customerName = order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName}`
                    : 'Khách vãng lai';

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{order.id.slice(0, 10)}...
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {order.customerId || 'N/A'}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="line-clamp-2 text-slate-600">
                          {order.items?.map((item, idx) => (
                            <span key={item.id}>
                              {item.titleSnapshot} (&times;{item.quantity})
                              {idx < order.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <ProductPrice amount={order.total} currency={order.currency} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <OrderStatusBadge status={order.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Xử lý <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
