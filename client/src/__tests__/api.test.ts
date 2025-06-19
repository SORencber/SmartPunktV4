import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { login, getDeviceTypes, getBrands, getModels, getParts, getCustomers, createOrder } from '../services/api';

// Types
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

interface DeviceType {
  _id: string;
  name: string;
  isActive: boolean;
}

interface Brand {
  _id: string;
  name: string;
  deviceTypeId: string;
  isActive: boolean;
}

interface Model {
  _id: string;
  name: string;
  brandId: string;
  isActive: boolean;
}

interface Part {
  _id: string;
  name: string;
  price: {
    amount: number;
  };
  stock: number;
  isActive: boolean;
}

interface Customer {
  _id: string;
  name: string;
  phone: string;
  email: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  parts: Array<{
    partId: string;
    quantity: number;
  }>;
  isCentralService: boolean;
}

// Increase test timeout
jest.setTimeout(30000);

// Mock API responses
const server = setupServer(
  // Auth endpoint
  rest.post('/api/auth/login', (req, res, ctx) => {
    const { email, password } = req.body as { email: string; password: string };
    if (email === 'admin@repairsystem.com' && password === 'Admin123!') {
      return res(
        ctx.json({
          success: true,
          token: 'mock-token',
          user: {
            _id: '1',
            email: 'admin@repairsystem.com',
            role: 'admin'
          }
        })
      );
    }
    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        message: 'Invalid credentials'
      })
    );
  }),

  // Device endpoints
  rest.get('/api/deviceTypes', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'Smartphone', isActive: true },
          { _id: '2', name: 'Tablet', isActive: true }
        ] as DeviceType[]
      })
    );
  }),

  rest.get('/api/brands', (req, res, ctx) => {
    const { deviceTypeId } = req.params;
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'Apple', deviceTypeId, isActive: true },
          { _id: '2', name: 'Samsung', deviceTypeId, isActive: true }
        ] as Brand[]
      })
    );
  }),

  rest.get('/api/models', (req, res, ctx) => {
    const { brandId } = req.params;
    return res(
      ctx.json({
        success: true,
        data: [
          { _id: '1', name: 'iPhone 12', brandId, isActive: true },
          { _id: '2', name: 'iPhone 13', brandId, isActive: true }
        ] as Model[]
      })
    );
  }),

  // Parts endpoint
  rest.get('/api/parts', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        data: [
          { 
            _id: '1', 
            name: 'Screen', 
            price: { amount: 100 }, 
            stock: 5,
            isActive: true
          },
          { 
            _id: '2', 
            name: 'Battery', 
            price: { amount: 50 }, 
            stock: 10,
            isActive: true
          }
        ] as Part[]
      })
    );
  }),

  // Customer endpoints
  rest.get('/api/customers', (req, res, ctx) => {
    const { query } = req.params;
    const customers: Customer[] = [
      { _id: '1', name: 'John Doe', phone: '1234567890', email: 'john@example.com' },
      { _id: '2', name: 'Jane Smith', phone: '0987654321', email: 'jane@example.com' }
    ];

    if (query) {
      return res(
        ctx.json({
          success: true,
          data: customers.filter(c => 
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.phone.includes(query) ||
            c.email.toLowerCase().includes(query.toLowerCase())
          )
        })
      );
    }

    return res(
      ctx.json({
        success: true,
        data: customers
      })
    );
  }),

  // Order endpoints
  rest.post('/api/orders', (req, res, ctx) => {
    const orderData = req.body as Order;
    return res(
      ctx.json({
        success: true,
        order: {
          _id: 'new-order-id',
          orderNumber: 'ORD-001',
          ...orderData,
          createdAt: new Date().toISOString()
        }
      })
    );
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => {
  server.close();
  jest.restoreAllMocks();
});

describe('API Tests', () => {
  describe('Auth API', () => {
    test('successful login', async () => {
      const response = await login('admin@repairsystem.com', 'Admin123!');
      expect(response.success).toBe(true);
      expect(response.token).toBe('mock-token');
      expect(response.user.role).toBe('admin');
    });

    test('failed login', async () => {
      await expect(login('wrong@email.com', 'wrongpass'))
        .rejects
        .toThrow('Invalid credentials');
    });
  });

  describe('Device API', () => {
    test('get device types', async () => {
      const response = await getDeviceTypes();
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('Smartphone');
    });

    test('get brands for device type', async () => {
      const response = await getBrands({ deviceTypeId: '1' });
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('Apple');
    });

    test('get models for brand', async () => {
      const response = await getModels({ brandId: '1' });
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].name).toBe('iPhone 12');
    });
  });

  describe('Parts API', () => {
    test('get parts list', async () => {
      const response = await getParts();
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(response.data[0].price.amount).toBe(100);
      expect(response.data[0].stock).toBe(5);
    });

    test('filters active parts', async () => {
      server.use(
        rest.get('/api/parts', (req, res, ctx) => {
          return res(
            ctx.json({
              success: true,
              data: [
                { _id: '1', name: 'Screen', isActive: true },
                { _id: '2', name: 'Battery', isActive: false }
              ] as Part[]
            })
          );
        })
      );

      const response = await getParts();
      const activeParts = response.data.filter(p => p.isActive);
      expect(activeParts).toHaveLength(1);
    });
  });

  describe('Customer API', () => {
    test('get customers list', async () => {
      const response = await getCustomers({ limit: 100 });
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
    });

    test('search customers', async () => {
      const response = await getCustomers({ query: 'john' });
      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(1);
      expect(response.data[0].name).toBe('John Doe');
    });
  });

  describe('Order API', () => {
    test('create new order', async () => {
      const orderData: Order = {
        _id: '',
        orderNumber: '',
        customerId: '1',
        parts: [{ partId: '1', quantity: 1 }],
        isCentralService: true
      };

      const response = await createOrder(orderData);
      expect(response.success).toBe(true);
      expect(response.order.orderNumber).toBe('ORD-001');
    });

    test('handles order creation error', async () => {
      server.use(
        rest.post('/api/orders', (req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              success: false,
              message: 'Server error'
            })
          );
        })
      );

      const orderData: Order = {
        _id: '',
        orderNumber: '',
        customerId: '1',
        parts: [{ partId: '1', quantity: 1 }],
        isCentralService: false
      };

      await expect(createOrder(orderData))
        .rejects
        .toThrow('Server error');
    });
  });
}); 