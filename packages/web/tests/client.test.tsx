import { afterEach, describe, expect, test, vi } from 'vitest';

// The client reads VITE_API_URL at module load, so each case stubs the env
// and re-imports the module under test.
async function loadClient(apiUrl: string) {
  vi.resetModules();
  vi.stubEnv('VITE_API_URL', apiUrl);
  return import('../src/lib/client.js');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('client without an API configured', () => {
  test('askConcierge answers from the local engine, tagged heuristic', async () => {
    const client = await loadClient('');
    const answer = await client.askConcierge('where is the food');
    expect(answer.origin).toBe('heuristic');
    expect(answer.text).toMatch(/food hall/i);
  });

  test('loadFlow computes the board locally', async () => {
    const client = await loadClient('');
    const board = await client.loadFlow();
    expect(board.overall).toBe('F');
    expect(board.zones[0]?.name).toBe('Gate South');
  });

  test('loadRoute returns undefined when constraints cannot be met', async () => {
    const client = await loadClient('');
    const route = await client.loadRoute('p-gate-north', 'missing-point', false);
    expect(route).toBeUndefined();
  });
});

describe('client with a live API', () => {
  test('askConcierge returns the API answer with its origin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Gate East has no queue.', origin: 'gemini' }),
      }),
    );
    const client = await loadClient('http://api.test');
    const answer = await client.askConcierge('gate?');
    expect(answer).toEqual({ text: 'Gate East has no queue.', origin: 'gemini' });
  });

  test('askConcierge falls back locally when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const client = await loadClient('http://api.test');
    const answer = await client.askConcierge('where is the food');
    expect(answer.origin).toBe('heuristic');
  });

  test('loadFlow falls back locally on a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const client = await loadClient('http://api.test');
    const board = await client.loadFlow();
    expect(board.overall).toBe('F');
  });

  test('loadRoute maps the API response shape', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          route: { totalMeters: 150, stepFree: true },
          narration: ['Start at Gate East.'],
        }),
      }),
    );
    const client = await loadClient('http://api.test');
    const route = await client.loadRoute('a', 'b', true);
    expect(route).toEqual({
      narration: ['Start at Gate East.'],
      totalMeters: 150,
      stepFree: true,
    });
  });
});
