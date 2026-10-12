'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ArrowRight, Sparkles, ShoppingBag, ShieldCheck, Zap, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.getProducts({ limit: 6 }),
  });

  const categories = [
    { id: 'fashion', name: 'Thời trang', desc: 'Áo thun, phong cách tối giản', count: '12+ items' },
    { id: 'accessories', name: 'Phụ kiện', desc: 'Túi canvas, balo, ví tiện ích', count: '8+ items' },
    { id: 'lifestyle', name: 'Đời sống', desc: 'Bình giữ nhiệt, đồ gia dụng', count: '15+ items' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-8 sm:p-12 md:p-16 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nền tảng thương mại điện tử hiện đại</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Mua sắm thông minh, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Trải nghiệm vượt trội
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Khám phá bộ sưu tập sản phẩm chất lượng cao với tốc độ xử lý đơn hàng tức thì, thanh toán an toàn và quản lý kho hàng thời gian thực.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/products">
              <Button size="lg" className="shadow-lg shadow-blue-500/30">
                Khám phá danh mục
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/orders">
              <Button variant="outline" size="lg" className="border-slate-600 text-white hover:bg-slate-800">
                Theo dõi đơn hàng
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Decorative Elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:flex items-center justify-center">
          <ShoppingBag className="w-96 h-96 text-blue-400" />
        </div>
      </section>

      {/* Highlights / Features Banner */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Hiệu năng thần tốc</h4>
            <p className="text-xs text-slate-500 mt-1">Xử lý giao dịch với kiến trúc outbox event-driven và optimistic caching.</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Chống trùng lặp Idempotency</h4>
            <p className="text-xs text-slate-500 mt-1">Giao dịch checkout an toàn tuyệt đối với khóa UUID chống duplicate billing.</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Quản lý kho chính xác</h4>
            <p className="text-xs text-slate-500 mt-1">Kiểm soát tồn kho và giữ chỗ sản phẩm tự động trong transaction.</p>
          </div>
        </div>
      </section>

      {/* Category Pills */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Danh mục phổ biến</h2>
            <p className="text-xs text-slate-500 mt-0.5">Lựa chọn các phân khúc sản phẩm dành riêng cho bạn</p>
          </div>
          <Link href="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.id}`}
              className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-500 hover:shadow-md transition-all duration-200"
            >
              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{cat.desc}</p>
              <span className="inline-block mt-4 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                Xem sản phẩm &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sản phẩm nổi bật</h2>
            <p className="text-xs text-slate-500 mt-0.5">Những lựa chọn được khách hàng yêu thích nhất</p>
          </div>
          <Link href="/products" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Xem danh mục đầy đủ <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductGrid products={products} isLoading={isLoading} />
      </section>
    </div>
  );
}
