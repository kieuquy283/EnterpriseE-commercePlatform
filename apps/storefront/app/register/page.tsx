'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api, ApiClientError } from '@/lib/api-client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, UserPlus, AlertCircle, User } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { login } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có tối thiểu 8 ký tự.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.register({
        email,
        password,
        firstName,
        lastName,
      });
      login(res);
      router.push(redirectUrl);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.code === 'EMAIL_EXISTS') {
          setErrorMessage('Email này đã được sử dụng. Vui lòng đăng nhập hoặc chọn email khác.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err?.message || 'Đăng ký tài khoản thất bại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tạo tài khoản mới
          </h1>
          <p className="text-xs text-slate-500">
            Trở thành thành viên để tận hưởng mua sắm thông minh
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Họ đệm"
              required
              placeholder="Nguyễn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Tên"
              required
              placeholder="Văn An"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

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
            label="Mật khẩu (tối thiểu 8 ký tự)"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            helperText="Nên chứa cả chữ và số để tăng bảo mật"
          />

          <Button
            type="submit"
            className="w-full py-3"
            size="lg"
            isLoading={isLoading}
          >
            Đăng ký tài khoản
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          <p>
            Đã có tài khoản?{' '}
            <Link
              href={`/login${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="text-blue-600 font-bold hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Đang tải biểu mẫu...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
