import { describe, it, expect } from 'vitest';
import { canonicalizeJSON, computeSha256 } from '../src/canonicalize.js';
import { inspectC2PAManifest } from '../src/c2pa.js';

describe('Canonicalization & C2PA Provenance', () => {
  it('should serialize JSON deterministically regardless of key order', () => {
    const objA = { b: 2, a: 1, nested: { y: 20, x: 10 } };
    const objB = { nested: { x: 10, y: 20 }, a: 1, b: 2 };

    const canonA = canonicalizeJSON(objA);
    const canonB = canonicalizeJSON(objB);

    expect(canonA).toBe(canonB);
    expect(computeSha256(objA)).toBe(computeSha256(objB));
  });

  it('should inspect C2PA provenance manifest', () => {
    const manifest = {
      title: 'Shoreline Drone Survey 4K',
      format: 'video/mp4',
      claim_generator: 'C2PA-Rust-Signer/1.4.0',
      assertions: [
        { label: 'c2pa.actions', data: { action: 'c2pa.created' } },
        { label: 'c2pa.hash.data', data: { pad: 0, url: 'self#jumbf=c2pa' } }
      ],
      signature_info: {
        issuer: 'USGS GeoTrust Root CA',
        time: '2026-08-17T09:30:00Z'
      }
    };

    const res = inspectC2PAManifest(manifest);
    expect(res.verified).toBe(true);
    expect(res.issuer).toBe('USGS GeoTrust Root CA');
    expect(res.assertionsCount).toBe(2);
    expect(res.claimGenerator).toBe('C2PA-Rust-Signer/1.4.0');
  });
});
