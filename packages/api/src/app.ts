import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { apiRoutes, type RouteDeps } from './routes.js';

export interface AppOptions extends RouteDeps {
  /** Allowed browser origin; defaults to the local Vite dev server. */
  corsOrigin?: string;
  /** Enable pino request logging (off in tests). */
  logger?: boolean;
}

const BODY_LIMIT_BYTES = 32 * 1024;
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = '1 minute';

/** Build the Fastify app without listening, so tests drive it via inject(). */
export function buildApp(options: AppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: BODY_LIMIT_BYTES,
  });

  app.register(helmet);
  app.register(cors, { origin: options.corsOrigin ?? 'http://localhost:5173' });
  app.register(rateLimit, { max: RATE_LIMIT_MAX, timeWindow: RATE_LIMIT_WINDOW });

  app.register(apiRoutes({ gemini: options.gemini }), { prefix: '/v1' });

  app.get('/healthz', async () => ({ status: 'ok' }));

  return app;
}
