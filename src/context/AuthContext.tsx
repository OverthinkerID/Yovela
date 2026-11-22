'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type UserRole = 'DOKTER' | 'DOKTER_LAIN' | 'PENDAFTARAN' | 'KASIR';

export interface User {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: UserRole;
  roleLabel: string;
  sipNumber?: string | null;
}

export interface StaffAccount extends User {
  isActive?: boolean;
  newPassword?: string;
}

interface AuthContextType {
  currentUser: User | null;
  staffUsers: StaffAccount[];
  loginWithCredentials: (identifier: string, pass: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  registerAccount: (payload: {
    name: string;
    email?: string;
    username?: string;
    pass: string;
    registrationToken: string;
  }) => Promise<{ success: boolean; message?: string; assignedRole?: string }>;
  loadStaffUsers: () => Promise<StaffAccount[]>;
  updateStaffUsers: (updates: StaffAccount[]) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  staffUsers: [],
  loginWithCredentials: async () => ({ success: false }),
  registerAccount: async () => ({ success: false }),
  loadStaffUsers: async () => [],
  updateStaffUsers: async () => ({ success: false }),
  logout: async () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user || null);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const loadStaffUsers = useCallback(async (): Promise<StaffAccount[]> => {
    try {
      const res = await fetch('/api/auth/users', { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      const list = Array.isArray(data.users) ? data.users : [];
      setStaffUsers(list);
      return list;
    } catch {
      return [];
    }
  }, []);

  const updateStaffUsers = async (updates: StaffAccount[]) => {
    try {
      const res = await fetch('/api/auth/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: updates }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gagal menyimpan perubahan akun.' };
      }
      setStaffUsers(data.users || []);
      await fetchMe();
      return { success: true };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  };

  const registerAccount = async ({
    name,
    email,
    username,
    pass,
    registrationToken,
  }: {
    name: string;
    email?: string;
    username?: string;
    pass: string;
    registrationToken: string;
  }) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, username, password: pass, registrationToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Gagal mendaftarkan akun.' };
      }
      return { success: true, assignedRole: data.user?.roleLabel || data.user?.role };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server.' };
    }
  };

  const loginWithCredentials = async (identifier: string, pass: string, rememberMe = false) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, username: identifier, password: pass, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Email atau kata sandi tidak valid.' };
      }
      setCurrentUser(data.user);
      return { success: true };
    } catch {
      return { success: false, message: 'Gagal terhubung ke server autentikasi.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    setStaffUsers([]);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        staffUsers,
        loginWithCredentials,
        registerAccount,
        loadStaffUsers,
        updateStaffUsers,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
