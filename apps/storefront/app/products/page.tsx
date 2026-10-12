'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';

  const [searchInput, setSearchInput] = useState(qParam);

  useEffect(() => {
    setSearchInput(qParam);
  }, [qParam]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', qParam, categoryParam],
    queryFn: () =>
      api.getProducts({
        q: qParam || undefined,
        category: categoryParam || undefined,
      }),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput.trim()) {
      params.set('q', searchInput.trim());
    } else {
      params.delete('q');
    }
    router.push(`/products?${params.toString()}`);
  };

  const handleCategorySelect = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (cat) {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchInput('');
    router.push('/products');
  };

  const categories = [
    { id: '', label: 'Tất cả danh mục' },
    { id: 'fashion', label: 'Thời trang' },
    { id: 'accessories', label: 'Phụ kiện' },
    { id: 'lifestyle', label: 'Đời sống' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Danh mục sản phẩm
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Khám phá các sản phẩm chất lượng cao với thông tin giá và tồn kho thời gian thực
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Button type="submit" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2 py-1.5">
            Tìm
          </Button>
        </form>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          {categories.map((c) => {
            const isActive = categoryParam === c.id;
            return (
              <button
                key={c.id}
                onClick={() => handleCategorySelect(c.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            );
          })}

          {(qParam || categoryParam) && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 ml-2 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Active Filter indicator */}
      {(qParam || categoryParam) && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Kết quả lọc:</span>
          {qParam && (
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-mono">
              Từ khóa &ldquo;{qParam}&rdquo;
            </span>
          )}
          {categoryParam && (
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
              Danh mục: {categoryParam}
            </span>
          )}
        </div>
      )}

      {/* Product List */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        emptyTitle={
          qParam || categoryParam
            ? 'Không tìm thấy sản phẩm phù hợp'
            : 'Hiện chưa có sản phẩm nào'
        }
        emptyDescription="Hãy thử tìm với từ khóa khác hoặc bỏ các bộ lọc đang chọn."
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải sản phẩm...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
