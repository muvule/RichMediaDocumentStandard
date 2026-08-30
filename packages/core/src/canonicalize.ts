import YAML from 'yaml';
import { tokenizeRMD } from './lexer.js';

function sortKeysDeep(val: unknown): unknown {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(sortKeysDeep);
  }
  const obj = val as Record<string, unknown>;
  const sortedObj: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const k of keys) {
    if (obj[k] !== undefined && typeof obj[k] !== 'function' && typeof obj[k] !== 'symbol') {
      sortedObj[k] = sortKeysDeep(obj[k]);
    }
  }
  return sortedObj;
}

/**
 * Deterministically serialize a complete .rmd document per SPEC §6:
 * 1. Unicode Normalization: NFC
 * 2. Newline Normalization: LF
 * 3. Lexicographical YAML key sorting for frontmatter and all rmd:* blocks
 * 4. 2-space indentation
 * 5. Trailing whitespace stripping
 */
export function canonicalizeRMD(source: string): string {
  const normalized = source.normalize('NFC').replace(/\r\n/g, '\n');
  const tokens = tokenizeRMD(normalized);
  const parts: string[] = [];

  for (const token of tokens) {
    if (token.type === 'frontmatter') {
      try {
        const parsed = YAML.parse(token.content);
        const sorted = sortKeysDeep(parsed);
        const yamlStr = YAML.stringify(sorted, { indent: 2, lineWidth: 0 });
        parts.push(`---\n${yamlStr.trim()}\n---`);
      } catch {
        parts.push(`---\n${token.content.trim()}\n---`);
      }
    } else if (token.type === 'rmd_block') {
      try {
        const parsed = YAML.parse(token.payload);
        const sorted = sortKeysDeep(parsed);
        const yamlStr = YAML.stringify(sorted, { indent: 2, lineWidth: 0 });
        parts.push(`\`\`\`rmd:${token.blockType}\n${yamlStr.trim()}\n\`\`\``);
      } catch {
        parts.push(`\`\`\`rmd:${token.blockType}\n${token.payload.trim()}\n\`\`\``);
      }
    } else if (token.type === 'markdown') {
      const trimmed = token.content
        .split('\n')
        .map((l) => l.trimEnd())
        .join('\n')
        .trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
    }
  }

  return parts.join('\n\n') + '\n';
}

/**
 * Deterministically sort all keys of an object recursively (RFC 8785 JSON Canonicalization Scheme).
 * Omits keys with undefined, function, or symbol values.
 */
export function canonicalizeJSON(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => (item === undefined ? 'null' : canonicalizeJSON(item))).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const pairs: string[] = [];

  for (const key of sortedKeys) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
      pairs.push(JSON.stringify(key) + ':' + canonicalizeJSON(val));
    }
  }

  return '{' + pairs.join(',') + '}';
}

/**
 * Universal synchronous SHA-256 implementation (works identically in Node.js, Browsers, Edge, and Deno).
 * Accepts raw Uint8Array buffers without intermediate string conversion, as well as strings and objects.
 */
export function computeSha256(data: Uint8Array | string | object): string {
  const bytes =
    data instanceof Uint8Array
      ? data
      : new TextEncoder().encode(typeof data === 'string' ? data : canonicalizeJSON(data));
  
  // SHA-256 constants
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const bitLength = bytes.length * 8;
  const newLength = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(newLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(newLength - 4, bitLength, false);

  const w = new Uint32Array(64);

  const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));

  for (let i = 0; i < newLength; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + (j << 2), false);
    }
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(7, w[j - 15]) ^ rotr(18, w[j - 15]) ^ (w[j - 15] >>> 3);
      const s1 = rotr(17, w[j - 2]) ^ rotr(19, w[j - 2]) ^ (w[j - 2] >>> 10);
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;

    for (let j = 0; j < 64; j++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[j] + w[j]) | 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}
