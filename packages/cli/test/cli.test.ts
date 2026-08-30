import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('RMD CLI Subcommand Integration Tests', () => {
  const cliBin = path.resolve(__dirname, '../bin/rmd.js');
  const examplesDir = path.resolve(__dirname, '../../../examples');

  beforeAll(() => {
    try {
      execSync('npx tsc --project packages/core/tsconfig.json && npx tsc --project packages/cli/tsconfig.json', {
        cwd: path.resolve(__dirname, '../../..'),
        stdio: 'ignore'
      });
    } catch {
      // If already built or tsc is in parent process
    }
  });

  const runCLI = (args: string) => {
    return execSync(`node ${cliBin} ${args}`, {
      encoding: 'utf-8',
      cwd: path.resolve(__dirname, '../../..')
    });
  };

  it('should execute rmd parse command', () => {
    const out = runCLI(`parse ./examples/image-report.rmd`);
    expect(out).toContain('Parsed: Commercial Rooftop Solar Array Inspection');
    expect(out).toContain('Total AST Nodes:');
  });

  it('should execute rmd validate command on valid document', () => {
    const out = runCLI(`validate ./examples/image-report.rmd`);
    expect(out).toContain('Validation Passed: 0 errors');
  });

  it('should execute rmd inspect command and show metrics', () => {
    const out = runCLI(`inspect ./examples/video-field-report.rmd`);
    expect(out).toContain('RMD INSPECTOR:');
    expect(out).toContain('MEDIA MANIFEST');
    expect(out).toContain('TOKEN & BYTE SAVINGS METRICS');
  });

  it('should execute rmd query command with --filter', () => {
    const out = runCLI(`query ./examples/image-report.rmd --filter "fracture"`);
    expect(out).toContain('RMD QUERY RESULTS:');
    expect(out).toContain('ann-damaged-panel-01');
  });

  it('should execute rmd query command with --tokens', () => {
    const out = runCLI(`query ./examples/image-report.rmd --tokens`);
    expect(out).toContain('### RMD Document:');
    expect(out).toContain('Media Assets Manifest:');
  });

  it('should execute rmd query command with --evidence-pack', () => {
    const out = runCLI(`query ./examples/image-report.rmd --evidence-pack`);
    const parsed = JSON.parse(out);
    expect(parsed.documentId).toBe('doc:solar-roof-inspection-2026');
    expect(parsed.claims).toBeDefined();
    expect(parsed.claims.length).toBeGreaterThan(0);
  });

  it('should execute rmd export command with --format canonical', () => {
    const out = runCLI(`export ./examples/image-report.rmd --format canonical`);
    expect(out.startsWith('{')).toBe(true);
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it('should export COCO dataset format with --format coco', () => {
    const out = runCLI(`export ./examples/image-report.rmd --format coco`);
    const parsed = JSON.parse(out);
    expect(parsed.images).toBeDefined();
    expect(parsed.annotations).toBeDefined();
    expect(parsed.categories).toBeDefined();
    expect(parsed.images.length).toBeGreaterThan(0);
    expect(parsed.annotations[0].bbox).toBeDefined();
  });

  it('should export GeoJSON format with --format geojson', () => {
    const out = runCLI(`export ./examples/image-report.rmd --format geojson`);
    const parsed = JSON.parse(out);
    expect(parsed.type).toBe('FeatureCollection');
    expect(parsed.features).toBeDefined();
    expect(parsed.features[0].geometry.type).toBe('Polygon');
  });

  it('should export standalone interactive HTML with --format html', () => {
    const out = runCLI(`export ./examples/image-report.rmd --format html`);
    expect(out).toContain('<!DOCTYPE html>');
    expect(out).toContain('<svg viewBox="0 0');
    expect(out).toContain('Grounded Evidence Anchors');
  });

  it('should import YOLO bounding box labels into an RMD document', () => {
    const yoloFile = path.resolve(__dirname, 'temp_yolo.txt');
    fs.writeFileSync(yoloFile, '0 0.5 0.5 0.2 0.2\n1 0.2 0.3 0.1 0.15\n', 'utf-8');

    const out = runCLI(`import ${yoloFile} --format yolo --image ./assets/test.jpg`);
    expect(out).toContain('```rmd:media');
    expect(out).toContain('```rmd:annotation');
    expect(out).toContain('anno:yolo-obj-1');
    expect(out).toContain('anno:yolo-obj-2');

    if (fs.existsSync(yoloFile)) {
      fs.unlinkSync(yoloFile);
    }
  });
});

