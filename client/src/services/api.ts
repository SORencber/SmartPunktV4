// Re-export all API functions for backward compatibility
export { 
  getCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '@/api/customers';

export { getAllBranches as getBranches } from '@/api/branches';

export { api } from '@/api/api'; 