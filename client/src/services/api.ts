import axios from 'axios';

// Types
export interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

export interface DeviceType {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface Brand {
  _id: string;
  name: string;
  deviceTypeId: string;
  isActive: boolean;
}

export interface Model {
  _id: string;
  name: string;
  brandId: string;
  isActive: boolean;
}

export interface Part {
  _id: string;
  name: string;
  price: {
    amount: number;
  };
  stock: number;
  isActive: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  parts: Array<{
    partId: string;
    quantity: number;
  }>;
  isCentralService: boolean;
}

// API client setup
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const login = async (email: string, password: string) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

// Device API
export const getDeviceTypes = async () => {
  try {
    const { data } = await api.get('/deviceTypes');
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch device types');
  }
};

export const getBrands = async ({ deviceTypeId }: { deviceTypeId: string }) => {
  try {
    const { data } = await api.get(`/brands?deviceTypeId=${deviceTypeId}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch brands');
  }
};

export const getModels = async ({ brandId }: { brandId: string }) => {
  try {
    const { data } = await api.get(`/models?brandId=${brandId}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch models');
  }
};

// Parts API
export const getParts = async () => {
  try {
    const { data } = await api.get('/parts');
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch parts');
  }
};

// Customer API
export const getCustomers = async ({ query, limit }: { query?: string; limit?: number }) => {
  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (limit) params.append('limit', limit.toString());
    
    const { data } = await api.get(`/customers?${params.toString()}`);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch customers');
  }
};

// Order API
export const createOrder = async (orderData: Order) => {
  try {
    const { data } = await api.post('/orders', orderData);
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

// Re-export all API functions for backward compatibility
export { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '@/api/customers';

export { getAllBranches as getBranches } from '@/api/branches';

export { api } from '@/api/api'; 