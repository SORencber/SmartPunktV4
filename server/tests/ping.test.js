const request = require('supertest');
const app = require('../server');

describe('Health check – /ping', () => {
  it('should return 200 and pong', async () => {
    const res = await request(app).get('/ping');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('pong');
  });
}); 