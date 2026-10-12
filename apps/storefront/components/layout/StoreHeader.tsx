'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, User, LogOut, Package, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function StoreHeader() {
  const router = useRouter();
  const { user, token, cartId, logout, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch cart to show cart count badge
  const { data: cart } = useQuery({
    queryKey: ['cart', cartId],
    queryFn: () => (cartId ? api.getCart(cartId) : null),
    enabled: !!token && !!cartId,
  });

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:bg-blue-700 transition-colors">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
            Commerce<span className="text-blue-600">Pro</span>
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm, phụ kiện, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>

        {/* Navigation Items */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/products" className="hover:text-blue-600 transition-colors">
            Sản phẩm
          </Link>
          {token && (
            <Link href="/orders" className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              Đơn hàng
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin/orders"
              className="text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 font-semibold text-xs border border-amber-200"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Quản trị Admin
            </Link>
          )}
        </nav>

        {/* Action Buttons: Cart & Auth */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            aria-label="Giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* User Auth Info */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {user.customer?.firstName
                    ? `${user.customer.firstName} ${user.customer.lastName || ''}`
                    : user.email}
                </span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-medium text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3.5 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-4 border-t border-slate-200 bg-white space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm bg-slate-50"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
          <div className="flex flex-col gap-2 pt-2 text-sm font-medium text-slate-700">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600"
            >
              Danh sách sản phẩm
            </Link>
            {token && (
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600"
              >
                Đơn hàng của tôi
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-amber-700 font-semibold"
              >
                Quản trị Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
