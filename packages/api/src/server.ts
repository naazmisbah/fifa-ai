import process from 'node:process';
import { buildApp } from './app.js';
import { createGeminiClient } from './gemini.js';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;

const app = buildApp({
  gemini: apiKey ? createGeminiClient(apiKey) : undefined,
  corsOrigin: process.env.CORS_ORIGIN,
  logger: true,
});

app.log.info(apiKey ? 'Gemini enabled' : 'No GEMINI_API_KEY set — heuristic answers only');

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
