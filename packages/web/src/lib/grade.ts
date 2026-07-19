import type { LosGrade } from '@matchday/core';

/** Map an LOS grade to its color-pair class: turf (A–B), amber (C–D), signal (E–F). */
export function gradeClass(grade: LosGrade): 'g-ab' | 'g-cd' | 'g-ef' {
  if (grade === 'A' || grade === 'B') return 'g-ab';
  if (grade === 'C' || grade === 'D') return 'g-cd';
  return 'g-ef';
}
