'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, LogIn, AlertCircle, Sparkles } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
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
      login(res);
      router.push(redirectUrl);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.code === 'INVALID_CREDENTIALS') {
          setErrorMessage('Email hoặc mật khẩu không chính xác.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err?.message || 'Đăng nhập thất bại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCustomer = () => {
    setEmail('customer@commerce.local');
    setPassword('Customer@123456');
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập tài khoản
          </h1>
          <p className="text-xs text-slate-500">
            Truy cập giỏ hàng, đặt hàng và theo dõi tiến độ giao nhận
          </p>
        </div>

        {/* Demo Fast Login Helper */}
        <button
          type="button"
          onClick={fillDemoCustomer}
          className="w-full p-3 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-left flex items-center justify-between hover:bg-blue-100/70 transition-colors group"
        >
          <div>
            <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Điền tài khoản khách mẫu:
            </span>
            <span className="text-[11px] text-blue-700 font-mono block mt-0.5">
              customer@commerce.local
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 underline group-hover:text-blue-800">
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
            label="Địa chỉ Email"
            type="email"
            required
            placeholder="ban@example.com"
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
            className="w-full py-3"
            size="lg"
            isLoading={isLoading}
          >
            Đăng nhập
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p>
            Chưa có tài khoản?{' '}
            <Link
              href={`/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="text-blue-600 font-bold hover:underline"
            >
              Đăng ký thành viên
            </Link>
          </p>

          <p className="text-[11px] text-slate-400">
            Bạn là quản trị viên?{' '}
            <Link href="/admin/login" className="text-slate-600 font-medium hover:underline">
              Đăng nhập Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải biểu mẫu...</div>}>
      <LoginForm />
    </Suspense>
  );
}
