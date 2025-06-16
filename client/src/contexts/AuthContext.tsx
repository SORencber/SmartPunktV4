import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, refreshToken, getUserProfile } from '../api/auth';
import { logger } from '../utils/logger';
import { api } from '../api/api';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';

// Extend the InternalAxiosRequestConfig to include _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Tip tanımlamaları
export interface User {
  id: string;  // _id veya id olabilir
  _id?: string;  // MongoDB _id
  email: string;
  role: string;
  branchId?: string;
  branch?: {
    id: string;
    _id?: string;
    name: string;
    code: string;
    address?: {
      city?: string;
      street?: string;
      state?: string;
      country?: string;
      postalCode?: string;
    };
    phone?: string;
    email?: string;
    manager?: string;
    status: 'active' | 'inactive';
    createdAt?: string;
    updatedAt?: string;
  };
  username?: string;
  fullName?: string;
  permissions?: Array<{
    module: string;
    actions: string[];
    _id?: string;
  }>;
  preferredLanguage?: string;
  status?: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: {
    city?: string;
    street?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  phone?: string;
  managerName?: string;
  isCentral?: boolean;
  status?: 'active' | 'inactive';
}

export interface Permission {
  module: string;
  actions: string[];
  _id?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  isAuthenticated: boolean;
  refreshToken: () => Promise<boolean>;
  permissions: Permission[];
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  refreshUserData: async () => {},
  isAuthenticated: false,
  refreshToken: async () => false,
  permissions: [],
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // User değiştiğinde isAdmin ve isAuthenticated'ı güncelle
  useEffect(() => {
    setIsAuthenticated(!!user);
    setIsAdmin(user?.role === 'admin');
  }, [user]);

  // Kullanıcıyı localStorage'dan veya API'dan yükle
  const refreshUserData = useCallback(async () => {
    try {
      setError(null);
      const response = await getUserProfile();
      let userData: any = response.data;
      if (userData && userData.data) {
        userData = userData.data;
      }
      if (!userData) throw new Error('Kullanıcı verisi alınamadı');
      setUser({
        id: userData.id || userData._id,
        _id: userData._id,
        email: userData.email,
        role: userData.role,
        branchId: userData.branchId,
        branch: userData.branch ? {
          id: userData.branch.id || userData.branch._id || '',
          name: userData.branch.name || '',
          code: userData.branch.code || '',
          address: typeof userData.branch.address === 'string' 
            ? {} 
            : userData.branch.address || {},
          phone: userData.branch.phone,
          email: userData.branch.email,
          manager: userData.branch.managerName || userData.branch.manager,
          status: userData.branch.status || 'active',
          createdAt: userData.branch.createdAt,
          updatedAt: userData.branch.updatedAt,
        } : undefined,
        username: userData.username,
        fullName: userData.fullName || userData.name,
        permissions: userData.permissions || [],
        preferredLanguage: userData.preferredLanguage,
        status: userData.status,
        lastLogin: userData.lastLogin,
      });
      setPermissions(userData.permissions || []);
    } catch (err: any) {
      setError((err as Error).message || 'Kullanıcı bilgileri alınamadı');
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Sayfa yüklendiğinde token'dan user'ı al
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      const userFromToken = jwtDecode(accessToken);
      setUser(userFromToken as any);
      setPermissions((userFromToken as any).permissions || []);
    }
  }, []);

  // Login fonksiyonunda, user'ı token'dan al
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(email, password);
      if (response.success && response.data) {
        const { accessToken, refreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        const userFromToken = jwtDecode(accessToken);
        setUser(userFromToken as any);
        setPermissions((userFromToken as any).permissions || []);
        // Sonra yönlendir
        navigate('/dashboard');
      } else {
        throw new Error(response.message || 'Giriş başarısız');
      }
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setError(null);
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading: loading,
      error,
      login,
      logout,
      refreshUserData,
      isAuthenticated,
      refreshToken: async () => { const res = await refreshToken(); return res.success; },
      permissions,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
