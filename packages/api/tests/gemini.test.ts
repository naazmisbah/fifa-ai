import { describe, expect, test, vi } from 'vitest';
import { createGeminiClient } from '../src/gemini.js';

function fakeFetch(payload: unknown, ok = true, status = 200): typeof fetch {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  }) as unknown as typeof fetch;
}

const answer = (text: string) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

describe('createGeminiClient', () => {
  test('sends the key in a header, never in the URL', async () => {
    const fetchImpl = fakeFetch(answer('Gate North is step-free.'));
    const client = createGeminiClient('secret-key', fetchImpl);

    await client.ask('Which gate is step-free?');

    const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).not.toContain('secret-key');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('secret-key');
  });

  test('returns the trimmed completion text', async () => {
    const client = createGeminiClient('k', fakeFetch(answer('  Follow the ramp.  ')));
    await expect(client.ask('ramp?')).resolves.toBe('Follow the ramp.');
  });

  test('includes the locale hint in the prompt when given', async () => {
    const fetchImpl = fakeFetch(answer('ok'));
    const client = createGeminiClient('k', fetchImpl);
    await client.ask('hola', 'es-MX');
    const [, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain('es-MX');
  });

  test('throws on a non-OK response', async () => {
    const client = createGeminiClient('k', fakeFetch({}, false, 503));
    await expect(client.ask('hi')).rejects.toThrow(/503/);
  });

  test('throws when the response has no text', async () => {
    const client = createGeminiClient('k', fakeFetch({ candidates: [] }));
    await expect(client.ask('hi')).rejects.toThrow(/no text/);
  });
});
