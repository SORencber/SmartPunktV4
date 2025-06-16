// Eksik tipler ve örnekler. Geliştikçe detaylandırılabilir.

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateDeviceTypeRequest {
  name: string;
  icon?: string;
}

export interface UpdateDeviceTypeRequest {
  name?: string;
  icon?: string;
}

export interface CreatePartRequest {
  name: string;
  barcode?: string;
  qrCode?: string;
  price?: number;
  stock?: number;
}

export interface UpdatePartRequest {
  name?: string;
  barcode?: string;
  qrCode?: string;
  price?: number;
  stock?: number;
}

export interface CreateModelRequest {
  name: string;
  brandId: string;
  deviceTypeId: string;
}

export interface UpdateModelRequest {
  name?: string;
  brandId?: string;
  deviceTypeId?: string;
}

export interface CreateBrandRequest {
  name: string;
  deviceTypeId: string;
  icon?: string;
  description?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  deviceTypeId?: string;
  icon?: string;
  description?: string;
}

// Diğer eksik tipler build hatalarına göre eklenebilir.

export type UpdateRepairRequest = any;
export type AddPartRequest = any;
export type RemovePartRequest = any;
export type AddEventRequest = any;
export type UpdateRepairStatusRequest = any;
export type ReassignRepairRequest = any;
export type TransferRepairRequest = any;
export type RepairStatus = any; 