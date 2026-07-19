import { describe, expect, test, vi } from 'vitest';
import { buildApp } from '../src/app.js';
import type { GeminiClient } from '../src/gemini.js';

const stubGemini = (impl: GeminiClient['ask']): GeminiClient => ({ ask: vi.fn(impl) });

describe('GET /healthz', () => {
  test('reports ok', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});

describe('POST /v1/concierge', () => {
  test('answers heuristically when no Gemini client is configured', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/concierge',
      payload: { query: 'where can we eat?' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ origin: 'heuristic' });
    expect(res.json().text).toMatch(/food hall/i);
  });

  test('answers via Gemini when configured, tagging the origin', async () => {
    const gemini = stubGemini(async () => 'The East Hall has shorter queues.');
    const app = buildApp({ gemini });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/concierge',
      payload: { query: 'where can we eat?', locale: 'en' },
    });
    expect(res.json()).toEqual({ text: 'The East Hall has shorter queues.', origin: 'gemini' });
  });

  test('serves identical questions from the cache (one upstream call)', async () => {
    const gemini = stubGemini(async () => 'Cached reply.');
    const app = buildApp({ gemini });
    const payload = { query: 'Is Gate North open?' };
    await app.inject({ method: 'POST', url: '/v1/concierge', payload });
    await app.inject({ method: 'POST', url: '/v1/concierge', payload });
    expect(gemini.ask).toHaveBeenCalledTimes(1);
  });

  test('falls back to the heuristic when Gemini fails', async () => {
    const gemini = stubGemini(async () => {
      throw new Error('quota exceeded');
    });
    const app = buildApp({ gemini });
    const res = await app.inject({
      method: 'POST',
      url: '/v1/concierge',
      payload: { query: 'wo ist der eingang?' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ origin: 'heuristic' });
  });

  test('rejects an empty query with 400', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/v1/concierge', payload: { query: '' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /v1/flow', () => {
  test('returns the venue picture, worst zones first, with operator actions', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/v1/flow' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.overall).toBe('F');
    expect(body.zones[0].grade).toBe('F');
    expect(body.actions.length).toBeGreaterThan(0);
    expect(body.zones[0]).toHaveProperty('advisory');
  });
});

describe('POST /v1/wayfinder', () => {
  test('returns a narrated route between two points', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/wayfinder',
      payload: { from: 'p-gate-east', to: 'p-food-east' },
    });
    const body = res.json();
    expect(res.statusCode).toBe(200);
    expect(body.route.totalMeters).toBe(150);
    expect(body.narration[0]).toBe('Start at Gate East.');
  });

  test('honours the step-free constraint', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/wayfinder',
      payload: { from: 'p-conc-east', to: 'p-stand-b', stepFree: true },
    });
    expect(res.json().route.stepFree).toBe(true);
  });

  test('returns 404 when no route exists', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/wayfinder',
      payload: { from: 'p-gate-east', to: 'nowhere' },
    });
    expect(res.statusCode).toBe(404);
  });

  test('rejects a malformed body with 400', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'POST', url: '/v1/wayfinder', payload: { from: 'x' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /v1/points', () => {
  test('lists the walkable points for the wayfinder UI', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/v1/points' });
    const { points } = res.json();
    expect(points.length).toBeGreaterThan(5);
    expect(points[0]).toHaveProperty('id');
    expect(points[0]).toHaveProperty('name');
  });
});

describe('hardening', () => {
  test('sets security headers on every response', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/healthz' });
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  test('rate limits abusive clients with 429', async () => {
    const app = buildApp();
    let lastStatus = 200;
    for (let i = 0; i < 35; i += 1) {
      const res = await app.inject({ method: 'GET', url: '/v1/flow' });
      lastStatus = res.statusCode;
    }
    expect(lastStatus).toBe(429);
  });
});
