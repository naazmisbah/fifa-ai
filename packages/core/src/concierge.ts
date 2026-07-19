/**
 * Offline concierge: classifies a fan's question into a service intent by
 * scoring multilingual keyword hits, then answers from a curated reply table.
 * This is the deterministic fallback used whenever Gemini is unavailable, so
 * the assistant always answers — in any deployment, with no API key.
 */

/** A recognised fan-service topic. */
export type IntentId =
  | 'restrooms'
  | 'dining'
  | 'gates'
  | 'seating'
  | 'transit'
  | 'accessibility'
  | 'medical';

interface IntentSpec {
  id: IntentId;
  /** Lower-cased keywords across common World Cup fan languages. */
  keywords: readonly string[];
  reply: string;
}

const INTENTS: readonly IntentSpec[] = [
  {
    id: 'restrooms',
    keywords: ['restroom', 'toilet', 'washroom', 'bathroom', 'baño', 'banheiro', 'toilette', 'sanitario'],
    reply: 'Accessible restrooms are beside every concourse junction; the closest cluster to the gates is next to Information Point 2.',
  },
  {
    id: 'dining',
    keywords: ['food', 'eat', 'dining', 'drink', 'water', 'hungry', 'comida', 'essen', 'manger', 'restaurant'],
    reply: 'Food halls run along both concourses. The East Hall is usually the quieter choice, and every counter has a lowered section.',
  },
  {
    id: 'gates',
    keywords: ['gate', 'entrance', 'entry', 'exit', 'puerta', 'entrada', 'eingang', 'porte', 'saida'],
    reply: 'Gates open two hours before kick-off. Gate North and Gate East are step-free; your ticket QR works at any gate.',
  },
  {
    id: 'seating',
    keywords: ['seat', 'section', 'row', 'block', 'asiento', 'sitzplatz', 'siège', 'assento', 'tribune'],
    reply: 'Seat finder: follow your block number on the overhead signs, or use the Wayfinder tab for a step-free path to your stand.',
  },
  {
    id: 'transit',
    keywords: ['parking', 'park', 'car', 'taxi', 'metro', 'train', 'bus', 'shuttle', 'estacionamiento', 'bahn'],
    reply: 'Shuttles leave from Gate North every ten minutes; accessible parking is in Lot A with a level path to the concourse.',
  },
  {
    id: 'accessibility',
    keywords: ['wheelchair', 'accessible', 'ramp', 'lift', 'elevator', 'silla de ruedas', 'rollstuhl', 'step-free'],
    reply: 'Every route in the Wayfinder can be filtered to step-free. Mobility assistance staff wait at Information Point 2.',
  },
  {
    id: 'medical',
    keywords: ['medical', 'first aid', 'doctor', 'nurse', 'injury', 'help', 'médico', 'arzt', 'emergencia'],
    reply: 'First-aid rooms sit on both concourses and are marked with a white cross; any steward can call a medic to you.',
  },
];

const MIN_SCORE = 1;

/** Score every intent against a query; the best match wins ties by list order. */
export function classifyIntent(query: string): IntentId | undefined {
  const text = query.toLowerCase();
  let bestId: IntentId | undefined;
  let bestScore = MIN_SCORE - 1;
  for (const intent of INTENTS) {
    const score = intent.keywords.reduce((hits, kw) => (text.includes(kw) ? hits + 1 : hits), 0);
    if (score > bestScore) {
      bestScore = score;
      bestId = intent.id;
    }
  }
  return bestScore >= MIN_SCORE ? bestId : undefined;
}

/** Deterministic answer for a fan query; always returns something helpful. */
export function heuristicAnswer(query: string): { text: string; intent: IntentId | 'unknown' } {
  const intentId = classifyIntent(query);
  if (!intentId) {
    return {
      text: 'I could not match that to a stadium service. A steward at any Information Point can help in your language.',
      intent: 'unknown',
    };
  }
  const spec = INTENTS.find((i) => i.id === intentId) as IntentSpec;
  return { text: spec.reply, intent: intentId };
}
