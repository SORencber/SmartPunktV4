export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user';
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  preferredLanguage: string;
}

export interface CreateCustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  branchId: string;
  createdBy: string;
}

export interface LoginResponse extends ApiResponse<{
  accessToken: string;
  refreshToken: string;
  user: User;
}> {}

export interface UserProfileResponse extends ApiResponse<User> {}

export interface GetCustomersResponse extends ApiResponse<Customer[]> {}
export interface CreateCustomerResponse extends ApiResponse<Customer> {}
export interface DeleteCustomerResponse extends ApiResponse<void> {}

export interface GetBranchResponse extends ApiResponse<Branch> {} 