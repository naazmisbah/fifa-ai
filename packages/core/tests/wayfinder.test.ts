import { describe, expect, test } from 'vitest';
import { findRoute, narrateRoute } from '../src/wayfinder.js';
import { STADIUM_GRAPH } from '../src/stadium.js';
import type { LosGrade, WalkGraph } from '../src/types.js';

describe('findRoute on the stadium graph', () => {
  test('finds the shortest path from Gate East to the East Food Hall', () => {
    const route = findRoute(STADIUM_GRAPH, 'p-gate-east', 'p-food-east');
    expect(route?.legs.map((l) => l.id)).toEqual(['p-gate-east', 'p-conc-east', 'p-food-east']);
    expect(route?.totalMeters).toBe(150);
  });

  test('unconstrained routing to Stand B takes the shorter stairs', () => {
    const route = findRoute(STADIUM_GRAPH, 'p-conc-east', 'p-stand-b');
    expect(route?.totalMeters).toBe(40);
    expect(route?.stepFree).toBe(false);
  });

  test('step-free routing to Stand B goes via the East Lift', () => {
    const route = findRoute(STADIUM_GRAPH, 'p-conc-east', 'p-stand-b', { stepFreeOnly: true });
    expect(route?.legs.map((l) => l.id)).toEqual(['p-conc-east', 'p-lift-east', 'p-stand-b']);
    expect(route?.stepFree).toBe(true);
  });

  test('congestion steers routing around a jammed concourse', () => {
    const calm = findRoute(STADIUM_GRAPH, 'p-gate-north', 'p-info-2');
    expect(calm?.legs.map((l) => l.id)).toEqual(['p-gate-north', 'p-conc-east', 'p-info-2']);

    const congestion = new Map<string, LosGrade>([['conc-east', 'F']]);
    const rerouted = findRoute(STADIUM_GRAPH, 'p-gate-north', 'p-info-2', { congestion });
    expect(rerouted?.legs.map((l) => l.id)).toEqual(['p-gate-north', 'p-info-2']);
  });

  test('returns a zero-length route when origin equals destination', () => {
    const route = findRoute(STADIUM_GRAPH, 'p-info-2', 'p-info-2');
    expect(route?.totalMeters).toBe(0);
    expect(route?.legs).toHaveLength(1);
  });

  test('returns undefined for unknown points', () => {
    expect(findRoute(STADIUM_GRAPH, 'p-gate-north', 'nowhere')).toBeUndefined();
    expect(findRoute(STADIUM_GRAPH, 'nowhere', 'p-gate-north')).toBeUndefined();
  });
});

describe('findRoute edge cases', () => {
  const island: WalkGraph = {
    points: [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C (island)' },
    ],
    edges: [{ from: 'a', to: 'b', meters: 10, stepFree: false }],
  };

  test('returns undefined when the destination is unreachable', () => {
    expect(findRoute(island, 'a', 'c')).toBeUndefined();
  });

  test('returns undefined when only stairs connect the points and step-free is required', () => {
    expect(findRoute(island, 'a', 'b', { stepFreeOnly: true })).toBeUndefined();
  });

  test('throws when an edge references an unknown point', () => {
    const broken: WalkGraph = {
      points: [{ id: 'a', name: 'A' }],
      edges: [{ from: 'a', to: 'ghost', meters: 5, stepFree: true }],
    };
    expect(() => findRoute(broken, 'a', 'a')).not.toThrow();
    expect(() => findRoute(broken, 'a', 'ghost')).not.toThrow();
    const twoPoints: WalkGraph = {
      points: [
        { id: 'a', name: 'A' },
        { id: 'b', name: 'B' },
      ],
      edges: [{ from: 'a', to: 'ghost', meters: 5, stepFree: true }],
    };
    expect(() => findRoute(twoPoints, 'a', 'b')).toThrow(/unknown point/);
  });
});

describe('narrateRoute', () => {
  test('narrates a multi-leg route with a total', () => {
    const route = findRoute(STADIUM_GRAPH, 'p-gate-east', 'p-food-east');
    expect(route).toBeDefined();
    const steps = narrateRoute(route!);
    expect(steps[0]).toBe('Start at Gate East.');
    expect(steps.at(-1)).toContain('150 m');
  });

  test('handles the degenerate single-point route', () => {
    const route = findRoute(STADIUM_GRAPH, 'p-info-2', 'p-info-2');
    expect(narrateRoute(route!)).toEqual(['You are already at Information Point 2.']);
  });
});
