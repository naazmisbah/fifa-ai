import { describe, expect, test } from 'vitest';
import { classifyIntent, heuristicAnswer } from '../src/concierge.js';

describe('classifyIntent', () => {
  test.each([
    ['Where is the nearest restroom?', 'restrooms'],
    ['¿Dónde está el baño?', 'restrooms'],
    ['I am hungry, where can we eat?', 'dining'],
    ['Wo ist der Eingang?', 'gates'],
    ['How do I find my seat in block 214?', 'seating'],
    ['Is there a shuttle bus after the match?', 'transit'],
    ['Is there a wheelchair ramp to the stands?', 'accessibility'],
    ['My friend needs first aid', 'medical'],
  ] as const)('classifies %j as %s', (query, expected) => {
    expect(classifyIntent(query)).toBe(expected);
  });

  test('returns undefined when nothing matches', () => {
    expect(classifyIntent('what is the meaning of life')).toBeUndefined();
  });

  test('more keyword hits outrank a single hit', () => {
    // "help" alone is medical, but seat + block + row outvote it.
    expect(classifyIntent('help me find my seat, block 3, row 7')).toBe('seating');
  });
});

describe('heuristicAnswer', () => {
  test('answers a matched intent with curated guidance', () => {
    const answer = heuristicAnswer('where can I park my car');
    expect(answer.intent).toBe('transit');
    expect(answer.text).toMatch(/Lot A/);
  });

  test('gives a graceful fallback for unmatched queries', () => {
    const answer = heuristicAnswer('tell me a story');
    expect(answer.intent).toBe('unknown');
    expect(answer.text).toMatch(/Information Point/);
  });
});
