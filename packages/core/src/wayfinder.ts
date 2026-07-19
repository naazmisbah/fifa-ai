import type { LosGrade, Route, WalkEdge, WalkGraph, WayPoint } from './types.js';

/**
 * Congestion multipliers applied to edge cost when the destination point sits
 * in a zone with the given LOS grade. A jammed zone (F) makes a path three
 * times as "long", so routing naturally flows around trouble without ever
 * forbidding a path outright.
 */
const CONGESTION_FACTOR: Readonly<Record<LosGrade, number>> = {
  A: 1,
  B: 1,
  C: 1.15,
  D: 1.4,
  E: 2,
  F: 3,
};

/** Options for a route computation. */
export interface RouteOptions {
  /** Only traverse step-free edges (ramps, lifts, level floors). */
  stepFreeOnly?: boolean;
  /** Current LOS grade per zone id, used to steer around congestion. */
  congestion?: ReadonlyMap<string, LosGrade>;
}

interface Neighbour {
  point: WayPoint;
  edge: WalkEdge;
}

function buildAdjacency(graph: WalkGraph, stepFreeOnly: boolean): Map<string, Neighbour[]> {
  const byId = new Map(graph.points.map((p) => [p.id, p]));
  const adjacency = new Map<string, Neighbour[]>(graph.points.map((p) => [p.id, []]));
  for (const edge of graph.edges) {
    if (stepFreeOnly && !edge.stepFree) continue;
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    if (!from || !to) {
      throw new Error(`edge ${edge.from}–${edge.to} references an unknown point`);
    }
    adjacency.get(from.id)?.push({ point: to, edge });
    adjacency.get(to.id)?.push({ point: from, edge });
  }
  return adjacency;
}

function edgeCost(edge: WalkEdge, into: WayPoint, congestion?: ReadonlyMap<string, LosGrade>): number {
  const grade = into.zoneId ? congestion?.get(into.zoneId) : undefined;
  return edge.meters * (grade ? CONGESTION_FACTOR[grade] : 1);
}

/**
 * Find the lowest-cost walking route between two points using Dijkstra's
 * algorithm over the undirected stadium graph. Cost is distance in metres,
 * inflated through congested zones (see {@link CONGESTION_FACTOR}).
 *
 * Returns `undefined` when no route satisfies the constraints — e.g. a
 * step-free request where only stairs connect the two points.
 */
export function findRoute(
  graph: WalkGraph,
  fromId: string,
  toId: string,
  options: RouteOptions = {},
): Route | undefined {
  const byId = new Map(graph.points.map((p) => [p.id, p]));
  const origin = byId.get(fromId);
  const destination = byId.get(toId);
  if (!origin || !destination) return undefined;
  if (fromId === toId) return { legs: [origin], totalMeters: 0, stepFree: true };

  const adjacency = buildAdjacency(graph, options.stepFreeOnly ?? false);
  const cost = new Map<string, number>([[fromId, 0]]);
  const previous = new Map<string, { point: WayPoint; edge: WalkEdge }>();
  const settled = new Set<string>();

  // The graph is small (dozens of points), so a linear scan for the cheapest
  // unsettled point is simpler than a heap and still effectively instant.
  while (settled.size < graph.points.length) {
    let current: string | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const [id, c] of cost) {
      if (!settled.has(id) && c < best) {
        best = c;
        current = id;
      }
    }
    if (current === undefined) break;
    if (current === toId) break;
    settled.add(current);

    for (const { point, edge } of adjacency.get(current) ?? []) {
      const next = best + edgeCost(edge, point, options.congestion);
      if (next < (cost.get(point.id) ?? Number.POSITIVE_INFINITY)) {
        cost.set(point.id, next);
        previous.set(point.id, { point: byId.get(current) as WayPoint, edge });
      }
    }
  }

  if (!cost.has(toId)) return undefined;

  const legs: WayPoint[] = [destination];
  const edges: WalkEdge[] = [];
  for (let step = previous.get(toId); step; step = previous.get(step.point.id)) {
    legs.unshift(step.point);
    edges.push(step.edge);
  }
  return {
    legs,
    totalMeters: edges.reduce((sum, e) => sum + e.meters, 0),
    stepFree: edges.every((e) => e.stepFree),
  };
}

/** Human-readable turn-by-turn narration of a route. */
export function narrateRoute(route: Route): string[] {
  if (route.legs.length === 1) {
    return [`You are already at ${(route.legs[0] as WayPoint).name}.`];
  }
  const steps = route.legs.map((leg, index) =>
    index === 0 ? `Start at ${leg.name}.` : `Continue to ${leg.name}.`,
  );
  steps.push(`Arrive — about ${Math.round(route.totalMeters)} m in total.`);
  return steps;
}
