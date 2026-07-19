import type {
  LosGrade,
  VenueAssessment,
  Zone,
  ZoneAssessment,
  ZoneReading,
} from './types.js';

/**
 * Fruin walkway Level of Service bands, expressed as the upper density bound
 * (persons per square metre) for each grade.
 *
 * Sources:
 * - J. J. Fruin, "Pedestrian Planning and Design" (1971), walkway LOS table —
 *   https://en.wikipedia.org/wiki/Pedestrian_level_of_service
 * - SGSA, "Guide to Safety at Sports Grounds" (the Green Guide, 6th ed.),
 *   which caps concourse packing density for safety —
 *   https://sgsa.org.uk/greenguide/
 */
const LOS_BANDS: readonly { grade: LosGrade; maxDensity: number }[] = [
  { grade: 'A', maxDensity: 0.31 },
  { grade: 'B', maxDensity: 0.43 },
  { grade: 'C', maxDensity: 0.72 },
  { grade: 'D', maxDensity: 1.08 },
  { grade: 'E', maxDensity: 2.17 },
  { grade: 'F', maxDensity: Number.POSITIVE_INFINITY },
];

const GRADE_ADVISORIES: Readonly<Record<LosGrade, string>> = {
  A: 'Free flow. No action needed.',
  B: 'Light traffic. No action needed.',
  C: 'Steady flow. Monitor at next interval.',
  D: 'Restricted flow. Prepare stewards for active guidance.',
  E: 'Crowded. Slow inbound flow and open relief paths.',
  F: 'Critical congestion. Hold inbound flow and redirect immediately.',
};

/** Grades at or above which a zone needs operator intervention. */
const INTERVENTION_GRADES: ReadonlySet<LosGrade> = new Set(['E', 'F']);

/** Map a pedestrian density (persons/m²) to its Fruin walkway LOS grade. */
export function gradeDensity(density: number): LosGrade {
  if (!Number.isFinite(density) || density < 0) {
    throw new RangeError(`density must be a non-negative number, got ${density}`);
  }
  const band = LOS_BANDS.find((b) => density < b.maxDensity) ?? LOS_BANDS[LOS_BANDS.length - 1];
  return (band as { grade: LosGrade }).grade;
}

/** Assess a single zone from an occupancy reading. */
export function assessZone(zone: Zone, occupants: number): ZoneAssessment {
  if (!Number.isInteger(occupants) || occupants < 0) {
    throw new RangeError(`occupants must be a non-negative integer, got ${occupants}`);
  }
  const density = occupants / zone.areaM2;
  const grade = gradeDensity(density);
  return { zone, occupants, density, grade, advisory: GRADE_ADVISORIES[grade] };
}

const GRADE_ORDER: readonly LosGrade[] = ['A', 'B', 'C', 'D', 'E', 'F'];

/** True when `a` is a worse (more congested) grade than `b`. */
export function isWorseGrade(a: LosGrade, b: LosGrade): boolean {
  return GRADE_ORDER.indexOf(a) > GRADE_ORDER.indexOf(b);
}

/**
 * Assess the whole venue in one pass. The overall grade is the worst zone
 * grade, and each zone needing intervention yields one concrete action that
 * names the best relief zone of the same kind, when one exists.
 */
export function assessVenue(zones: Zone[], readings: ZoneReading[]): VenueAssessment {
  if (zones.length === 0) {
    throw new RangeError('assessVenue requires at least one zone');
  }
  const readingByZone = new Map(readings.map((r) => [r.zoneId, r.occupants]));
  const assessments = zones.map((zone) => assessZone(zone, readingByZone.get(zone.id) ?? 0));
  assessments.sort((a, b) => b.density - a.density);

  const worst = assessments[0] as ZoneAssessment;
  const actions = assessments
    .filter((a) => INTERVENTION_GRADES.has(a.grade))
    .map((congested) => {
      const relief = assessments
        .filter((a) => a.zone.kind === congested.zone.kind && !isWorseGrade(a.grade, 'C'))
        .at(-1);
      return relief
        ? `Redirect fans from ${congested.zone.name} (LOS ${congested.grade}) to ${relief.zone.name} (LOS ${relief.grade}).`
        : `Hold inbound flow at ${congested.zone.name} (LOS ${congested.grade}); no relief ${congested.zone.kind} is clear.`;
    });

  return { overall: worst.grade, zones: assessments, actions };
}
