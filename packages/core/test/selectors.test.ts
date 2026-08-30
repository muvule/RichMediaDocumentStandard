import { describe, it, expect } from 'vitest';
import { parseRMD } from '../src/parser.js';
import { formatSelector, isSelectorCompatibleWithMedia, isTemporalOverlap } from '../src/selectors.js';
import { TemporalSelector, SpatialSelector } from '../src/types.js';

describe('Selectors & Cross-Reference Validation', () => {
  it('should format selectors correctly into readable text', () => {
    const temporal: TemporalSelector = { type: 'temporal', start: 12.5, end: 45.0 };
    expect(formatSelector(temporal)).toBe('12.5s - 45.0s (Δ 32.5s)');

    const spatial: SpatialSelector = { type: 'xywh', unit: 'pixel', x: 100, y: 200, width: 300, height: 400 };
    expect(formatSelector(spatial)).toBe('x:100, y:200, w:300, h:400 (pixel)');
  });

  it('should validate selector compatibility against media types', () => {
    const spatial: SpatialSelector = { type: 'xywh', x: 10, y: 10, width: 50, height: 50 };
    const resAudio = isSelectorCompatibleWithMedia(spatial, 'audio');
    expect(resAudio.valid).toBe(false);
    expect(resAudio.error).toContain('visual media');

    const resImg = isSelectorCompatibleWithMedia(spatial, 'image');
    expect(resImg.valid).toBe(true);

    const temporal: TemporalSelector = { type: 'temporal', start: 5, end: 10 };
    const resTempImg = isSelectorCompatibleWithMedia(temporal, 'image');
    expect(resTempImg.valid).toBe(false);
    expect(resTempImg.error).toContain('video');
  });

  it('should detect invalid cross-references in document validation', () => {
    const source = `---
rmd: 0.1
id: doc:invalid-target
title: Invalid Target Test
---

\`\`\`rmd:media
id: my-audio
kind: audio
src: ./track.mp3
mime: audio/mpeg
\`\`\`

\`\`\`rmd:annotation
id: ann-bad-01
target: non-existent-asset
type: note
claim: "This targets a ghost."
\`\`\`

\`\`\`rmd:annotation
id: ann-bad-02
target: my-audio
type: crop
selector:
  type: xywh
  x: 10
  y: 10
  width: 50
  height: 50
claim: "Spatial crop on audio file."
\`\`\`
`;
    const doc = parseRMD(source);
    const unknownTargetErr = doc.diagnostics.find((d) => d.code === 'ERR_UNKNOWN_TARGET');
    expect(unknownTargetErr).toBeDefined();

    const incompatSelectorErr = doc.diagnostics.find((d) => d.code === 'ERR_INCOMPATIBLE_SELECTOR');
    expect(incompatSelectorErr).toBeDefined();
  });

  it('should detect temporal overlaps', () => {
    const a: TemporalSelector = { type: 'temporal', start: 10, end: 30 };
    const b: TemporalSelector = { type: 'temporal', start: 25, end: 50 };
    const c: TemporalSelector = { type: 'temporal', start: 35, end: 60 };

    expect(isTemporalOverlap(a, b)).toBe(true);
    expect(isTemporalOverlap(a, c)).toBe(false);
  });
});
