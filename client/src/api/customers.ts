import { api } from './api';
import { AxiosError } from 'axios';

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  branchId: string;
  createdBy: string;
  preferredLanguage: 'TR' | 'DE' | 'EN';
  totalOrders: number;
  totalSpent: number;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  branchId: string;
  createdBy: {
    id: string;
    email?: string;
    fullName?: string;
  };
  preferredLanguage?: 'TR' | 'DE' | 'EN';
  isActive?: boolean;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
}

export interface GetCustomersResponse {
  success: boolean;
  data: Customer[];
  totalPages: number;
  currentPage: number;
  total: number;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Helper function to extract error message from axios error
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Server responded with an error status
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Network error or other axios error
    if (error.message) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Beklenmeyen bir hata oluştu';
};

export const getCustomers = async (params: GetCustomersParams = {}): Promise<GetCustomersResponse> => {
  try {
    const { page = 1, limit = 10, search = '', branchId } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(branchId && { branchId })
    });

    const response = await api.get<GetCustomersResponse>(`/api/customers?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return {
      success: false,
      data: [],
      totalPages: 0,
      currentPage: 1,
      total: 0,
      message: getErrorMessage(error)
    };
  }
};

export const getCustomer = async (id: string): Promise<ApiResponse<Customer>> => {
  try {
    const response = await api.get<ApiResponse<Customer>>(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer:', error);
    return {
      success: false,
      message: getErrorMessage(error)
    };
  }
};

export const createCustomer = async (data: CreateCustomerData): Promise<ApiResponse<Customer>> => {
  try {
    console.log('Sending customer creation request with data:', data);
    const response = await api.post<ApiResponse<Customer>>('/api/customers', data);
    console.log('Customer creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error instanceof AxiosError && error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    return {
      success: false,
      message: getErrorMessage(error)
    };
  }
};

export const updateCustomer = async (id: string, data: Partial<CreateCustomerData>): Promise<ApiResponse<Customer>> => {
  try {
    const response = await api.put<ApiResponse<Customer>>(`/api/customers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    return {
      success: false,
      message: getErrorMessage(error)
    };
  }
};

export const deleteCustomer = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete<ApiResponse<void>>(`/api/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting customer:', error);
    return {
      success: false,
      message: getErrorMessage(error)
    };
  }
};

export const addOrderToCustomer = async (customerId: string, orderData: any): Promise<ApiResponse<void>> => {
  try {
    const response = await api.post<ApiResponse<void>>(`/api/customers/${customerId}/orders`, orderData);
    return response.data;
  } catch (error) {
    console.error('Error adding order to customer:', error);
    return {
      success: false,
      message: getErrorMessage(error)
    };
  }
};