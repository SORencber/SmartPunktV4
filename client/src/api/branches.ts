import { api } from './api';
import { handleApiError, createApiWrapper } from '@/utils/apiErrorHandler';
import { ApiResponse } from './types';

export interface BranchAddress {
  city?: string;
  street?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface Branch {
  _id: string;
  name: string;
  code?: string;
  address: BranchAddress;
  phone: string;
  email?: string;
  manager?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface GetBranchResponse extends ApiResponse<Branch> {}

// Description: Get current user's branch information
// Endpoint: GET /branches/current
// Request: {}
// Response: { branch: { _id: string, name: string, address: string, phone: string, email: string, manager: string, isActive: boolean } }
export const getCurrentBranch = async (): Promise<GetBranchResponse> => {
  try {
    const response = await api.get('/api/branches/current');
    console.log('🏢 getCurrentBranch API Response:', response.data);
    
    // Handle both data.data and data formats
    const branchData = response.data.data || response.data;
    console.log('🏢 getCurrentBranch parsed branchData:', branchData);
    
    return {
      success: true,
      data: branchData,
    };
  } catch (error: any) {
    console.error('Failed to fetch current branch:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Şube bilgileri alınamadı',
    };
  }
}

// Description: Get all branches
// Endpoint: GET /api/branches
// Request: {}
// Response: { branches: Array<{ _id: string, name: string, address: string, phone: string, email: string, manager: string, isActive: boolean }> }
export const getAllBranches = async (): Promise<ApiResponse<Branch[]>> => {
  try {
    const response = await api.get('/api/branches');
    console.log('🏢 getAllBranches API Response:', response.data);
    return {
      success: true,
      data: response.data.data || response.data, // Handle both formats
    };
  } catch (error: any) {
    console.error('Failed to fetch branches:', error);
    return {
      success: false,
      message: error?.response?.data?.message || 'Failed to load branches',
    };
  }
}

export const getBranch = async (branchId: string): Promise<GetBranchResponse> => {
  try {
    const response = await api.get(`/api/branches/${branchId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error fetching branch:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Şube bilgileri alınamadı',
    };
  }
};

// Export alias for backward compatibility  
export const getBranches = getAllBranches;
