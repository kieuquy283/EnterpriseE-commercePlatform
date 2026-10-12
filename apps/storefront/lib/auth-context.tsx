'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthResponse } from './types';
import { api } from './api-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  cartId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => void;
  setCartId: (id: string | null) => void;
  ensureCart: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cartId, setCartIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth & cart from localStorage
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');
      const savedCart = localStorage.getItem('cart_id');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
      if (savedCart) {
        setCartIdState(savedCart);
      }
    } catch (e) {
      console.error('Failed to parse saved auth state', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((authData: AuthResponse) => {
    localStorage.setItem('auth_token', authData.token);
    localStorage.setItem('auth_user', JSON.stringify(authData.user));
    setToken(authData.token);
    setUser(authData.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('cart_id');
    setToken(null);
    setUser(null);
    setCartIdState(null);
  }, []);

  const setCartId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem('cart_id', id);
    } else {
      localStorage.removeItem('cart_id');
    }
    setCartIdState(id);
  }, []);

  const ensureCart = useCallback(async (): Promise<string | null> => {
    if (!token) return null;

    // If we have an existing active cartId in state/storage, verify if it's active
    if (cartId) {
      try {
        const existing = await api.getCart(cartId);
        if (existing && existing.status === 'ACTIVE') {
          return existing.id;
        }
      } catch {
        // Expired or invalid cart, will create a new one
      }
    }

    try {
      const newCart = await api.createCart();
      setCartId(newCart.id);
      return newCart.id;
    } catch (err) {
      console.error('Failed to create new cart', err);
      return null;
    }
  }, [token, cartId, setCartId]);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        cartId,
        isLoading,
        isAdmin,
        login,
        logout,
        setCartId,
        ensureCart,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
