const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;
let mongoServer;

/**
 * Helper to get auth token
 */
const loginAndGetToken = async (credentials) => {
  const res = await request(app).post('/api/auth/login').send(credentials);
  expect(res.statusCode).toBe(200);
  return res.body.data.accessToken;
};

describe('Customers API – end-to-end', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri();
    process.env.JWT_SECRET = 'testsecret';
    process.env.SESSION_SECRET = 'testsession';
    process.env.NODE_ENV = 'test';
    // Dinamik port gerekmez; supertest doğrudan app kullanacak
    app = require('../server');
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  it('full happy-path: admin → branch → staff → customer CRUD', async () => {
    // 1) Admin kaydı
    const adminReg = await request(app).post('/api/auth/register').send({
      username: 'admin1',
      email: 'admin1@example.com',
      password: 'Password123',
      fullName: 'Admin One',
      role: 'admin'
    });
    expect(adminReg.statusCode).toBe(201);

    const adminToken = await loginAndGetToken({
      email: 'admin1@example.com',
      password: 'Password123'
    });

    // 2) Branch oluştur
    const branchRes = await request(app)
      .post('/api/branches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Istanbul',
        phone: '02121231234',
        managerName: 'Manager A'
      });
    expect(branchRes.statusCode).toBe(201);
    const branchId = branchRes.body.data._id;

    // 3) Staff kaydı
    const staffReg = await request(app).post('/api/auth/register').send({
      username: 'staff1',
      email: 'staff1@example.com',
      password: 'Password123',
      fullName: 'Staff One',
      role: 'branch_staff',
      branch: branchId
    });
    expect(staffReg.statusCode).toBe(201);

    const staffToken = await loginAndGetToken({
      email: 'staff1@example.com',
      password: 'Password123'
    });

    // 4) Customer oluştur
    const custRes = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'John Doe',
        phone: '555-1234',
        email: 'john@example.com'
      });
    expect(custRes.statusCode).toBe(201);
    const customerId = custRes.body.data._id;

    // 5) Listele → müşteri var mı?
    const listRes = await request(app)
      .get('/api/customers')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0]._id).toBe(customerId);
  });
}); 