/**
 * Minimal Gemini REST client. The API key stays on the server and travels in
 * the `x-goog-api-key` request header — never in a URL, never to the browser.
 */

const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_BRIEF =
  'You are the stadium concierge for a FIFA World Cup 2026 venue. ' +
  'Answer in the language of the question, in at most three short sentences, ' +
  'about stadium services: gates, seating, food, restrooms, transit, accessibility, and first aid.';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Asks Gemini one concierge question and returns plain text. */
export interface GeminiClient {
  ask(query: string, locale?: string): Promise<string>;
}

/**
 * Build a Gemini client bound to an API key. `fetchImpl` is injectable so
 * tests exercise the client without network access.
 */
export function createGeminiClient(apiKey: string, fetchImpl: typeof fetch = fetch): GeminiClient {
  return {
    async ask(query, locale) {
      const hint = locale ? ` The fan's interface locale is ${locale}.` : '';
      const response = await fetchImpl(GEMINI_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${SYSTEM_BRIEF}${hint}\n\nFan: ${query}` }] }],
        }),
      });
      if (!response.ok) {
        throw new Error(`Gemini responded with HTTP ${response.status}`);
      }
      const payload = (await response.json()) as GeminiResponse;
      const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        throw new Error('Gemini returned no text');
      }
      return text;
    },
  };
}
