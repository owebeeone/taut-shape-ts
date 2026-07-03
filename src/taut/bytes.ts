// Byte helpers — distilled from glade/client-ts bytes.ts. Small, dependency-free
// utilities used by tests, the oracle loader, and the CLI framing.

/** Structural equality of two byte arrays. */
export function bytesEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Lowercase hex of a byte array. */
export function hex(b: Uint8Array): string {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return s;
}

/** Parse a lowercase/uppercase hex string into bytes. */
export function unhex(s: string): Uint8Array {
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/** UTF-8 encode. */
export function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/** UTF-8 decode. */
export function fromUtf8(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}
