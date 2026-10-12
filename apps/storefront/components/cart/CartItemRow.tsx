import React from 'react';
import Link from 'next/link';
import { CartItem } from '@/lib/types';
import { ProductPrice } from '../product/ProductPrice';
import { Package } from 'lucide-react';

export interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const lineTotal = item.unitPrice * item.quantity;
  const productTitle = item.variant?.product?.title || 'Sản phẩm';
  const variantTitle = item.variant?.title;
  const sku = item.variant?.sku;

  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center gap-4">
        {/* Thumbnail Placeholder */}
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0 border border-slate-200">
          <Package className="w-6 h-6" />
        </div>

        <div>
          <Link
            href={item.variant?.productId ? `/products/${item.variant.productId}` : '#'}
            className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
          >
            {productTitle}
          </Link>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            {variantTitle && (
              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                {variantTitle}
              </span>
            )}
            {sku && <span className="font-mono text-slate-400">SKU: {sku}</span>}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Đơn giá: <ProductPrice amount={item.unitPrice} size="sm" /> &times; {item.quantity}
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <ProductPrice amount={lineTotal} size="md" />
        <span className="block text-[11px] text-slate-400 mt-0.5">Số lượng: {item.quantity}</span>
      </div>
    </div>
  );
}
