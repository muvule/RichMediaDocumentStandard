# 📑 Rich Media Document (RMD) Standard

> **The open standard for agent-native rich media documents.**  
> Enriches Markdown with spatial bounding boxes, video/audio intervals, and deterministic multimodal AI evidence grounding.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Specification Version](https://img.shields.io/badge/Spec-v0.1-emerald.svg)](#specification-overview)
[![Tests Passing](https://img.shields.io/badge/Tests-19%2F19%20Passing-brightgreen.svg)]()
[![Node Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)]()

---

## ⚡ The Problem: The Multimodal Token Bottleneck

When autonomous AI agents analyze high-resolution drone photos, 4K inspection videos, or hours of audio, passing multi-gigabyte raw files repeatedly into LLM prompts causes massive latency and exorbitant API costs.

| Metric | Traditional Raw Media Ingestion | RMD Standard Retrieval |
| :--- | :--- | :--- |
| **Cost per Agent Step** | **~$2.50** (500k+ video tokens) | **~$0.001** (~250 tokens) |
| **Retrieval Latency** | **12–20 seconds** | **< 10 milliseconds** |
| **Token & Bandwidth Savings** | 0% | **99.98% Reduction** |
| **Determinism** | Non-reproducible visual hallucinations | **Verifiable W3C `xywh` & timecodes** |

---

## 🚀 Quickstart

### 1. Ingest Media Automatically via CLI

Generate an `.rmd` document directly from any folder of photos, inspection videos, or audio recordings:

```bash
# Ingest an entire folder of inspection media
npx @rmd/cli ingest ./my_inspection_folder/ --output report.rmd

# Or compile a single media asset
npx @rmd/cli compile ./drone_survey.mp4 --output survey.rmd
```

### 2. Validate & Inspect Documents

```bash
# Validate syntax, selectors, and schema conformance
npx @rmd/cli validate report.rmd

# Inspect media manifests, dimensions, and token savings
npx @rmd/cli inspect report.rmd
```

---

## 🏗️ How RMD Works: The 4-Tier Evidence Funnel

Rather than re-scanning raw pixels on every agent turn, RMD indexes media into a 4-tier retrieval hierarchy:

```
┌────────────────────────────────────────────────────────┐
│  Tier 1: Document Frontmatter & Semantic Index         │  ~200 tokens
│  High-level scene summaries, entities, and taxonomies  │
├────────────────────────────────────────────────────────┤
│  Tier 2: Media Manifests (rmd:media)                   │  ~150 tokens
│  Intrinsic dimensions, durations, hashes, and scenes   │
├────────────────────────────────────────────────────────┤
│  Tier 3: Grounded Evidence Anchors (rmd:annotation)   │  ~100 tokens
│  W3C spatial bounding boxes (xywh) & timecodes        │
├────────────────────────────────────────────────────────┤
│  Tier 4: Deep Raw Slicing (Deferred / On-Demand Only)  │  Exact Sub-Crop
│  Extracts precise sub-pixel crops or audio clips       │
└────────────────────────────────────────────────────────┘
```

---

## 📝 Syntax Example

An `.rmd` file is **100% valid plain text Markdown** enriched with typed `rmd:*` blocks:

````markdown
---
rmd: 0.1
id: doc:solar-roof-inspection-2026
title: Commercial Rooftop Solar Array Inspection
language: en
license: Apache-2.0
---

# Solar Inspection Report

```rmd:media
id: media:drone-ortho-01
kind: image
src: ./drone-survey-highres.jpg
mime: image/jpeg
width: 6000
height: 4000
sha256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
```

Thermal imaging reveals a localized hotspot on photovoltaic panel B12.

```rmd:annotation
id: anno:hotspot-panel-b12
target: media:drone-ortho-01
type: defect
selector:
  type: xywh
  unit: pixel
  x: 1420
  y: 880
  width: 240
  height: 190
body:
  label: Thermal Hotspot (Panel B12)
  text: "Cell micro-fracture causing resistance heating (Delta T = +14.2°C)."
claim: "Cell micro-fracture causing localized thermal hotspot on Panel B-12."
confidence: 0.94
source: extracted
```
````

---

## 🚀 Developer Quickstart

### Option 1: Global CLI Tool
```bash
# Install CLI globally
npm install -g @rmd/cli

# Ingest any media directory into a structured RMD document
rmd ingest ./surveys/ --objects --scenes --output ./report.rmd

# Validate document conformance & integrity
rmd validate ./report.rmd

# Query evidence for an agent prompt
rmd query ./report.rmd --filter "hotspot" --tokens
```

### Option 2: Node.js / TypeScript SDK
```typescript
import { parseRMD, toAgentGraph, RMDQueryEngine } from '@rmd/core';
import * as fs from 'fs';

const content = fs.readFileSync('./report.rmd', 'utf-8');

// 1. Instant AST Parse (< 2ms)
const doc = parseRMD(content);

// 2. Export Graph for Multimodal Agent Tool Execution
const graph = toAgentGraph(doc);

// 3. Query Grounded Evidence Anchors
const engine = new RMDQueryEngine(doc);
const evidence = engine.findEvidence('micro-fracture');
console.log(`Found ${evidence.length} evidence anchors with ${engine.calculateByteSavings().savingsPercentage}% token savings`);
```

### Option 3: Docker Zero-Install Ingestion
```bash
# Ingest using Docker without installing Node.js locally
docker run --rm -v $(pwd):/workspace ghcr.io/muvule/rmd:latest ingest /workspace/data -o /workspace/output.rmd
```

---

## 📚 Specification & Technical Guides

| Document | Description |
| :--- | :--- |
| **[Formal Specification v0.1](docs/SPEC-v0.1.md)** | Complete grammar, typed block schemas, canonicalization algorithm, and SemVer policy |
| **[Architecture Decision Log](docs/DECISIONS.md)** | ADRs on the 4-tier funnel, W3C selector compatibility, and confidence scoring rubrics |
| **[Reproducible Benchmarks](benchmarks/README.md)** | Mathematical token economics formulas (\$2.50 vs \$0.001), latency profiles, and dataset catalog |
| **[Evidence Showcase](examples/README.md)** | Real-world `.rmd` multi-modal evidence unit walkthroughs (Image, 4K Video, Audio, Agent Directives) |
| **[C2PA & Provenance](docs/PROVENANCE.md)** | Cryptographic SHA-256 validation, content credentials, and C2PA trust fabric |
| **[Security & Redaction](docs/SECURITY_AND_REDACTION.md)** | Sensitive media masking (`type: redaction`), facial blur, and air-gapped local execution |
| **[Configuration Guide](docs/CONFIGURATION.md)** | `.rmdrc`, `rmd.config.json`, CLI flags, environment variables, and diagnostic codes |
| **[Core API Reference](docs/API_REFERENCE.md)** | Complete `@rmd/core` SDK API documentation and method signatures |
| **[Migration Guide](docs/MIGRATION_GUIDE.md)** | Step-by-step migration from GFM, W3C Web Annotation, and MDX |
| **[Agent SDK Recipes](docs/SDK_EXAMPLES.md)** | Python agent integration, Node.js tool runners, and LangChain custom retriever |

---

## 📊 Market Comparison

| Feature | Standard Markdown | W3C Web Annotation | C2PA Provenance | RMD Standard (.rmd) |
| :--- | :---: | :---: | :---: | :---: |
| **Human Readable** | ✅ Yes | ❌ JSON-LD only | ❌ Binary JUMBF | **✅ 100% Markdown** |
| **Spatial (`xywh`) Anchors** | ❌ None | ✅ Complex | ❌ None | **✅ Pixel Bounding Boxes** |
| **Temporal Video/Audio Clips** | ❌ None | ✅ Selectors | ❌ None | **✅ Timecode Intervals** |
| **Agent-Native 4-Tier Funnel** | ❌ Text only | ❌ Browser-only | ❌ No reasoning hooks | **✅ 99.98% Token Savings** |
| **Git Diffable & Portable** | ✅ Yes | ⚠️ Boilerplate | ❌ Binary | **✅ Single Plaintext File** |

## 💻 Monorepo Workspace

- **`@rmd/core`**: Zero-dependency TypeScript parser, AST generator, query engine, and binary prober.
- **`@rmd/cli`**: Command-line tool for ingestion, validation, compilation, and benchmarks.
- **`@rmd/playground`**: Interactive web studio & landing page with real-time SVG bounding box overlays, video sync, and AST inspector.

---

## 📜 License & Citation

Licensed under the **[Apache License 2.0](LICENSE)**. Copyright © 2026 muvule.

```bibtex
@misc{rmd_standard_2026,
  title={Rich Media Document (RMD): An Open Standard for Multimodal Agent Evidence Grounding},
  author={muvule},
  year={2026},
  howpublished={\url{https://github.com/muvule/RichMediaDocumentStandard}}
}
```
