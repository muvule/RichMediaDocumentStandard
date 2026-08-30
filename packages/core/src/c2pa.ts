export interface C2PAAssertion {
  label: string;
  data: Record<string, unknown>;
}

export interface C2PAManifest {
  title?: string;
  format?: string;
  instance_id?: string;
  claim_generator?: string;
  claim_generator_info?: Array<{ name: string; version: string }>;
  assertions?: C2PAAssertion[];
  signature_info?: {
    issuer?: string;
    time?: string;
  };
}

export interface C2PAVerificationResult {
  verified: boolean;
  issuer?: string;
  signedAt?: string;
  claimGenerator?: string;
  assertionsCount: number;
  warnings: string[];
}

/**
 * Validate and inspect a C2PA provenance manifest structure.
 */
export function inspectC2PAManifest(manifest: unknown): C2PAVerificationResult {
  if (typeof manifest !== 'object' || manifest === null) {
    return {
      verified: false,
      assertionsCount: 0,
      warnings: ['Invalid manifest: not a JSON object']
    };
  }

  const m = manifest as C2PAManifest;
  const warnings: string[] = [];

  if (!m.claim_generator) {
    warnings.push("Manifest is missing 'claim_generator' identification.");
  }

  if (!m.signature_info || !m.signature_info.issuer) {
    warnings.push("Manifest lacks cryptographic signature_info or trusted issuer authority.");
  }

  const assertionsCount = m.assertions?.length ?? 0;
  const issuer = m.signature_info?.issuer;
  const signedAt = m.signature_info?.time;

  return {
    verified: warnings.length === 0,
    issuer,
    signedAt,
    claimGenerator: m.claim_generator,
    assertionsCount,
    warnings
  };
}
