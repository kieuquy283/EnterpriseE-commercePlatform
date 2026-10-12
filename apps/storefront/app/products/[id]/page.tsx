'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiClientError } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { ProductPrice } from '@/components/product/ProductPrice';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import {
  ShoppingBag,
  Package,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, cartId, ensureCart } = useAuth();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.getProduct(id),
    enabled: !!id,
  });

  // Set default variant when product loads
  React.useEffect(() => {
    if (product?.variants?.length && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
  }, [product, selectedVariantId]);

  const selectedVariant =
    product?.variants.find((v) => v.id === selectedVariantId) ||
    product?.variants[0];

  const stockOnHand = selectedVariant?.inventory?.quantityOnHand ?? 0;
  const stockReserved = selectedVariant?.inventory?.quantityReserved ?? 0;
  const availableStock = Math.max(0, stockOnHand - stockReserved);
  const isOutOfStock = availableStock <= 0;

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async () => {
      setErrorMessage(null);
      if (!token) {
        // Redirect to login
        router.push(`/login?redirect=/products/${id}`);
        return;
      }
      if (!selectedVariant) throw new Error('Vui lòng chọn biến thể sản phẩm');

      // Ensure active cart exists
      const targetCartId = await ensureCart();
      if (!targetCartId) {
        throw new Error('Không thể khởi tạo giỏ hàng. Vui lòng thử lại.');
      }

      return api.addCartItem(targetCartId, {
        variantId: selectedVariant.id,
        quantity,
      });
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        setSuccessModalOpen(true);
      }
    },
    onError: (err: any) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'OUT_OF_STOCK') {
          setErrorMessage('Sản phẩm hiện không đủ số lượng trong kho.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng.');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-slate-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Không tìm thấy sản phẩm</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không chính xác.
        </p>
        <Link href="/products">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh mục sản phẩm
        </Link>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
        {/* Left: Product Image & Badges */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-tr from-slate-100 via-slate-50 to-blue-50/50 flex items-center justify-center border border-slate-200/60 overflow-hidden">
            <div className="w-28 h-28 rounded-3xl bg-white/90 shadow-md flex items-center justify-center text-slate-400">
              <Package className="w-16 h-16 text-blue-600" />
            </div>

            <div className="absolute top-4 left-4">
              <Badge variant="blue" size="md">
                {product.category}
              </Badge>
            </div>

            <div className="absolute top-4 right-4">
              {isOutOfStock ? (
                <Badge variant="red" size="md">Hết hàng</Badge>
              ) : (
                <Badge variant="green" size="md">Còn {availableStock} sản phẩm</Badge>
              )}
            </div>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
              <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Giao hàng toàn quốc</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Bảo đảm chính hãng 100%</span>
            </div>
          </div>
        </div>

        {/* Right: Details, Variant Selector, Quantity, Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-mono text-slate-400 block uppercase mb-1">
                SKU: {selectedVariant?.sku || product.id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {product.title}
              </h1>
            </div>

            {/* Price */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Giá niêm yết:</span>
                <ProductPrice
                  amount={selectedVariant?.price ?? 0}
                  size="xl"
                  className="text-blue-600"
                />
              </div>

              <div>
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-red-600">Tạm thời hết hàng</span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng giao
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Mô tả sản phẩm
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variant Selector */}
            {product.variants.length > 0 && (
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Chọn phân loại / phiên bản:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    const vStock = Math.max(0, (v.inventory?.quantityOnHand ?? 0) - (v.inventory?.quantityReserved ?? 0));
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{v.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({vStock} sp)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Số lượng mua:
              </label>
              <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  disabled={quantity >= availableStock || isOutOfStock}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <Button
              size="lg"
              className="w-full text-base py-3.5 shadow-md shadow-blue-500/25"
              disabled={isOutOfStock}
              isLoading={addToCartMutation.isPending}
              onClick={() => addToCartMutation.mutate()}
            >
              <ShoppingBag className="w-5 h-5 mr-1" />
              {token
                ? isOutOfStock
                  ? 'Hết hàng'
                  : 'Thêm vào giỏ hàng'
                : 'Đăng nhập để thêm vào giỏ hàng'}
            </Button>

            {!token && (
              <p className="text-center text-xs text-slate-400">
                Bạn chưa đăng nhập?{' '}
                <Link href={`/login?redirect=/products/${id}`} className="text-blue-600 font-semibold underline">
                  Đăng nhập ngay
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Đã thêm vào giỏ hàng thành công!"
      >
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              {product.title} &times; {quantity}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Phân loại: {selectedVariant?.title}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setSuccessModalOpen(false)}
            >
              Tiếp tục mua hàng
            </Button>
            <Button
              onClick={() => {
                setSuccessModalOpen(false);
                router.push('/cart');
              }}
            >
              Xem giỏ hàng
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
