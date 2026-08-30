import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseRMD, toAgentGraph, RMDQueryEngine } from '../packages/core/src/index.js';

describe('RMD Benchmark Harness', () => {
  const exampleFiles = [
    'image-report.rmd',
    'video-field-report.rmd',
    'podcast-note.rmd',
    'agent-workflow.rmd'
  ];

  it('should benchmark cold parse, warm parse, and graph export latency', () => {
    console.log('\n================ RMD PERFORMANCE BENCHMARK ================');
    const results: any[] = [];

    for (const filename of exampleFiles) {
      const fullPath = path.resolve(__dirname, '../examples', filename);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // 1. Cold Parse Time
      const coldStart = performance.now();
      const doc = parseRMD(content);
      const coldTimeMs = performance.now() - coldStart;

      // 2. Warm Parse Time (200 iterations)
      const warmIters = 200;
      const warmStart = performance.now();
      for (let i = 0; i < warmIters; i++) {
        parseRMD(content);
      }
      const avgWarmMs = (performance.now() - warmStart) / warmIters;

      // 3. Agent Graph Export Time
      const graphStart = performance.now();
      const graph = toAgentGraph(doc);
      const graphTimeMs = performance.now() - graphStart;

      // 4. Evidence Query Time
      const engine = new RMDQueryEngine(doc);
      const queryStart = performance.now();
      const evidence = engine.findEvidence('report');
      const queryTimeMs = performance.now() - queryStart;

      const savings = engine.calculateByteSavings();

      results.push({
        file: filename,
        nodes: doc.nodes.length,
        coldTimeMs: coldTimeMs.toFixed(2),
        avgWarmMicroseconds: (avgWarmMs * 1000).toFixed(1),
        graphExportMs: graphTimeMs.toFixed(3),
        queryTimeMs: queryTimeMs.toFixed(3),
        rawMediaMB: (savings.totalRawMediaBytes / (1024 * 1024)).toFixed(1),
        metadataKB: (savings.metadataBytes / 1024).toFixed(1),
        savingsPercent: savings.savingsPercentage.toFixed(2)
      });
    }

    console.table(results);

    // Performance assertions
    for (const r of results) {
      expect(parseFloat(r.coldTimeMs)).toBeLessThan(50); // < 50ms cold
      expect(parseFloat(r.avgWarmMicroseconds)).toBeLessThan(5000); // < 5ms warm
    }
  });
});
