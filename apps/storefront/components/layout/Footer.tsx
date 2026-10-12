import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Shield, RefreshCw, Truck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 mt-20 border-t border-slate-800">
      {/* Feature Highlights */}
      <div className="border-b border-slate-800 py-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Giao hàng toàn quốc</p>
              <p className="text-xs text-slate-400">Nhận hàng nhanh chóng từ 1-3 ngày</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Bảo mật thanh toán</p>
              <p className="text-xs text-slate-400">Giao dịch an toàn và có kiểm soát</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Đổi trả dễ dàng</p>
              <p className="text-xs text-slate-400">Hỗ trợ đổi size & mẫu trong 7 ngày</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer links */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-white">CommercePro</span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm">
            Nền tảng thương mại điện tử kiến trúc Event-Driven Modular Monolith, mang đến trải nghiệm mua sắm nhanh chóng, tin cậy và mượt mà.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Cửa hàng</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-white transition-colors">
                Tất cả sản phẩm
              </Link>
            </li>
            <li>
              <Link href="/products?category=fashion" className="hover:text-white transition-colors">
                Thời trang
              </Link>
            </li>
            <li>
              <Link href="/products?category=accessories" className="hover:text-white transition-colors">
                Phụ kiện
              </Link>
            </li>
            <li>
              <Link href="/products?category=lifestyle" className="hover:text-white transition-colors">
                Đời sống
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Tài khoản & Quản trị</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/orders" className="hover:text-white transition-colors">
                Đơn hàng của tôi
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition-colors">
                Đăng nhập
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white transition-colors">
                Đăng ký thành viên
              </Link>
            </li>
            <li>
              <Link href="/admin/login" className="hover:text-white transition-colors text-slate-500">
                Cổng quản trị Staff/Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1">
          &copy; {new Date().getFullYear()} Enterprise E-commerce Platform. Xây dựng với <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> và Next.js.
        </p>
      </div>
    </footer>
  );
}
