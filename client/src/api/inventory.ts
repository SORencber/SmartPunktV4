import { api } from './api';

interface BranchPart {
  _id: string;
  name: {
    tr: string;
    de: string;
    en: string;
  };
  category: string;
  brandId: {
    _id: string;
    name: string;
  };
  deviceTypeId: {
    _id: string;
    name: string;
  };
  branch_stock: number;
  branch_minStockLevel: number;
  branch_cost: number;
  branch_price: number;
  branch_margin: number;
  branch_shelfNumber: string;
  isActive: boolean;
}

interface UpdateBranchPartRequest {
  branch_stock?: number;
  branch_minStockLevel?: number;
  branch_cost?: number;
  branch_price?: number;
  branch_margin?: number;
  branch_shelfNumber?: string;
}

// Description: Get branch-specific inventory items
// Endpoint: GET /api/branch-parts
// Request: { branchId: string }
// Response: { data: Array<BranchPart> }
export const getInventory = async (branchId: string) => {
  try {
    if (!branchId) {
      throw new Error("Şube ID'si gereklidir.");
    }

    console.log('🔍 Fetching inventory for branch:', branchId);

    // Şubeye özel parçaları getir
    const response = await api.get('/api/branch-parts', {
      params: { branchId }
    });

    if (!response.data.success) {
      console.error('Failed to fetch inventory:', response.data);
      throw new Error(response.data.message || 'Envanter yüklenirken bir hata oluştu');
    }

    console.log('✅ Inventory fetched successfully:', {
      totalParts: response.data.data?.length || 0,
      branchId
    });

    return response.data;
  } catch (err) {
    const error = err as any;
    console.error('❌ Error in getInventory:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
    }

    if (error.response?.status === 403) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    throw new Error(error?.response?.data?.message || error.message || 'Envanter yüklenirken bir hata oluştu');
  }
}

// Description: Update branch part stock
// Endpoint: PUT /api/branch-parts/:id
// Request: { branchId: string, branch_stock: number }
// Response: { data: BranchPart }
export const updateProductStock = async (id: string, data: { quantity: number; type: 'add' | 'remove' }) => {
  try {
    // First get the current user to get their branchId
    const userResponse = await api.get('/api/auth/me');
    const { branchId } = userResponse.data.user;

    if (!branchId) {
      console.error('No branchId found in user data:', userResponse.data);
      throw new Error('Şube bilgisi bulunamadı. Lütfen sistem yöneticinize başvurun.');
    }

    console.log('🔍 Updating stock for part:', {
      partId: id,
      branchId,
      adjustment: data
    });

    // Get current part data
    const currentPartResponse = await api.get('/api/branch-parts', {
      params: { branchId, partId: id }
    });

    if (!currentPartResponse.data.success || !currentPartResponse.data.data) {
      console.error('Failed to fetch current part data:', currentPartResponse.data);
      throw new Error('Parça bilgisi bulunamadı');
    }

    const currentPart = currentPartResponse.data.data;
    const newStock = data.type === 'add' 
      ? currentPart.branch_stock + data.quantity
      : Math.max(0, currentPart.branch_stock - data.quantity);

    console.log('📊 Stock update calculation:', {
      currentStock: currentPart.branch_stock,
      adjustment: data.quantity,
      type: data.type,
      newStock
    });

    // Update the part
    const response = await api.put(`/api/branch-parts/${currentPart._id}`, {
      branchId,
      branch_stock: newStock
    });

    if (!response.data.success) {
      console.error('Failed to update stock:', response.data);
      throw new Error(response.data.message || 'Stok güncellenirken bir hata oluştu');
    }

    console.log('✅ Stock updated successfully:', {
      partId: id,
      oldStock: currentPart.branch_stock,
      newStock,
      branchId
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error in updateProductStock:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 401) {
      throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
    }

    if (error.response?.status === 403) {
      throw new Error('Bu işlem için yetkiniz bulunmuyor.');
    }

    throw new Error(error?.response?.data?.message || error.message || 'Stok güncellenirken bir hata oluştu');
  }
}

// Description: Update branch part details
// Endpoint: PUT /api/branch-parts/:id
// Request: UpdateBranchPartRequest
// Response: { data: BranchPart }
export const updatePart = async (id: string, data: UpdateBranchPartRequest, branchId?: string) => {
  try {
    let realBranchId = branchId;
    if (!realBranchId) {
      const userResponse = await api.get('/api/auth/me');
      realBranchId = userResponse.data.user?.branchId;
    }
    if (!realBranchId) {
      throw new Error('Şube bilgisi bulunamadı. Lütfen sistem yöneticinize başvurun.');
    }
    // Update the part
    const response = await api.put(`/api/branch-parts/${id}`, {
      branchId: realBranchId,
      ...data
    });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Parça güncellenirken bir hata oluştu');
    }
    return response.data;
  } catch (error: any) {
    throw new Error(error?.response?.data?.message || error.message || 'Parça güncellenirken bir hata oluştu');
  }
};