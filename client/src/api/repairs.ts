// Stubs for repair-related API functions to satisfy TypeScript during compile.
// TODO: Replace with real implementations.

import { api } from './api';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Generic success response
const ok = <T = any>(data: T = {} as T): ApiResponse<T> => ({ success: true, data });

export const loadRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const updateRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const addPart = async (..._args: any[]): Promise<ApiResponse> => ok();
export const removePart = async (..._args: any[]): Promise<ApiResponse> => ok();
export const addEvent = async (..._args: any[]): Promise<ApiResponse> => ok();
export const deleteEvent = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uploadPhoto = async (..._args: any[]): Promise<ApiResponse> => ok();
export const deletePhoto = async (..._args: any[]): Promise<ApiResponse> => ok();
export const addNote = async (..._args: any[]): Promise<ApiResponse> => ok();
export const deleteNote = async (..._args: any[]): Promise<ApiResponse> => ok();
export const sendInvoice = async (..._args: any[]): Promise<ApiResponse> => ok();
export const restoreRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const reopenRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const reassignRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const transferRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const unassignRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uncancelRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uncloseRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const uncompleteRepair = async (..._args: any[]): Promise<ApiResponse> => ok();
export const printRepair = async (..._args: any[]): Promise<ApiResponse> => ok();

export const getRepairs = async ({ search = '', status = 'all', branch, page = 1, limit = 10, customerId }: { search?: string; status?: string; branch?: string; page?: number; limit?: number; customerId?: string }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (branch && branch !== 'all') params.append('branch', branch);
    if (customerId) params.append('customerId', customerId);
    params.append('page', String(page));
    params.append('limit', String(limit));
    const response = await api.get(`/api/repairs?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching repairs:', error);
    throw new Error('Failed to fetch repairs');
  }
};

export const getRepairById = async (id: string) => {
  try {
    const response = await api.get(`/api/repairs/${id}`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch repair details');
  }
};

export const updateRepairStatus = async (id: string, data: { status: string; notes?: string }) => {
  try {
    const response = await api.put(`/api/repairs/${id}/status`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const cancelRepair = async (id: string, reason: string) => {
  try {
    const response = await api.put(`/api/repairs/${id}/cancel`, { reason });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export const deleteRepair = async (id: string) => {
  try {
    const response = await api.delete(`/api/repairs/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
};

export interface Repair {
  _id: string;
  orderNumber: string;
  branch: {
    name: string;
  };
  customer?: {
    name: string;
    phone: string;
  };
  device?: {
    brand?: string;
    model?: string;
    brandId?: string;
    modelId?: string;
    deviceTypeId?: string;
    names?: { brand?: string };
  };
  status: string;
  payment?: {
    amount?: number;
    totalAmount?: number;
  };
  items?: Array<{ name: string; quantity: number }>;
  createdAt?: string;
  orderId?: string;
  branchSnapshot?: any;
  totalCentralPayment?: number;
  isCentralService?: boolean;
} 