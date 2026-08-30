# `@rmd/core` TypeScript API Reference

The `@rmd/core` package provides a zero-dependency, high-performance toolkit for lexing, parsing, validating, querying, and canonicalizing Rich Media Documents.

---

## 1. Parser & Lexer

### `parseRMD(content: string, options?: ParserOptions): RMDDocument`
Parses raw `.rmd` Markdown text into a fully validated AST.

```typescript
import { parseRMD } from '@rmd/core';

const doc = parseRMD(rmdContent);
console.log(`Parsed ${doc.nodes.length} nodes with ${doc.diagnostics.length} diagnostics.`);
```

---

## 2. Graph Exporter

### `toAgentGraph(doc: RMDDocument): AgentGraph`
Flattens document nodes into a queryable semantic graph containing assets, annotations, relationships, schemas, and directives.

```typescript
import { toAgentGraph } from '@rmd/core';

const graph = toAgentGraph(doc);
console.log(`Assets: ${graph.assets.length}, Annotations: ${graph.annotations.length}`);
```

---

## 3. Query Engine

### `new RMDQueryEngine(doc: RMDDocument)`
Provides high-speed indexing, token cost calculation, and filtered evidence retrieval for LLM context prompts.

```typescript
import { RMDQueryEngine } from '@rmd/core';

const engine = new RMDQueryEngine(doc);

// 1. Search evidence by keyword or entity
const matches = engine.findEvidence('micro-fracture');

// 2. Generate Evidence Pack for an Agent
const pack = engine.generateEvidencePack({
  agentName: 'InspectionAgent-v2',
  minConfidence: 0.85
});

// 3. Calculate Token & Byte Savings
const savings = engine.calculateByteSavings();
console.log(`Token Savings: ${savings.savingsPercentage}%`);
```

---

## 4. Binary Prober & Document Synthesizer

### `probeFile(filePath: string): Promise<MediaProbeResult>`
Probes image dimensions, video duration/timebase, audio codecs, and byte sizes without external dependencies.

### `synthesizeRMDDocument(assets: DiscoveredAsset[], options?: SynthesizerOptions): IngestResult`
Synthesizes a clean `.rmd` document from a list of discovered media files.
