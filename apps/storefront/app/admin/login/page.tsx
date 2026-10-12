'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await api.login({ email, password });
      if (res.user.role !== 'ADMIN' && res.user.role !== 'STAFF') {
        setErrorMessage('Tài khoản này không có quyền truy cập trang quản trị (Cần role ADMIN hoặc STAFF).');
        return;
      }
      login(res);
      router.push('/admin/orders');
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setErrorMessage('Email hoặc mật khẩu quản trị không chính xác.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err?.message || 'Đăng nhập admin thất bại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@commerce.local');
    setPassword('Admin@123456');
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-blue-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Admin Portal
          </h1>
          <p className="text-xs text-slate-500">
            Khu vực dành riêng cho Nhân viên & Quản trị viên hệ thống
          </p>
        </div>

        {/* Demo Fast Admin Fill */}
        <button
          type="button"
          onClick={fillDemoAdmin}
          className="w-full p-3 rounded-2xl bg-amber-50 border border-amber-200 text-left flex items-center justify-between hover:bg-amber-100/80 transition-colors group"
        >
          <div>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-700" /> Tài khoản Quản trị mẫu:
            </span>
            <span className="text-[11px] text-amber-800 font-mono block mt-0.5">
              admin@commerce.local
            </span>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 underline group-hover:text-amber-950">
            Áp dụng
          </span>
        </button>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Quản trị"
            type="email"
            required
            placeholder="admin@commerce.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Mật khẩu"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
          />

          <Button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-900/20"
            size="lg"
            isLoading={isLoading}
          >
            Đăng nhập hệ thống quản trị
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay về trang bán lẻ Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
