import { describe, expect, test } from 'vitest';
import { assessVenue, assessZone, gradeDensity, isWorseGrade } from '../src/crowd.js';
import { DEMO_READINGS, STADIUM_ZONES } from '../src/stadium.js';
import type { Zone } from '../src/types.js';

const concourse: Zone = { id: 'z1', name: 'Test Concourse', kind: 'concourse', areaM2: 1000 };

describe('gradeDensity', () => {
  test.each([
    [0, 'A'],
    [0.3, 'A'],
    [0.31, 'B'],
    [0.5, 'C'],
    [0.72, 'D'],
    [1.5, 'E'],
    [2.17, 'F'],
    [5, 'F'],
  ] as const)('density %d persons/m² grades as LOS %s', (density, expected) => {
    expect(gradeDensity(density)).toBe(expected);
  });

  test('rejects negative and non-finite densities', () => {
    expect(() => gradeDensity(-0.1)).toThrow(RangeError);
    expect(() => gradeDensity(Number.NaN)).toThrow(RangeError);
  });
});

describe('assessZone', () => {
  test('computes density from occupants and area', () => {
    const result = assessZone(concourse, 500);
    expect(result.density).toBeCloseTo(0.5);
    expect(result.grade).toBe('C');
    expect(result.advisory).toMatch(/steady flow/i);
  });

  test('rejects fractional or negative occupancy', () => {
    expect(() => assessZone(concourse, 1.5)).toThrow(RangeError);
    expect(() => assessZone(concourse, -1)).toThrow(RangeError);
  });
});

describe('isWorseGrade', () => {
  test('orders grades from A (best) to F (worst)', () => {
    expect(isWorseGrade('F', 'E')).toBe(true);
    expect(isWorseGrade('A', 'B')).toBe(false);
    expect(isWorseGrade('C', 'C')).toBe(false);
  });
});

describe('assessVenue', () => {
  test('overall grade is the worst zone grade, zones sorted worst-first', () => {
    const venue = assessVenue([...STADIUM_ZONES], [...DEMO_READINGS]);
    expect(venue.overall).toBe('F');
    const densities = venue.zones.map((z) => z.density);
    expect(densities).toEqual(densities.toSorted((a, b) => b - a));
  });

  test('congested zones get a redirect action naming a clear relief zone of the same kind', () => {
    const venue = assessVenue([...STADIUM_ZONES], [...DEMO_READINGS]);
    const gateAction = venue.actions.find((a) => a.includes('Gate South'));
    expect(gateAction).toBeDefined();
    expect(gateAction).toContain('Gate East');
  });

  test('falls back to holding flow when no relief zone of that kind is clear', () => {
    const gates: Zone[] = [
      { id: 'g1', name: 'Only Gate', kind: 'gate', areaM2: 100 },
    ];
    const venue = assessVenue(gates, [{ zoneId: 'g1', occupants: 400 }]);
    expect(venue.actions[0]).toMatch(/hold inbound flow/i);
  });

  test('zones without a reading count as empty', () => {
    const venue = assessVenue([concourse], []);
    expect(venue.zones[0]?.grade).toBe('A');
    expect(venue.actions).toHaveLength(0);
  });

  test('rejects an empty zone list', () => {
    expect(() => assessVenue([], [])).toThrow(RangeError);
  });
});
