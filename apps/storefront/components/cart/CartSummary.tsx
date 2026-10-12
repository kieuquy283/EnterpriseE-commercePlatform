import React from 'react';
import Link from 'next/link';
import { ProductPrice } from '../product/ProductPrice';
import { Button } from '../ui/Button';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export interface CartSummaryProps {
  subtotal: number;
  currency?: string;
  itemCount: number;
  checkoutHref?: string;
  isCheckoutPage?: boolean;
  onCheckout?: () => void;
  isLoading?: boolean;
}

export function CartSummary({
  subtotal,
  currency = 'VND',
  itemCount,
  checkoutHref = '/checkout',
  isCheckoutPage = false,
  onCheckout,
  isLoading = false,
}: CartSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
          Tóm tắt đơn hàng
        </h3>

        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Tổng số lượng:</span>
            <span className="font-medium text-slate-900">{itemCount} sản phẩm</span>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Tạm tính:</span>
            <ProductPrice amount={subtotal} currency={currency} size="sm" />
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Phí vận chuyển:</span>
            <span className="text-emerald-600 font-medium">Miễn phí</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="font-bold text-slate-900">Tổng thanh toán:</span>
            <ProductPrice amount={subtotal} currency={currency} size="lg" className="text-blue-600" />
          </div>
        </div>
      </div>

      <div>
        {!isCheckoutPage ? (
          <Link href={checkoutHref} className="block w-full">
            <Button
              className="w-full"
              size="lg"
              disabled={itemCount === 0 || isLoading}
            >
              Tiến hành thanh toán
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            isLoading={isLoading}
            disabled={itemCount === 0 || isLoading}
          >
            Xác nhận đặt hàng & Thanh toán
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Thanh toán an toàn với Mock Provider</span>
        </div>
      </div>
    </div>
  );
}
