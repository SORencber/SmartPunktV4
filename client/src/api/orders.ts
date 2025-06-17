import { api } from './api';
import { createApiWrapper } from '@/utils/apiErrorHandler';

// Description: Get all orders with MongoDB-style data
// Endpoint: GET /api/orders
// Request: {}
// Response: { orders: Array<Order> }
export const getOrders = async ({ search = '', status = 'all', branch, page = 1, limit = 10, customerId }: { search?: string; status?: string; branch?: string; page?: number; limit?: number; customerId?: string }) => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);
    if (branch && branch !== 'all') params.append('branch', branch);
    if (customerId) params.append('customerId', customerId);
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await api.get(`/api/orders?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders');
  }
}

// Description: Create a new order
// Endpoint: POST /api/orders
// Request: { customerId: string, device: object, serviceType: string, description: string, products: Array<{ productId: string, quantity: number, price: number }>, labor?: object, estimatedCompletion?: string, priority?: string, payment: object }
// Response: { order: { _id: string, orderNumber: string, barcode: string }, message: string }
export const createOrder = async (data: any) => {
  try {
    const response = await api.post('/api/orders', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Get order by ID
// Endpoint: GET /api/orders/:id
// Request: {}
// Response: { order: Order }
export const getOrderById = async (id: string) => {
  try {
    const response = await api.get(`/api/orders/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Update order status
// Endpoint: PUT /api/orders/:id/status
// Request: { status: string, notes?: string }
// Response: { message: string, order: { _id: string, status: string, updatedAt: string } }
export const updateOrderStatus = async (id: string, data: { status: string; notes?: string }) => {
  try {
    const response = await api.put(`/api/orders/${id}/status`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Cancel an order
// Endpoint: PUT /api/orders/:id/cancel
// Request: { reason: string }
// Response: { message: string, order: { _id: string, status: string, updatedAt: string } }
export const cancelOrder = async (id: string, reason: string) => {
  try {
    const response = await api.put(`/api/orders/${id}/cancel`, { reason });
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Generate receipt for an order
// Endpoint: POST /api/orders/:id/receipt
// Request: {}
// Response: { url: string, message: string }
export const generateReceipt = async (id: string) => {
  try {
    const response = await api.post(`/api/orders/${id}/receipt`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Generate barcode for an order
// Endpoint: POST /api/orders/:id/barcode
// Request: {}
// Response: { barcode: string, message: string }
export const generateBarcode = async (id: string) => {
  try {
    const response = await api.post(`/api/orders/${id}/barcode`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Send update to customer
// Endpoint: POST /api/orders/:id/notify
// Request: { message: string, notificationType: 'sms' | 'email' | 'both' }
// Response: { message: string }
export const sendCustomerUpdate = async (id: string, data: { message: string, notificationType: 'sms' | 'email' | 'both' }) => {
  try {
    const response = await api.post(`/api/orders/${id}/notify`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}

// Description: Delete an order
// Endpoint: DELETE /api/orders/:id
// Response: { message: string }
export const deleteOrder = async (id: string) => {
  try {
    const response = await api.delete(`/api/orders/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message);
  }
}