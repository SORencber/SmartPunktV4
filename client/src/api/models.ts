import { api } from './api';

export interface Model {
  _id: string;
  name: string;
  brand: string;
  brandId?: string;
  deviceType: string;
  deviceTypeId?: string;
  icon: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ModelResponse {
  success: boolean;
  data: Model[];
  message?: string;
}

export interface ModelSingleResponse {
  success: boolean;
  data: Model;
  message?: string;
}

export interface CreateModelRequest {
  name: string;
  brand: string;
  brandId?: string;
  deviceType: string;
  deviceTypeId?: string;
  icon: string;
  description?: string;
}

export interface UpdateModelRequest {
  name: string;
  brand: string;
  brandId?: string;
  deviceType: string;
  deviceTypeId?: string;
  icon: string;
  description?: string;
}

// Get models with filters
export const getModels = async (params?: {
  brand?: string;
  brandId?: string;
  deviceType?: string;
  deviceTypeId?: string;
}): Promise<ModelResponse> => {
  try {
    const response = await api.get('/api/models', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Get model by ID
export const getModel = async (id: string): Promise<ModelResponse> => {
  try {
    const response = await api.get(`/api/models/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Create model
export const createModel = async (data: CreateModelRequest): Promise<ModelSingleResponse> => {
  const response = await api.post('/api/models', data);
  return response.data;
};

// Update model
export const updateModel = async (id: string, data: UpdateModelRequest): Promise<ModelSingleResponse> => {
  const response = await api.put(`/api/models/${id}`, data);
  return response.data;
};

// Delete model
export const deleteModel = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/api/models/${id}`);
  return response.data;
}; 