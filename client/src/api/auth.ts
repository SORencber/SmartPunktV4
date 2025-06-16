import { api } from './api';
import { ApiResponse, User } from './types';
import { handleApiError, createApiWrapper } from '@/utils/apiErrorHandler';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse extends ApiResponse<{
  accessToken: string;
  refreshToken: string;
  user: User;
}> {}

export interface UserProfileResponse extends ApiResponse<User> {}

// Description: Login user functionality
// Endpoint: POST /api/auth/login
// Request: { email: string, password: string }
// Response: { accessToken: string, refreshToken: string }
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    console.log('🔍 Login response:', response.data);
    return {
      success: true,
      data: response.data.data || response.data, // Backend'de data field'ında dönüyor
    };
  } catch (error) {
    console.error('Error logging in:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Giriş başarısız',
    };
  }
};

// Description: Register user functionality
// Endpoint: POST /api/auth/register
// Request: { email: string, password: string, name: string, role?: string }
// Response: { user: object, accessToken: string, refreshToken: string }
export const register = async (email: string, password: string, name: string = 'New User') => {
  try {
    const response = await api.post('/api/auth/register', { email, password, name });
    return response.data.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Logout
// Endpoint: POST /api/auth/logout
// Request: {}
// Response: { success: boolean, message: string }
export const logout = async () => {
  try {
    return await api.post('/api/auth/logout');
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get current user information
// Endpoint: GET /api/auth/me
// Request: {}
// Response: { user: { id: string, email: string, name: string, role: string, branchId?: string } }
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  try {
    const response = await api.get('/api/auth/me');
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      message: 'Kullanıcı bilgileri alınamadı'
    };
  }
};

export const refreshToken = async (): Promise<LoginResponse> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/api/auth/refresh-token', { refreshToken });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Token yenilenemedi',
    };
  }
};
