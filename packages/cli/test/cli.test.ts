import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

describe('RMD CLI Subcommand Integration Tests', () => {
  const cliBin = path.resolve(__dirname, '../bin/rmd.js');
  const examplesDir = path.resolve(__dirname, '../../../examples');

  beforeAll(() => {
    const distPath = path.resolve(__dirname, '../dist/index.js');
    if (!fs.existsSync(distPath)) {
      execSync('npm run build', { cwd: path.resolve(__dirname, '../../..') });
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
});
