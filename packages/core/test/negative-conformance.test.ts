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
});
