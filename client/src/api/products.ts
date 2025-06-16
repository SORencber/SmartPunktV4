import { api } from './api';

export interface Product {
  _id?: string;
  type: 'Computer' | 'Tablet' | 'iPad' | 'Phone' | 'Other';
  brand: string;
  model: string;
  part: string;
  branchId?: string;
  descriptions: {
    tr: string;
    de: string;
    en: string;
  };
  specifications?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  price: number;
  stock: number;
  minStockLevel?: number;
  warrantyEligible?: boolean;
  warrantyTerms?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  message?: string;
}

export interface ProductSingleResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface CreateProductRequest {
  type: 'Computer' | 'Tablet' | 'iPad' | 'Phone' | 'Other';
  brand: string;
  model: string;
  part: string;
  branchId?: string;
  descriptions: {
    tr: string;
    de: string;
    en: string;
  };
  specifications?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  price: number;
  stock: number;
  minStockLevel?: number;
  warrantyEligible?: boolean;
  warrantyTerms?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  status?: 'active' | 'inactive';
}

export interface UpdateProductRequest {
  type?: 'Computer' | 'Tablet' | 'iPad' | 'Phone' | 'Other';
  brand?: string;
  model?: string;
  part?: string;
  branchId?: string;
  descriptions?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  specifications?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  price?: number;
  stock?: number;
  minStockLevel?: number;
  warrantyEligible?: boolean;
  warrantyTerms?: {
    tr?: string;
    de?: string;
    en?: string;
  };
  status?: 'active' | 'inactive';
}

// Description: Get all products with pagination and filtering
// Endpoint: GET /api/products
export const getProducts = async (params?: {
  type?: string;
  brand?: string;
  model?: string;
  branchId?: string;
  status?: string;
}): Promise<ProductResponse> => {
  try {
    const response = await api.get('/api/products', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Get product by ID
// Endpoint: GET /api/products/:id
export const getProduct = async (id: string) => {
  try {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

// Description: Create new product
// Endpoint: POST /api/products
export const createProduct = async (data: CreateProductRequest): Promise<ProductSingleResponse> => {
  const response = await api.post('/api/products', data);
  return response.data;
};

// Description: Update product
// Endpoint: PUT /api/products/:id
export const updateProduct = async (id: string, data: UpdateProductRequest): Promise<ProductSingleResponse> => {
  const response = await api.put(`/api/products/${id}`, data);
  return response.data;
};

// Description: Delete product
// Endpoint: DELETE /api/products/:id
export const deleteProduct = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};

// Description: Get device models by type and brand
// Endpoint: GET /api/models
// Request: { deviceType: string, brand: string }
// Response: { models: Array<{ _id: string, name: string, compatibility: Array<string> }> }
export const getDeviceModels = async (deviceType: string, brand: string) => {
  try {
    const response = await api.get('/api/models', { params: { deviceType, brand } });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Get available parts/products for device model
// Endpoint: GET /api/products/parts
// Request: { deviceModel: string }
// Response: { parts: Array<{ _id: string, name: string, category: string, price: number, cost: number, currentStock: number, description: string }> }
export const getDeviceParts = async (deviceModel: string) => {
  try {
    const response = await api.get('/api/products/parts', { params: { deviceModel } });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Get labor/service options
// Endpoint: GET /api/products/services
// Request: {}
// Response: { services: Array<{ _id: string, name: string, price: number, duration: string, description: string }> }
export const getServices = async () => {
  try {
    const response = await api.get('/api/products/services');
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}