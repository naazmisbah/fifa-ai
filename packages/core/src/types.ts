/** Fruin walkway Level of Service grade, from free flow (A) to jammed (F). */
export type LosGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/** Physical area of the venue that fans occupy or pass through. */
export interface Zone {
  id: string;
  name: string;
  kind: 'gate' | 'concourse' | 'stand' | 'amenity';
  /** Usable pedestrian area in square metres. */
  areaM2: number;
}

/** A single occupancy sample for one zone. */
export interface ZoneReading {
  zoneId: string;
  occupants: number;
}

/** Crowd assessment for one zone at one point in time. */
export interface ZoneAssessment {
  zone: Zone;
  occupants: number;
  /** Pedestrian density in persons per square metre. */
  density: number;
  grade: LosGrade;
  advisory: string;
}

/** Venue-wide crowd picture: worst grade governs the overall state. */
export interface VenueAssessment {
  overall: LosGrade;
  /** Zone assessments sorted worst-first. */
  zones: ZoneAssessment[];
  /** Operator guidance derived from the worst zones. */
  actions: string[];
}

/** A walkable place in the stadium graph. */
export interface WayPoint {
  id: string;
  name: string;
  /** Crowd zone this point sits in, if any — used for congestion-aware routing. */
  zoneId?: string;
}

/** An undirected walkable connection between two points. */
export interface WalkEdge {
  from: string;
  to: string;
  meters: number;
  /** True when the connection has no stairs (ramp, lift, or level floor). */
  stepFree: boolean;
}

/** Stadium walking network. */
export interface WalkGraph {
  points: WayPoint[];
  edges: WalkEdge[];
}

/** A computed route through the walking network. */
export interface Route {
  /** Ordered points from origin to destination, inclusive. */
  legs: WayPoint[];
  totalMeters: number;
  stepFree: boolean;
}

/** Where a concierge answer came from. */
export type AnswerOrigin = 'gemini' | 'heuristic';

/** A concierge reply, tagged with its origin for transparency. */
export interface ConciergeAnswer {
  text: string;
  origin: AnswerOrigin;
}
