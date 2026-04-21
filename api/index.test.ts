import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

let app: any;

beforeAll(async () => {
  // Prevent `api/index.ts` from calling `app.listen(...)` during tests.
  process.env.NODE_ENV = 'production';
  process.env.API_GATEWAY_KEY =
    process.env.API_GATEWAY_KEY || 'test-gateway-key';

  const mod = await import('./index.ts');
  app = mod.default;
});

describe('auth api', () => {
  it('GET /api/status returns ok', async () => {
    const res = await request(app)
      .get('/api/status')
      .set('X-CRYPTO-STDEV-API-GATEWAY-KEY', process.env.API_GATEWAY_KEY);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
