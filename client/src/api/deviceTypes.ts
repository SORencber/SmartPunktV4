import { api } from './api';

export interface DeviceType {
  _id: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceTypeResponse {
  success: boolean;
  data: DeviceType[];
  message?: string;
}

export interface DeviceTypeSingleResponse {
  success: boolean;
  data: DeviceType;
  message?: string;
}

export interface CreateDeviceTypeRequest {
  name: string;
  icon: string;
  description?: string;
  isActive?: boolean;
  createdBy?: {
    id: string;
    email: string;
    fullName: string;
  };
}

export interface UpdateDeviceTypeRequest {
  name?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
}

// Get all device types
export const getDeviceTypes = async (): Promise<DeviceTypeResponse> => {
  const response = await api.get('/api/device-types');
  return response.data;
};

// Create device type
export const createDeviceType = async (data: CreateDeviceTypeRequest): Promise<DeviceTypeSingleResponse> => {
  const response = await api.post('/api/device-types', data);
  return response.data;
};

// Update device type
export const updateDeviceType = async (id: string, data: UpdateDeviceTypeRequest): Promise<DeviceTypeSingleResponse> => {
  const response = await api.put(`/api/device-types/${id}`, data);
  return response.data;
};

// Delete device type
export const deleteDeviceType = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/api/device-types/${id}`);
  return response.data;
}; 