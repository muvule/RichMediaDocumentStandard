import { describe, it, expect } from 'vitest';
import { parseRMD } from '../src/parser.js';

describe('Negative & Adversarial Conformance Tests', () => {
  it('should detect and flag cyclic annotation target loops with ERR_CYCLIC_TARGET_REFERENCE', () => {
    const cyclicRmd = `---
rmd: 0.1
id: doc:cycle-test
title: Cyclic Loop Repro
---

\`\`\`rmd:annotation
id: ann-a
target: ann-b
type: claim
claim: "Claim A targets B"
\`\`\`

\`\`\`rmd:annotation
id: ann-b
target: ann-a
type: claim
claim: "Claim B targets A"
\`\`\`
`;
    const doc = parseRMD(cyclicRmd);
    const cycleErr = doc.diagnostics.find((d) => d.code === 'ERR_CYCLIC_TARGET_REFERENCE');
    expect(cycleErr).toBeDefined();
    expect(cycleErr?.message).toContain('Cyclic target reference detected');
  });

  it('should detect and flag self-targeting annotation loops', () => {
    const selfRmd = `---
rmd: 0.1
id: doc:self-loop
title: Self Loop
---

\`\`\`rmd:annotation
id: ann-self
target: ann-self
type: claim
claim: "I target myself"
\`\`\`
`;
    const doc = parseRMD(selfRmd);
    const cycleErr = doc.diagnostics.find((d) => d.code === 'ERR_CYCLIC_TARGET_REFERENCE');
    expect(cycleErr).toBeDefined();
  });

  it('should flag invalid confidence values with ERR_INVALID_CONFIDENCE_RANGE', () => {
    const badConfRmd = `---
rmd: 0.1
id: doc:bad-conf
title: Bad Confidence
---

\`\`\`rmd:media
id: media-photo
kind: image
src: ./photo.jpg
mime: image/jpeg
\`\`\`

\`\`\`rmd:annotation
id: ann-bad
target: media-photo
type: defect
confidence: 1.5
\`\`\`
`;
    const doc = parseRMD(badConfRmd);
    const confErr = doc.diagnostics.find((d) => d.code === 'ERR_INVALID_CONFIDENCE_RANGE' || d.code === 'ERR_SCHEMA_VALIDATION');
    expect(confErr).toBeDefined();
  });

  it('should block script injection attempts with ERR_SCRIPT_INJECTION', () => {
    const xssRmd = `---
rmd: 0.1
id: doc:xss-test
title: XSS Attack Attempt
---

# Malicious Header

<script>alert('XSS Exploit');</script>
`;
    const doc = parseRMD(xssRmd);
    const scriptErr = doc.diagnostics.find((d) => d.code === 'ERR_SCRIPT_INJECTION');
    expect(scriptErr).toBeDefined();
    expect(scriptErr?.message).toContain('Inline <script> tags are forbidden');
  });

  it('should flag unknown targets with ERR_UNKNOWN_TARGET', () => {
    const orphanRmd = `---
rmd: 0.1
id: doc:orphan
title: Orphan Annotation
---

\`\`\`rmd:annotation
id: ann-orphan
target: non-existent-media-99
type: note
claim: "Points nowhere"
\`\`\`
`;
    const doc = parseRMD(orphanRmd);
    const targetErr = doc.diagnostics.find((d) => d.code === 'ERR_UNKNOWN_TARGET');
    expect(targetErr).toBeDefined();
  });

  it('should flag incompatible selector with media kind with ERR_INCOMPATIBLE_SELECTOR', () => {
    const incompatRmd = `---
rmd: 0.1
id: doc:incompat
title: Incompatible Selector
---

\`\`\`rmd:media
id: media-still
kind: image
src: ./image.jpg
mime: image/jpeg
\`\`\`

\`\`\`rmd:annotation
id: ann-temporal-on-image
target: media-still
type: defect
selector:
  type: temporal
  start: 10.0
  end: 20.0
\`\`\`
`;
    const doc = parseRMD(incompatRmd);
    const incompatErr = doc.diagnostics.find((d) => d.code === 'ERR_INCOMPATIBLE_SELECTOR');
    expect(incompatErr).toBeDefined();
  });

  it('should parse variable length backtick fences with 4 backticks seamlessly', () => {
    const multiBacktickRmd = `---
rmd: 0.1
id: doc:multi-backtick
title: Multi Backtick Test
---

\`\`\`\`rmd:media
id: media-4-backticks
kind: image
src: ./4-backticks.jpg
mime: image/jpeg
\`\`\`\`
`;
    const doc = parseRMD(multiBacktickRmd);
    expect(doc.nodes.some((n) => n.type === 'rmd.media' && (n as any).attrs.id === 'media-4-backticks')).toBe(true);
  });

  it('should emit ERR_MISSING_FRONTMATTER when frontmatter is omitted', () => {
    const noFmRmd = `# Just Markdown

\`\`\`rmd:media
id: media-still
kind: image
src: ./image.jpg
mime: image/jpeg
\`\`\`
`;
    const doc = parseRMD(noFmRmd);
    const fmErr = doc.diagnostics.find((d) => d.code === 'ERR_MISSING_FRONTMATTER');
    expect(fmErr).toBeDefined();
    expect(fmErr?.level).toBe('error');
  });

  it('should reject invalid rmd SemVer versions', () => {
    const badVersionRmd = `---
rmd: "invalid-version"
id: doc:bad-version
title: Bad Version
---
`;
    const doc = parseRMD(badVersionRmd);
    expect(doc.diagnostics.some((d) => d.message.includes('SemVer') || d.code === 'ERR_INVALID_FRONTMATTER')).toBe(true);
  });

  it('should reject invalid sha256 hashes', () => {
    const badShaRmd = `---
rmd: 0.1
id: doc:bad-sha
title: Bad SHA
---

\`\`\`rmd:media
id: media-bad-sha
kind: image
src: ./image.jpg
mime: image/jpeg
sha256: "not-a-64-hex-hash"
\`\`\`
`;
    const doc = parseRMD(badShaRmd);
    expect(doc.diagnostics.some((d) => d.message.includes('sha256') || d.code === 'ERR_SCHEMA_VALIDATION')).toBe(true);
  });

  it('should reject IDs containing invalid characters with ERR_INVALID_ID_SYNTAX', () => {
    const badIdRmd = `---
rmd: 0.1
id: "bad id with spaces"
title: Bad ID
---
`;
    const doc = parseRMD(badIdRmd);
    expect(doc.diagnostics.some((d) => d.code === 'ERR_INVALID_FRONTMATTER' || d.code === 'ERR_INVALID_ID_SYNTAX')).toBe(true);
  });

  it('should reject negative spatial coordinates', () => {
    const negCoordRmd = `---
rmd: 0.1
id: doc:neg-coord
title: Negative Coord
---

\`\`\`rmd:media
id: media-img
kind: image
src: ./img.jpg
mime: image/jpeg
\`\`\`

\`\`\`rmd:annotation
id: ann-neg
target: media-img
type: defect
selector:
  type: xywh
  unit: pixel
  x: -10
  y: 20
  width: 100
  height: 100
\`\`\`
`;
    const doc = parseRMD(negCoordRmd);
    expect(doc.diagnostics.some((d) => d.message.includes('negative') || d.code === 'ERR_SCHEMA_VALIDATION' || d.code === 'ERR_INCOMPATIBLE_SELECTOR')).toBe(true);
  });
});

