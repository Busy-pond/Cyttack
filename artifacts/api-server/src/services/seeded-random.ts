/**
 * Deterministic seeded PRNG utilities.
 * Using a linear congruential generator seeded from the simulation ID string hash.
 * Given the same seed, all outputs are reproducible.
 */

/** Hash a string to a positive 32-bit integer. */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

/** Returns a function producing floats in [0, 1) deterministically from seed. */
export function makeSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function (): number {
    // LCG parameters from Numerical Recipes
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Convenience: create a random function seeded from a simulation ID string. */
export function rngFromSimId(simulationId: string): () => number {
  return makeSeededRandom(hashString(simulationId));
}

/** Pick a random element from an array using the provided rng. */
export function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]!;
}
