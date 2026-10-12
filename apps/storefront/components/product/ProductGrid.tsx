import React from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { EmptyState } from '../ui/EmptyState';

export interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ProductGrid({
  products = [],
  isLoading = false,
  emptyTitle = 'Không tìm thấy sản phẩm nào',
  emptyDescription = 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc danh mục.',
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-4"
          >
            <div className="w-full h-48 bg-slate-100 rounded-xl" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <div className="h-5 bg-slate-100 rounded w-1/3" />
              <div className="h-8 bg-slate-100 rounded-xl w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel="Xem tất cả sản phẩm"
        actionHref="/products"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
