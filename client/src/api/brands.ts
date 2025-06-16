import { api } from './api';

export interface Brand {
  _id: string;
  name: string;
  icon: string;
  deviceType?: string;
  deviceTypeId?: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandResponse {
  success: boolean;
  data: Brand[];
  message?: string;
}

export interface BrandSingleResponse {
  success: boolean;
  data: Brand;
  message?: string;
}

export interface CreateBrandRequest {
  name: string;
  icon: string;
  deviceTypeId: string;
  deviceType: string;
  description?: string;
  isActive?: boolean;
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface UpdateBrandRequest {
  name?: string;
  icon?: string;
  deviceTypeId?: string;
  deviceType?: string;
  description?: string;
  isActive?: boolean;
}

// Get brands with filters
export const getBrands = async (params?: {
  deviceType?: string;
  deviceTypeId?: string;
  includeInactive?: boolean;
}): Promise<BrandResponse> => {
  try {
    const response = await api.get('/api/brands', { 
      params: {
        ...params,
        includeInactive: true // Always include inactive brands
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Get brand by ID
export const getBrand = async (id: string): Promise<BrandResponse> => {
  try {
    const response = await api.get(`/api/brands/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Create brand
export const createBrand = async (data: CreateBrandRequest): Promise<BrandSingleResponse> => {
  const response = await api.post('/api/brands', data);
  return response.data;
};

// Update brand
export const updateBrand = async (id: string, data: UpdateBrandRequest): Promise<BrandSingleResponse> => {
  const response = await api.put(`/api/brands/${id}`, data);
  return response.data;
};

// Delete brand
export const deleteBrand = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/api/brands/${id}`);
  return response.data;
}; 