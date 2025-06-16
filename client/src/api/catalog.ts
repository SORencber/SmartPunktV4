import { api } from './api';

// Description: Get all catalog products
// Endpoint: GET /api/catalog
// Request: {}
// Response: { products: Array<{ _id: string, name: string, type: string, brand: string, model: string, purchasePrice: number, sellingPrice: number, stockQuantity: number, createdAt: string, updatedAt: string }> }
export const getCatalogProducts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        products: [
          {
            _id: "64a7b8c9d5e4f123456789c1",
            name: "iPhone 15 Pro Screen Assembly",
            type: "phone",
            brand: "apple",
            model: "iPhone 15 Pro",
            purchasePrice: 240.00,
            sellingPrice: 399.99,
            stockQuantity: 15,
            createdAt: "2024-01-01T10:00:00Z",
            updatedAt: "2024-01-15T14:30:00Z"
          },
          {
            _id: "64a7b8c9d5e4f123456789c2",
            name: "Samsung Galaxy S24 Battery",
            type: "phone",
            brand: "samsung",
            model: "Galaxy S24",
            purchasePrice: 42.00,
            sellingPrice: 79.99,
            stockQuantity: 25,
            createdAt: "2024-01-02T11:00:00Z",
            updatedAt: "2024-01-14T16:20:00Z"
          },
          {
            _id: "64a7b8c9d5e4f123456789c3",
            name: "MacBook Pro 14 Keyboard",
            type: "computer",
            brand: "apple",
            model: "MacBook Pro 14",
            purchasePrice: 120.00,
            sellingPrice: 199.99,
            stockQuantity: 8,
            createdAt: "2024-01-03T09:15:00Z",
            updatedAt: "2024-01-13T12:45:00Z"
          }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/catalog');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}

// Description: Add a new product to catalog
// Endpoint: POST /api/catalog
// Request: { name: string, type: string, brand: string, model: string, purchasePrice: number, sellingPrice: number, stockQuantity: number }
// Response: { product: { _id: string, name: string, type: string, brand: string, model: string, purchasePrice: number, sellingPrice: number, stockQuantity: number, createdAt: string, updatedAt: string }, message: string }
export const addCatalogProduct = (data: { name: string; type: string; brand: string; model: string; purchasePrice: number; sellingPrice: number; stockQuantity: number }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date().toISOString();
      resolve({
        product: {
          _id: `64a7b8c9d5e4f${Math.random().toString(36).substr(2, 12)}`,
          name: data.name,
          type: data.type,
          brand: data.brand,
          model: data.model,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          stockQuantity: data.stockQuantity,
          createdAt: now,
          updatedAt: now
        },
        message: "Product added to catalog successfully"
      });
    }, 500);
  });
  // try {
  //   return await api.post('/api/catalog', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}

// Description: Update catalog product
// Endpoint: PUT /api/catalog/:id
// Request: { name?: string, type?: string, brand?: string, model?: string, purchasePrice?: number, sellingPrice?: number, stockQuantity?: number }
// Response: { product: { _id: string, name: string, type: string, brand: string, model: string, purchasePrice: number, sellingPrice: number, stockQuantity: number, updatedAt: string }, message: string }
export const updateCatalogProduct = (id: string, data: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        product: {
          _id: id,
          ...data,
          updatedAt: new Date().toISOString()
        },
        message: "Product updated successfully"
      });
    }, 500);
  });
  // try {
  //   return await api.put(`/api/catalog/${id}`, data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}

// Description: Delete catalog product
// Endpoint: DELETE /api/catalog/:id
// Request: {}
// Response: { message: string }
export const deleteCatalogProduct = (id: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: "Product deleted successfully"
      });
    }, 500);
  });
  // try {
  //   return await api.delete(`/api/catalog/${id}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
}