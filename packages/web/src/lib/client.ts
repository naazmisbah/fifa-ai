/**
 * Data access for the web console.
 *
 * When `VITE_API_URL` is set the console talks to the Matchday API (which may
 * answer with live Gemini). When it is unset — the static demo deployment —
 * every function computes the same answer locally from `@matchday/core`.
 * The domain logic exists exactly once, in core; this module only chooses
 * where it runs.
 */
import {
  assessVenue,
  DEMO_READINGS,
  findRoute,
  heuristicAnswer,
  narrateRoute,
  STADIUM_GRAPH,
  STADIUM_ZONES,
  type AnswerOrigin,
  type LosGrade,
} from '@matchday/core';

export interface FlowZone {
  id: string;
  name: string;
  kind: string;
  occupants: number;
  density: number;
  grade: LosGrade;
  advisory: string;
}

export interface FlowBoard {
  overall: LosGrade;
  actions: string[];
  zones: FlowZone[];
}

export interface RouteResult {
  narration: string[];
  totalMeters: number;
  stepFree: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Static list of walkable points for the wayfinder form (always local). */
export const WAY_POINTS = STADIUM_GRAPH.points.map((p) => ({ id: p.id, name: p.name }));

function localFlow(): FlowBoard {
  const venue = assessVenue([...STADIUM_ZONES], [...DEMO_READINGS]);
  return {
    overall: venue.overall,
    actions: venue.actions,
    zones: venue.zones.map((z) => ({
      id: z.zone.id,
      name: z.zone.name,
      kind: z.zone.kind,
      occupants: z.occupants,
      density: Number(z.density.toFixed(2)),
      grade: z.grade,
      advisory: z.advisory,
    })),
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API responded with ${response.status}`);
  return (await response.json()) as T;
}

/** Ask the concierge; prefers the live API, falls back to the local engine. */
export async function askConcierge(
  query: string,
  locale?: string,
): Promise<{ text: string; origin: AnswerOrigin }> {
  if (API_URL) {
    try {
      return await post<{ text: string; origin: AnswerOrigin }>('/v1/concierge', { query, locale });
    } catch {
      // fall through to the local engine
    }
  }
  return { text: heuristicAnswer(query).text, origin: 'heuristic' };
}

/** Load the crowd flow board; prefers the live API, falls back locally. */
export async function loadFlow(): Promise<FlowBoard> {
  if (API_URL) {
    try {
      const response = await fetch(`${API_URL}/v1/flow`);
      if (response.ok) return (await response.json()) as FlowBoard;
    } catch {
      // fall through to the local engine
    }
  }
  return localFlow();
}

/** Compute a congestion-aware route; returns undefined when none exists. */
export async function loadRoute(
  from: string,
  to: string,
  stepFree: boolean,
): Promise<RouteResult | undefined> {
  if (API_URL) {
    try {
      const body = await post<{ route: { totalMeters: number; stepFree: boolean }; narration: string[] }>(
        '/v1/wayfinder',
        { from, to, stepFree },
      );
      return { narration: body.narration, totalMeters: body.route.totalMeters, stepFree: body.route.stepFree };
    } catch {
      // fall through to the local engine
    }
  }
  const congestion = new Map(localFlow().zones.map((z) => [z.id, z.grade]));
  const route = findRoute(STADIUM_GRAPH, from, to, { stepFreeOnly: stepFree, congestion });
  if (!route) return undefined;
  return { narration: narrateRoute(route), totalMeters: route.totalMeters, stepFree: route.stepFree };
}
