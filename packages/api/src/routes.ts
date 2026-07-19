import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import {
  assessVenue,
  DEMO_READINGS,
  findRoute,
  heuristicAnswer,
  narrateRoute,
  STADIUM_GRAPH,
  STADIUM_ZONES,
  type LosGrade,
} from '@matchday/core';
import { LruTtlCache } from './cache.js';
import type { GeminiClient } from './gemini.js';

const ConciergeBody = Type.Object({
  query: Type.String({ minLength: 1, maxLength: 500 }),
  locale: Type.Optional(Type.String({ maxLength: 10 })),
});

const WayfinderBody = Type.Object({
  from: Type.String({ minLength: 1, maxLength: 40 }),
  to: Type.String({ minLength: 1, maxLength: 40 }),
  stepFree: Type.Optional(Type.Boolean()),
});

const ANSWER_CACHE_TTL_MS = 5 * 60 * 1000;
const ANSWER_CACHE_ENTRIES = 400;

/**
 * The demo telemetry is a fixed snapshot, so the venue assessment and the
 * congestion map are computed once. With a live feed these would refresh per
 * reading interval.
 */
const VENUE = assessVenue([...STADIUM_ZONES], [...DEMO_READINGS]);
const CONGESTION = new Map<string, LosGrade>(VENUE.zones.map((z) => [z.zone.id, z.grade]));

export interface RouteDeps {
  gemini?: GeminiClient;
}

/** All /v1 routes. Gemini is injected so tests run with a stub client. */
export const apiRoutes =
  ({ gemini }: RouteDeps): FastifyPluginAsyncTypebox =>
  async (app) => {
    const answers = new LruTtlCache<string>(ANSWER_CACHE_TTL_MS, ANSWER_CACHE_ENTRIES);

    app.post('/concierge', { schema: { body: ConciergeBody } }, async (request) => {
      const { query, locale } = request.body;
      if (gemini) {
        const cacheKey = `${locale ?? ''}|${query.trim().toLowerCase()}`;
        const cached = answers.get(cacheKey);
        if (cached) return { text: cached, origin: 'gemini' as const };
        try {
          const text = await gemini.ask(query, locale);
          answers.set(cacheKey, text);
          return { text, origin: 'gemini' as const };
        } catch (error) {
          request.log.warn({ err: error }, 'gemini unavailable, answering heuristically');
        }
      }
      return { text: heuristicAnswer(query).text, origin: 'heuristic' as const };
    });

    app.get('/flow', async () => ({
      overall: VENUE.overall,
      actions: VENUE.actions,
      zones: VENUE.zones.map((z) => ({
        id: z.zone.id,
        name: z.zone.name,
        kind: z.zone.kind,
        occupants: z.occupants,
        density: Number(z.density.toFixed(2)),
        grade: z.grade,
        advisory: z.advisory,
      })),
    }));

    app.post('/wayfinder', { schema: { body: WayfinderBody } }, async (request, reply) => {
      const { from, to, stepFree } = request.body;
      const route = findRoute(STADIUM_GRAPH, from, to, {
        stepFreeOnly: stepFree ?? false,
        congestion: CONGESTION,
      });
      if (!route) {
        return reply.code(404).send({ error: 'No route satisfies those constraints.' });
      }
      return { route, narration: narrateRoute(route) };
    });

    app.get('/points', async () => ({
      points: STADIUM_GRAPH.points.map((p) => ({ id: p.id, name: p.name })),
    }));
  };
