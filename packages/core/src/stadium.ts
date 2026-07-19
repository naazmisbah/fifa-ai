import type { WalkGraph, Zone, ZoneReading } from './types.js';

/**
 * Reference venue model for the demo deployment. Areas are usable pedestrian
 * space in m² (stands modelled by their vomitory/aisle space, not seats).
 * In production these would stream from the venue management system.
 */
export const STADIUM_ZONES: readonly Zone[] = [
  { id: 'gate-north', name: 'Gate North', kind: 'gate', areaM2: 800 },
  { id: 'gate-east', name: 'Gate East', kind: 'gate', areaM2: 700 },
  { id: 'gate-south', name: 'Gate South', kind: 'gate', areaM2: 600 },
  { id: 'conc-east', name: 'East Concourse', kind: 'concourse', areaM2: 2400 },
  { id: 'conc-west', name: 'West Concourse', kind: 'concourse', areaM2: 2200 },
  { id: 'food-east', name: 'East Food Hall', kind: 'amenity', areaM2: 900 },
  { id: 'food-west', name: 'West Food Hall', kind: 'amenity', areaM2: 850 },
  { id: 'stand-a', name: 'Stand A', kind: 'stand', areaM2: 5000 },
  { id: 'stand-b', name: 'Stand B', kind: 'stand', areaM2: 5000 },
];

/**
 * A pre-kick-off occupancy snapshot used by the static demo and the tests.
 * Chosen to exercise every LOS band: quiet stands, one jammed gate.
 */
export const DEMO_READINGS: readonly ZoneReading[] = [
  { zoneId: 'gate-north', occupants: 1500 },
  { zoneId: 'gate-east', occupants: 250 },
  { zoneId: 'gate-south', occupants: 1400 },
  { zoneId: 'conc-east', occupants: 900 },
  { zoneId: 'conc-west', occupants: 1600 },
  { zoneId: 'food-east', occupants: 400 },
  { zoneId: 'food-west', occupants: 950 },
  { zoneId: 'stand-a', occupants: 2000 },
  { zoneId: 'stand-b', occupants: 4500 },
];

/**
 * Walkable network of the venue. Edges marked `stepFree: false` involve
 * stairs; every destination also has a ramp or lift alternative so a fully
 * step-free route always exists.
 */
export const STADIUM_GRAPH: WalkGraph = {
  points: [
    { id: 'p-gate-north', name: 'Gate North', zoneId: 'gate-north' },
    { id: 'p-gate-east', name: 'Gate East', zoneId: 'gate-east' },
    { id: 'p-gate-south', name: 'Gate South', zoneId: 'gate-south' },
    { id: 'p-conc-east', name: 'East Concourse', zoneId: 'conc-east' },
    { id: 'p-conc-west', name: 'West Concourse', zoneId: 'conc-west' },
    { id: 'p-food-east', name: 'East Food Hall', zoneId: 'food-east' },
    { id: 'p-food-west', name: 'West Food Hall', zoneId: 'food-west' },
    { id: 'p-info-2', name: 'Information Point 2' },
    { id: 'p-lift-east', name: 'East Lift', zoneId: 'conc-east' },
    { id: 'p-ramp-west', name: 'West Ramp', zoneId: 'conc-west' },
    { id: 'p-stand-a', name: 'Stand A', zoneId: 'stand-a' },
    { id: 'p-stand-b', name: 'Stand B', zoneId: 'stand-b' },
  ],
  edges: [
    { from: 'p-gate-north', to: 'p-conc-west', meters: 120, stepFree: true },
    { from: 'p-gate-north', to: 'p-conc-east', meters: 140, stepFree: true },
    { from: 'p-gate-east', to: 'p-conc-east', meters: 90, stepFree: true },
    { from: 'p-gate-south', to: 'p-conc-west', meters: 110, stepFree: false },
    { from: 'p-gate-south', to: 'p-conc-east', meters: 150, stepFree: true },
    { from: 'p-conc-east', to: 'p-conc-west', meters: 200, stepFree: true },
    { from: 'p-conc-east', to: 'p-food-east', meters: 60, stepFree: true },
    { from: 'p-conc-west', to: 'p-food-west', meters: 55, stepFree: true },
    { from: 'p-conc-east', to: 'p-info-2', meters: 25, stepFree: true },
    { from: 'p-gate-north', to: 'p-info-2', meters: 180, stepFree: true },
    { from: 'p-conc-east', to: 'p-stand-b', meters: 40, stepFree: false },
    { from: 'p-conc-east', to: 'p-lift-east', meters: 30, stepFree: true },
    { from: 'p-lift-east', to: 'p-stand-b', meters: 25, stepFree: true },
    { from: 'p-conc-west', to: 'p-stand-a', meters: 75, stepFree: false },
    { from: 'p-conc-west', to: 'p-ramp-west', meters: 40, stepFree: true },
    { from: 'p-ramp-west', to: 'p-stand-a', meters: 45, stepFree: true },
  ],
};
