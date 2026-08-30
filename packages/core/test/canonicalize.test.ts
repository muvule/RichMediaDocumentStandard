import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import { canonicalizeJSON, canonicalizeRMD, computeSha256 } from '../src/canonicalize.js';
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

  it('should omit undefined keys according to RFC 8785 JSON Canonicalization Scheme', () => {
    const obj = { z: undefined, b: 2, a: 1, nested: { x: 10, un: undefined } };
    const canon = canonicalizeJSON(obj);
    expect(canon).toBe('{"a":1,"b":2,"nested":{"x":10}}');
    expect(() => JSON.parse(canon)).not.toThrow();
  });

  it('should correctly hash raw Uint8Array binary buffers directly', () => {
    const rawBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03]);
    const expectedSha256 = crypto.createHash('sha256').update(rawBytes).digest('hex');
    const computed = computeSha256(rawBytes);

    expect(computed).toBe(expectedSha256);
  });

  it('should inspect C2PA provenance manifest and verify valid signatures', () => {
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

  it('should fail verification if signature_info is missing from C2PA manifest', () => {
    const unsignedManifest = {
      title: 'Unsigned Media Asset',
      claim_generator: 'Unknown'
    };

    const res = inspectC2PAManifest(unsignedManifest);
    expect(res.verified).toBe(false);
    expect(res.warnings.some((w) => w.includes('signature_info'))).toBe(true);
  });

  it('should perform complete SPEC §6 canonical serialization on RMD documents (NFC, LF, sorted keys)', () => {
    const inputRmd = `---\r\ntitle: "Sample Title"\r\nrmd: 0.1\r\nid: doc:sample\r\n---\r\n\r\n# Inspection Header\r\n\r\n\`\`\`rmd:media\r\nwidth: 1200\r\nsrc: ./test.jpg\r\nmime: image/jpeg\r\nkind: image\r\nid: media-01\r\nheight: 800\r\n\`\`\`\r\n`;

    const canonical = canonicalizeRMD(inputRmd);
    expect(canonical).not.toContain('\r');
    expect(canonical).toContain('id: doc:sample');
    expect(canonical).toContain('rmd: 0.1');
    // Check sorted keys in media block (height before id, id before kind, kind before mime, etc.)
    const mediaBlockMatch = canonical.match(/```rmd:media\n([\s\S]*?)\n```/);
    expect(mediaBlockMatch).not.toBeNull();
    const blockContent = mediaBlockMatch![1];
    const lines = blockContent.split('\n').map((l: string) => l.split(':')[0].trim());
    expect(lines).toEqual(['height', 'id', 'kind', 'mime', 'src', 'width']);
  });
});

