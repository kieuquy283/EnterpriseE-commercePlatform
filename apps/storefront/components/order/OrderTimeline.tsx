import React from 'react';
import { OrderStatusHistory } from '@/lib/types';
import { OrderStatusBadge } from './OrderStatusBadge';
import { CheckCircle2 } from 'lucide-react';

export interface OrderTimelineProps {
  history: OrderStatusHistory[];
}

export function OrderTimeline({ history = [] }: OrderTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <p className="text-xs text-slate-400 italic">Chưa có lịch sử trạng thái cập nhật.</p>
    );
  }

  // Sort by createdAt ascending
  const sorted = [...history].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {sorted.map((item, idx) => {
        const isLatest = idx === sorted.length - 1;
        const dateStr = new Date(item.createdAt).toLocaleString('vi-VN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div key={item.id} className="relative flex flex-col gap-1">
            {/* Timeline bullet dot */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                isLatest
                  ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
            </div>

            <div className="flex items-center gap-2">
              <OrderStatusBadge status={item.toStatus} size="sm" />
              <span className="text-xs text-slate-500 font-mono">{dateStr}</span>
            </div>

            {item.fromStatus && (
              <p className="text-xs text-slate-500 mt-0.5">
                Chuyển từ <span className="font-semibold">{item.fromStatus}</span> sang{' '}
                <span className="font-semibold">{item.toStatus}</span>
              </p>
            )}

            {item.actorId && (
              <p className="text-[11px] text-slate-400">
                Thực hiện bởi: <span className="font-mono">{item.actorId}</span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
