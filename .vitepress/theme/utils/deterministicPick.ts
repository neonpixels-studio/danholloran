// FNV-1a 32-bit hash over the seed's UTF-16 code units: tiny, dependency-free,
// and stable across separate JS runs, so a given seed hashes identically on the
// server and the client. That stability is what lets the Instagram tiles agree
// on an image with no post-hydration swap.
const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function hashString(seed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  // Coerce the signed Math.imul result to an unsigned 32-bit integer.
  return hash >>> 0;
}

export function pickDeterministicIndex(seed: string, length: number): number {
  if (!Number.isInteger(length) || length <= 0) {
    throw new RangeError(
      "pickDeterministicIndex requires a positive integer length",
    );
  }
  return hashString(seed) % length;
}

// A non-positive length is internal misuse, so pickDeterministicIndex throws;
// a missing seed comes from external content (loosely-typed frontmatter), so we
// degrade to the first image rather than take down the whole page's SSR. An
// empty string is treated as absent for the same reason (it can't seed a pick).
export function pickDeterministicImage(
  seed: string | undefined,
  images: string[] | undefined,
): string | undefined {
  if (!images?.length) {
    return undefined;
  }
  if (!seed) {
    return images[0];
  }
  return images[pickDeterministicIndex(seed, images.length)];
}
