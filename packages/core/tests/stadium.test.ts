import { describe, expect, test } from 'vitest';
import { DEMO_READINGS, STADIUM_GRAPH, STADIUM_ZONES } from '../src/stadium.js';
import { findRoute } from '../src/wayfinder.js';

/**
 * Invariant tests over the venue data: the model must stay internally
 * consistent as it evolves, so broken references fail the build rather than
 * surfacing as runtime oddities.
 */
describe('stadium data integrity', () => {
  const zoneIds = new Set(STADIUM_ZONES.map((z) => z.id));
  const pointIds = new Set(STADIUM_GRAPH.points.map((p) => p.id));

  test('every reading references a real zone', () => {
    for (const reading of DEMO_READINGS) {
      expect(zoneIds.has(reading.zoneId), reading.zoneId).toBe(true);
    }
  });

  test('every graph point with a zone references a real zone', () => {
    for (const point of STADIUM_GRAPH.points) {
      if (point.zoneId !== undefined) {
        expect(zoneIds.has(point.zoneId), point.id).toBe(true);
      }
    }
  });

  test('every edge references real points', () => {
    for (const edge of STADIUM_GRAPH.edges) {
      expect(pointIds.has(edge.from), edge.from).toBe(true);
      expect(pointIds.has(edge.to), edge.to).toBe(true);
    }
  });

  test('every zone has positive area and a unique id', () => {
    expect(zoneIds.size).toBe(STADIUM_ZONES.length);
    for (const zone of STADIUM_ZONES) {
      expect(zone.areaM2).toBeGreaterThan(0);
    }
  });

  test('a step-free route exists from every gate to every stand', () => {
    const gates = STADIUM_GRAPH.points.filter((p) => p.id.startsWith('p-gate'));
    const stands = STADIUM_GRAPH.points.filter((p) => p.id.startsWith('p-stand'));
    for (const gate of gates) {
      for (const stand of stands) {
        const route = findRoute(STADIUM_GRAPH, gate.id, stand.id, { stepFreeOnly: true });
        expect(route, `${gate.id} → ${stand.id}`).toBeDefined();
      }
    }
  });
});
