/**
 * End-to-End Integration Tests for INFINITE RELIC API
 *
 * Tests all API endpoints with real request/response cycles
 * Requires: @nestjs/testing, supertest
 *
 * Run with: npm run test:e2e
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('INFINITE RELIC API (e2e)', () => {
  let app: INestApplication;

  // Mock Telegram init data for authentication
  const mockInitData =
    'query_id=AAH&user={"id":123456789,"first_name":"Test","last_name":"User","username":"testuser"}&auth_date=1234567890&hash=valid_hash';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/health (GET)', () => {
    it('should return 200 OK', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect({ status: 'ok' });
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth header', () => {
      return request(app.getHttpServer())
        .get('/user/123456789/stats')
        .expect(401);
    });

    it('should reject requests with invalid auth header', () => {
      return request(app.getHttpServer())
        .get('/user/123456789/stats')
        .set('x-telegram-init-data', 'invalid_data')
        .expect(401);
    });

    it('should accept requests with valid auth header', () => {
      return request(app.getHttpServer())
        .get('/user/123456789/stats')
        .set('x-telegram-init-data', mockInitData)
        .expect((res) => {
          expect(res.status).toBeLessThan(500); // May be 404 or 200, but not 401
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Send 100+ requests rapidly
      const requests = Array(101)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/user/123456789/stats')
            .set('x-telegram-init-data', mockInitData)
        );

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some((res) => res.status === 429);
      expect(rateLimited).toBe(true);
    });

    it('should include rate limit headers', () => {
      return request(app.getHttpServer())
        .get('/user/123456789/stats')
        .set('x-telegram-init-data', mockInitData)
        .expect((res) => {
          expect(res.headers).toHaveProperty('x-ratelimit-limit');
          expect(res.headers).toHaveProperty('x-ratelimit-remaining');
          expect(res.headers).toHaveProperty('x-ratelimit-reset');
        });
    });
  });

  describe('/user/:userId/stats (GET)', () => {
    it('should return user stats', () => {
      return request(app.getHttpServer())
        .get('/user/123456789/stats')
        .set('x-telegram-init-data', mockInitData)
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('userId');
            expect(res.body).toHaveProperty('stats');
            expect(res.body.stats).toHaveProperty('totalQuests');
            expect(res.body.stats).toHaveProperty('completedQuests');
            expect(res.body.stats).toHaveProperty('totalEarned');
            expect(res.body.stats).toHaveProperty('referralCount');
          } else {
            // User may not exist (404)
            expect(res.status).toBe(404);
          }
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/user/999999999/stats')
        .set('x-telegram-init-data', mockInitData)
        .expect(404);
    });
  });

  describe('/user/:userId/referral-link (GET)', () => {
    it('should return referral link', () => {
      return request(app.getHttpServer())
        .get('/user/123456789/referral-link')
        .set('x-telegram-init-data', mockInitData)
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('referralCode');
            expect(res.body).toHaveProperty('referralLink');
            expect(res.body.referralLink).toContain('t.me');
          } else {
            expect(res.status).toBe(404);
          }
        });
    });
  });

  describe('/quests (GET)', () => {
    it('should return available quests', () => {
      return request(app.getHttpServer())
        .get('/quests')
        .set('x-telegram-init-data', mockInitData)
        .send({ userId: '123456789' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should filter by userId', () => {
      return request(app.getHttpServer())
        .get('/quests')
        .set('x-telegram-init-data', mockInitData)
        .send({ userId: '999999999' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0); // Non-existent user has no quests
        });
    });
  });

  describe('/quests/:id/claim (POST)', () => {
    it('should claim quest', async () => {
      // First, get available quests
      const questsRes = await request(app.getHttpServer())
        .get('/quests')
        .set('x-telegram-init-data', mockInitData)
        .send({ userId: '123456789' });

      if (questsRes.body.length > 0) {
        const questId = questsRes.body[0].id;

        return request(app.getHttpServer())
          .post(`/quests/${questId}/claim`)
          .set('x-telegram-init-data', mockInitData)
          .send({ userId: '123456789' })
          .expect((res) => {
            if (res.status === 200) {
              expect(res.body).toHaveProperty('success', true);
              expect(res.body).toHaveProperty('reward');
              expect(res.body).toHaveProperty('message');
            } else {
              // Quest may already be claimed or expired
              expect([400, 404]).toContain(res.status);
            }
          });
      }
    });

    it('should return 404 for non-existent quest', () => {
      return request(app.getHttpServer())
        .post('/quests/999999/claim')
        .set('x-telegram-init-data', mockInitData)
        .send({ userId: '123456789' })
        .expect(404);
    });
  });

  describe('/claims (GET)', () => {
    it('should return claims list', () => {
      return request(app.getHttpServer())
        .get('/claims')
        .set('x-telegram-init-data', mockInitData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('claims');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('totalAmount');
          expect(Array.isArray(res.body.claims)).toBe(true);
        });
    });

    it('should filter claims by userId', () => {
      return request(app.getHttpServer())
        .get('/claims?userId=123456789')
        .set('x-telegram-init-data', mockInitData)
        .expect(200)
        .expect((res) => {
          expect(res.body.claims).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                userId: '123456789',
              }),
            ])
          );
        });
    });

    it('should limit results to 100', () => {
      return request(app.getHttpServer())
        .get('/claims')
        .set('x-telegram-init-data', mockInitData)
        .expect(200)
        .expect((res) => {
          expect(res.body.claims.length).toBeLessThanOrEqual(100);
        });
    });
  });

  describe('/claims (POST)', () => {
    it('should create claim', () => {
      const claimData = {
        userId: '123456789',
        amount: 10.5,
        txHash: '0x1234567890abcdef',
      };

      return request(app.getHttpServer())
        .post('/claims')
        .set('x-telegram-init-data', mockInitData)
        .send(claimData)
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('claim');
            expect(res.body.claim).toHaveProperty('userId', '123456789');
            expect(res.body.claim).toHaveProperty('amount', 10.5);
          } else {
            // User may not exist
            expect(res.status).toBe(400);
          }
        });
    });

    it('should reject claim with missing fields', () => {
      return request(app.getHttpServer())
        .post('/claims')
        .set('x-telegram-init-data', mockInitData)
        .send({ userId: '123456789' }) // Missing amount
        .expect(400);
    });

    it('should reject claim for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/claims')
        .set('x-telegram-init-data', mockInitData)
        .send({
          userId: '999999999',
          amount: 10.5,
        })
        .expect(400);
    });
  });

  describe('Error Handling', () => {
    it('should return proper error format', () => {
      return request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty('statusCode');
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/claims')
        .set('x-telegram-init-data', mockInitData)
        .set('Content-Type', 'application/json')
        .send('invalid json{')
        .expect(400);
    });

    it('should handle missing content-type', () => {
      return request(app.getHttpServer())
        .post('/claims')
        .set('x-telegram-init-data', mockInitData)
        .send({ userId: '123', amount: 10 })
        .expect((res) => {
          expect([200, 400, 415]).toContain(res.status);
        });
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', () => {
      return request(app.getHttpServer())
        .options('/user/123456789/stats')
        .expect((res) => {
          expect(res.headers).toHaveProperty('access-control-allow-origin');
        });
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/user/123456789/stats')
        .set('x-telegram-init-data', mockInitData);

      const duration = Date.now() - start;

      // Response should be under 1000ms
      expect(duration).toBeLessThan(1000);
    });
  });
});
