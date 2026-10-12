import React from 'react';
import { OrderStatus } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { Clock, RefreshCw, Truck, CheckCircle2, XCircle } from 'lucide-react';

export interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export function OrderStatusBadge({ status, size = 'sm' }: OrderStatusBadgeProps) {
  const configs: Record<
    OrderStatus,
    { label: string; variant: 'amber' | 'blue' | 'purple' | 'green' | 'red'; icon: React.ReactNode }
  > = {
    PENDING: {
      label: 'Chờ xử lý',
      variant: 'amber',
      icon: <Clock className="w-3 h-3" />,
    },
    PROCESSING: {
      label: 'Đang xử lý',
      variant: 'blue',
      icon: <RefreshCw className="w-3 h-3" />,
    },
    SHIPPED: {
      label: 'Đang giao hàng',
      variant: 'purple',
      icon: <Truck className="w-3 h-3" />,
    },
    DELIVERED: {
      label: 'Đã giao hàng',
      variant: 'green',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    CANCELLED: {
      label: 'Đã hủy',
      variant: 'red',
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const config = configs[status] || {
    label: status,
    variant: 'amber',
    icon: null,
  };

  return (
    <Badge variant={config.variant} size={size}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}
