import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseRMD } from '../src/parser.js';
import { RMDQueryEngine } from '../src/query.js';

describe('RMDQueryEngine & Evidence Resolution', () => {
  it('should find evidence slices matching topic queries on video-field-report.rmd', () => {
    const filePath = path.resolve(__dirname, '../../../examples/video-field-report.rmd');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parseRMD(content);
    const engine = new RMDQueryEngine(doc);

    const evidence = engine.findEvidence('collapse');
    expect(evidence.length).toBeGreaterThan(0);
    expect(evidence[0].targetAssetId).toBe('shoreline-survey-video');
    expect(evidence[0].selector?.type).toBe('temporal');
    expect((evidence[0].selector as any)?.start).toBe(38.4);
  });

  it('should resolve evidence slice with minimal media metadata', () => {
    const filePath = path.resolve(__dirname, '../../../examples/image-report.rmd');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parseRMD(content);
    const engine = new RMDQueryEngine(doc);

    const slice = engine.resolveEvidenceSlice('ann-damaged-panel-01');
    expect(slice).not.toBeNull();
    expect(slice?.targetAssetId).toBe('roof-ortho-04');
    expect(slice?.assetKind).toBe('image');
    expect(slice?.selector?.type).toBe('xywh');
    expect(slice?.confidence).toBe(0.97);
  });

  it('should generate structured Evidence Pack conforming to schema', () => {
    const filePath = path.resolve(__dirname, '../../../examples/image-report.rmd');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parseRMD(content);
    const engine = new RMDQueryEngine(doc);

    const pack = engine.generateEvidencePack({
      agentName: 'TestInspectionAgent',
      minConfidence: 0.8
    });

    expect(pack.documentId).toBe('doc:solar-roof-inspection-2026');
    expect(pack.agent.name).toBe('TestInspectionAgent');
    expect(pack.claims.length).toBeGreaterThan(0);
    expect(pack.claims[0].evidence.length).toBeGreaterThan(0);
    expect(pack.claims[0].evidence[0].mediaKind).toBe('image');
    expect(pack.claims[0].evidence[0].mediaSrc).toBeDefined();
    expect(pack.auditTrail?.totalEvidenceNodes).toBe(pack.claims.length);
  });

  it('should recursively resolve chained annotations targeting other annotations', () => {
    const chainedRmd = `---
rmd: 0.1
id: doc:chain-test
title: Chained Annotation Test
---

\`\`\`rmd:media
id: media-drone
kind: image
src: ./test.jpg
mime: image/jpeg
\`\`\`

\`\`\`rmd:annotation
id: ann-hotspot-base
target: media-drone
type: defect
selector:
  type: xywh
  unit: pixel
  x: 100
  y: 100
  width: 200
  height: 200
claim: "Base thermal hotspot detected."
confidence: 0.95
\`\`\`

\`\`\`rmd:annotation
id: ann-hotspot-refutation
target: ann-hotspot-base
type: review
claim: "Confirmed resistance overheating under secondary review."
confidence: 0.98
source: verified
\`\`\`
`;
    const doc = parseRMD(chainedRmd);
    expect(doc.diagnostics.filter((d) => d.level === 'error')).toHaveLength(0);

    const engine = new RMDQueryEngine(doc);
    const resolved = engine.resolveEvidenceSlice('ann-hotspot-refutation');
    expect(resolved).not.toBeNull();
    expect(resolved?.targetAssetId).toBe('media-drone');
    expect(resolved?.assetKind).toBe('image');
    expect(resolved?.selector?.type).toBe('xywh');
  });

  it('should generate formatted prompt context with token budgeting', () => {
    const filePath = path.resolve(__dirname, '../../../examples/agent-workflow.rmd');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parseRMD(content);
    const engine = new RMDQueryEngine(doc);

    const promptContext = engine.toPromptContext();
    expect(promptContext).toContain('### RMD Document:');
    expect(promptContext).toContain('incident-security-cam-08');
    expect(promptContext).toContain('ann-gate-breach-event');
    expect(promptContext).toContain('Agent Instructions & Retrieval Hints:');
  });

  it('should compute byte savings metrics accurately', () => {
    const filePath = path.resolve(__dirname, '../../../examples/video-field-report.rmd');
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc = parseRMD(content);
    const engine = new RMDQueryEngine(doc);

    const savings = engine.calculateByteSavings();
    expect(savings.totalRawMediaBytes).toBe(1420500000); // 1.42 GB
    expect(savings.metadataBytes).toBeLessThan(10000); // < 10 KB
    expect(savings.savingsPercentage).toBeGreaterThan(99.9);
    expect(savings.estimatedInferenceSpeedupMultiplier).toBeGreaterThan(10000);
  });
});
