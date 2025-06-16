import { api } from './api';
import { handleApiError } from '@/utils/apiErrorHandler';

// Description: Get dashboard statistics
// Endpoint: GET /api/dashboard/stats
// Request: {}
// Response: { stats: { totalOrders: number, totalRevenue: number, activeCustomers: number, pendingOrders: number, completedToday: number, lowStockItems: number } }
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    throw new Error('Failed to load dashboard statistics');
  }
}

// Description: Get recent orders for dashboard
// Endpoint: GET /api/dashboard/recent-orders
// Request: {}
// Response: { orders: Array<Order> }
export const getRecentOrders = async () => {
  try {
    const response = await api.get('/api/dashboard/recent-orders');
    return response.data;
  } catch (error) {
    throw new Error('Failed to load recent orders');
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