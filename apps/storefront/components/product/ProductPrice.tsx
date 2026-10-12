import React from 'react';

export interface ProductPriceProps {
  amount: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function ProductPrice({
  amount,
  currency = 'VND',
  size = 'md',
  className = '',
}: ProductPriceProps) {
  const sizeClasses = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-xl font-bold',
    xl: 'text-2xl font-extrabold',
  };

  return (
    <span className={`text-slate-900 tracking-tight ${sizeClasses[size]} ${className}`}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
