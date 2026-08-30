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
