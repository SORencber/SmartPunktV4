import { api } from './api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Part {
  _id: string;
  __v?: number;
  name: {
    tr: string;
    de: string;
    en: string;
  };
  description?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  modelId: string | { _id: string };
  brandId: string | { _id: string };
  deviceTypeId: string | { _id: string };
  category: string;
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
  compatibleWith?: string[];
  cost: number | { amount: number; currency: 'EUR' };
  margin: number;
  minStockLevel: number;
  price: number | { amount: number; currency: 'EUR' };
  shelfNumber: string;
  stock: number;
  serviceFee: {
    amount: number;
    currency: 'EUR';
  };
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  updatedBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // Branch'e özel alanlar
  branch_stock?: number;
  branch_minStockLevel?: number;
  branch_cost?: number;
  branch_price?: number;
  branch_margin?: number;
  branch_shelfNumber?: string;
  branch_serviceFee?: {
    amount: number;
    currency: 'EUR';
  };
  branch_updatedBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  branchId?: string;
  code?: string;
}

export interface CreatePartRequest {
  name: {
    tr: string;
    de: string;
    en: string;
  };
  code: string;
  modelId: string;
  model: string;
  brandId: string;
  brand: string;
  deviceTypeId: string;
  deviceType: string;
  description?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  category: string;
  barcode?: string;
  qrCode?: string;
  price: {
    amount: number;
    currency: 'EUR';
  };
  cost: {
    amount: number;
    currency: 'EUR';
  };
  margin: number;
  minStockLevel: number;
  shelfNumber: string;
  stock: number;
  branchId: string;
  isActive?: boolean;
  serviceFee: {
    amount: number;
    currency: 'EUR';
  };
}

export interface UpdatePartRequest {
  name?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  code?: string;
  modelId?: string;
  model?: string;
  brandId?: string;
  brand?: string;
  deviceTypeId?: string;
  deviceType?: string;
  description?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  category?: string;
  barcode?: string;
  qrCode?: string;
  price?: {
    amount: number;
    currency: 'EUR';
  };
  cost?: {
    amount: number;
    currency: 'EUR';
  };
  margin?: number;
  minStockLevel?: number;
  shelfNumber?: string;
  stock?: number;
  branchId?: string;
  isActive?: boolean;
  serviceFee?: {
    amount: number;
    currency: 'EUR';
  };
}

export const getParts = async (): Promise<ApiResponse<Part[]>> => {
  try {
    const response = await api.get<ApiResponse<Part[]>>('/api/parts');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to fetch parts');
  }
};

export const createPart = async (part: CreatePartRequest): Promise<ApiResponse<Part>> => {
  try {
    const response = await api.post<ApiResponse<Part>>('/api/parts', part);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to create part');
  }
};

export const updatePart = async (id: string, part: UpdatePartRequest): Promise<ApiResponse<Part>> => {
  try {
    const response = await api.put<ApiResponse<Part>>(`/api/parts/${id}`, part);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to update part');
  }
};

export const deletePart = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/api/parts/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to delete part');
  }
};

// Get parts by brand ID
export const getPartsByBrand = async (brandId: string): Promise<ApiResponse<Part[]>> => {
  try {
    const response = await api.get<ApiResponse<Part[]>>('/api/parts', {
      params: { brandId }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || 'Failed to fetch parts by brand');
  }
}; 