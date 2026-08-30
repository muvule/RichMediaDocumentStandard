# 📑 Rich Media Document (RMD) Standard

> **Plain-text Markdown for the multimodal AI era.**  
> Turns photos, 4K inspection videos, and audio into **searchable, lightweight evidence anchors** inside Markdown—without blowing up your context window with messy Base64 text or forcing models to re-read gigabytes of raw pixels.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Specification Version](https://img.shields.io/badge/Spec-v0.1-emerald.svg)](docs/SPEC-v0.1.md)
[![Tests Passing](https://img.shields.io/badge/Tests-55%2F55%20Passing-brightgreen.svg)]()
[![Node Version](https://img.shields.io/badge/Node.js-18%2B-green.svg)]()

---

## ⚡ Why Putting Media in Markdown is Broken for AI Agents

Today, developers building multimodal AI agents (for inspections, insurance, medical imaging, or legal discovery) run into a major dilemma when working with Markdown:

```
❌ The Base64 Trap:                ❌ The Blind Link Trap:            ✅ The RMD Standard:
![photo](data:image/jpeg;base64...)   ![photo](https://site.com/4k.mp4)   ```rmd:annotation
                                                                        target: media:drone-01
• 50,000+ characters of gibberish    • Completely opaque to the LLM     selector: {xywh: [1420,880,240,190]}
• Inflates token costs ($2.50/turn)   • Requires downloading full file   claim: "Hotspot on Panel B12"
• Vision models can't parse text B64  • Non-reproducible hallucinations  • ~150 tokens ($0.001/turn)
```

| Approach | What Goes into Prompt | Cost per Agent Step | AI Vision Impact | Determinism |
| :--- | :--- | :--- | :--- | :--- |
| **Inline Base64** (`data:...`) | 50,000+ text tokens of random characters | **~$2.50+** / turn | ❌ **Broken:** LLMs see a wall of text, not an image | ❌ Chokes context window |
| **Standard Link** (`![img](url)`) | Opaque URL (0 visual tokens) | **~$0.00** (blind) | ❌ **Opaque:** LLM knows nothing without full redownload | ❌ Hallucinated claims |
| **RMD Standard** (`.rmd`) | Precision **Evidence Slices** (~150 tokens) | **~$0.001** / turn | ✅ **Grounded:** Exact bounding boxes, OCR & timecodes | ✅ **Verifiable & Tamper-Proof** |

---

## 💡 How RMD Works: "Index Once, Query 10,000 Times"

Rather than forcing multimodal models to re-scan multi-gigabyte raw pixels on every single step of an autonomous agent loop, RMD indexes media into a **lightweight, 4-tier retrieval funnel**:

1. **Document Frontmatter & Semantic Index (`rmd:semantic`)** (~200 tokens)  
   High-level document overview, scene summaries, topic tags, and entity relationships.
2. **Media Manifests (`rmd:media`)** (~150 tokens)  
   Authoritative pixel coordinate spaces (`width`, `height`), durations, MIME types, and cryptographic SHA-256 hashes.
3. **Grounded Evidence Anchors (`rmd:annotation`)** (~100 tokens)  
   Ties discrete factual claims to exact W3C spatial bounding boxes (`xywh: pixel`) and video/audio timecodes (`start..end`).
4. **Deep Raw Slicing (Deferred / On-Demand Only)**  
   If and only if an agent needs high-precision re-verification, the engine extracts the sub-pixel crop or audio slice.

---

## 📝 Syntax Example

An `.rmd` file is **100% valid plain text Markdown** enriched with typed, human-readable blocks:

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

## 🚀 Quickstart

### 1. Global CLI Tool
```bash
# Install CLI globally
npm install -g @rmd/cli

# Ingest any media directory into a structured RMD document
rmd ingest ./surveys/ --output ./report.rmd

# Validate document conformance & view actionable fix guidance
rmd validate ./report.rmd

# Export to standalone interactive HTML, COCO, or GeoJSON
rmd export ./report.rmd --format html -o ./report.html
rmd export ./report.rmd --format coco -o ./coco.json

# Import YOLO dataset bounding boxes into an RMD document
rmd import ./labels.txt --format yolo --image ./photo.jpg -o ./survey.rmd

# Query evidence for an agent prompt
rmd query ./report.rmd --filter "hotspot" --tokens
```

### 2. Node.js & LangChain SDK
```typescript
import { parseRMD, RMDQueryEngine, RMDDocumentLoader } from '@rmd/core';
import * as fs from 'fs';

const content = fs.readFileSync('./report.rmd', 'utf-8');

// 1. Instant AST Parse (< 2ms)
const doc = parseRMD(content);

// 2. Ingest into LangChain Documents
const loader = new RMDDocumentLoader(content);
const docs = loader.load();

// 3. Query Grounded Evidence Anchors
const engine = new RMDQueryEngine(doc);
const evidence = engine.findEvidence('micro-fracture');
console.log(`Found ${evidence.length} evidence anchors with ${engine.calculateByteSavings().savingsPercentage}% token savings`);
```

### 3. Docker Zero-Install Ingestion
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

| Feature | Standard Markdown | Base64 in Markdown | W3C Web Annotation | RMD Standard (.rmd) |
| :--- | :---: | :---: | :---: | :---: |
| **Human Readable** | ✅ Yes | ❌ Wall of text | ❌ JSON-LD only | **✅ 100% Markdown** |
| **Spatial (`xywh`) Anchors** | ❌ None | ❌ None | ✅ Complex | **✅ Pixel Bounding Boxes** |
| **Temporal Timecodes** | ❌ None | ❌ None | ✅ Selectors | **✅ Timecode Intervals** |
| **Token Efficiency** | ⚠️ Blind link | ❌ Massive inflation | ❌ Heavy JSON-LD | **✅ 99.98% Token Savings** |
| **Agent Tool Grounding** | ❌ None | ❌ None | ❌ Browser-centric | **✅ Structured Evidence Packs** |
| **Git Diffable & Portable** | ✅ Yes | ❌ Bloats Git history | ⚠️ Boilerplate | **✅ Single Plaintext File** |

---

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
