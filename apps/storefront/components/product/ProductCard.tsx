import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { ProductPrice } from './ProductPrice';
import { Badge } from '../ui/Badge';
import { ArrowRight, Package } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const defaultVariant = product.variants?.[0];
  const price = defaultVariant?.price ?? 0;
  const stock = defaultVariant?.inventory?.quantityOnHand ?? 0;
  const isOutOfStock = stock <= 0;

  const categoryLabels: Record<string, string> = {
    fashion: 'Thời trang',
    accessories: 'Phụ kiện',
    lifestyle: 'Đời sống',
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Visual graphic placeholder with modern gradient */}
        <div className="relative w-full h-48 rounded-xl bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 flex items-center justify-center overflow-hidden mb-4 border border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-blue-600 transition-all duration-300">
            <Package className="w-8 h-8" />
          </div>

          <div className="absolute top-3 left-3">
            <Badge variant="blue" size="sm">
              {categoryLabels[product.category] || product.category}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            {isOutOfStock ? (
              <Badge variant="red" size="sm">Hết hàng</Badge>
            ) : (
              <Badge variant="green" size="sm">Còn {stock} sp</Badge>
            )}
          </div>
        </div>

        {/* Product Details */}
        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 text-base">
          {product.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
          {product.description}
        </p>

        {defaultVariant?.title && (
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Phiên bản: {defaultVariant.title}
          </p>
        )}
      </div>

      {/* Pricing & CTA */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Giá bán</span>
          <ProductPrice amount={price} size="md" />
        </div>

        <Link
          href={`/products/${product.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-all"
        >
          Chi tiết
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
