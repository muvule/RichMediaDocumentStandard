# Architecture Decision Log (ADRs)

**Standard:** Rich Media Document (`.rmd`)  
**Maintainer:** muvule  

---

## ADR-001: 4-Tier Progressive Retrieval Funnel vs. Brute-Force Context Loading

### Context
Modern multimodal vision LLMs accept high-resolution images and videos directly in their context windows. However, passing a single 10-minute 4K video generates over 250,000 vision tokens (~$2.50 per query) and induces 12–20 seconds of latency. For agent loops running dozens of iterations, brute-force ingestion is economically and computationally unsustainable.

### Decision
RMD implements a deterministic **4-Tier Progressive Retrieval Funnel**:
1. **Tier 1 (Frontmatter & Topics):** Lightweight metadata (~200 tokens) loaded on initial agent turn.
2. **Tier 2 (Media Manifests):** Asset summaries, scene lists, and dimensions (~150 tokens).
3. **Tier 3 (Grounded Evidence Anchors):** Targeted spatial bounding boxes, OCR strings, and timecodes (~100 tokens).
4. **Tier 4 (Deferred Deep Slicing):** On-demand extraction of exact pixel crops or audio clips only when verification is required.

### Consequences
* **Positive:** Reduces token consumption by 99.98% (\$0.001 vs \$2.50) and drops latency from 15s to <10ms.
* **Trade-off:** Requires an initial one-time ingestion/indexing step (`rmd ingest`).

---

## ADR-002: Adoption of W3C Selectors over Proprietary Coordinate Systems

### Context
Existing systems (YOLO, COCO, Pascal VOC) use diverse coordinate formats (normalized `[0,1]`, pixel `[x1,y1,x2,y2]`, or center-based `[cx,cy,w,h]`).

### Decision
RMD standardizes on the **W3C Media Fragments 1.0** and **W3C Web Annotation** specification:
* `xywh`: `x, y, width, height` with explicit `unit: pixel | percent | normalized`.
* `temporal`: `start, end` in seconds with optional `timebase`.

### Consequences
* **Positive:** Universal interoperability with browser APIs (`<video>`, HTML5 Canvas, SVG), GIS tools, and open-source vision pipelines.

---

## ADR-003: Deterministic Grounding & Confidence Scoring Rubric

### Context
AI agents often hallucinate claims based on ambiguous visual patterns. Without a standardized confidence interpretation model, downstream execution systems cannot decide whether to trust an AI assertion.

### Decision
RMD mandates a standardized confidence scoring and provenance rubric:
* `confidence` MUST be a normalized float between `0.0` and `1.0`.
* `source` MUST be explicitly declared:
  * `human`: Certified human ground-truth (implicitly `confidence: 1.0`).
  * `verified`: Cryptographically proven or sensor-verified data.
  * `extracted`: Deterministic heuristic extraction (e.g. barcode decoding, metadata parsing).
  * `model`: Stochastic ML/LLM model inference.
* Autonomous agent execution policy: AI signals with `source: model` and `confidence < 0.75` MUST be treated as unverified hypotheses and rejected from high-risk action loops.

---

## ADR-004: In-File Plaintext Manifests vs. External JSON Sidecars

### Context
Many formats keep markdown clean by separating metadata into detached `.json` or `.sidecar` files.

### Decision
RMD keeps typed manifests **inside the single Markdown document** using fenced code blocks (`rmd:*`).

### Consequences
* **Positive:** Single-file portability, zero risk of orphaned metadata when sharing files via email/Slack, and 100% native Git-diffing across both prose and annotations.
* **Positive:** Humans can read the file in standard Markdown viewers (GitHub, Obsidian, VS Code) where `rmd:*` blocks render as clean syntax-highlighted code.

---

## ADR-005: Built-in Redaction via Spatial/Temporal Selectors

### Context
Enterprise compliance (GDPR, HIPAA, SOC 2) requires masking faces, license plates, and sensitive documents before exposing multimodal assets to external LLM APIs.

### Decision
RMD supports `type: redaction` annotations directly in the document graph, instructing ingestion workers to dynamically apply blur or silence filters before generating downstream slices.

---

## ADR-006: Rejection of Inline Base64 and Blind URLs for Multimodal Agents

### Context
Developers attempting to make Markdown self-contained often use inline Base64 data URIs (`![img](data:image/jpeg;base64,...)`) or standard blind links (`![photo](https://...)`). Both create severe flaws for AI agents:
1. **Base64 Token Inflation:** A single image generates tens of thousands of characters of random text gibberish, wasting context window space and costing \$2.50+ per turn without providing readable text.
2. **Vision API Disconnect:** Multimodal LLMs (GPT-4o, Claude, Gemini) accept binary image payloads, not raw Base64 strings dumped into text prompt streams.
3. **Blind Links:** Standard URLs provide zero visibility into intrinsic dimensions, scene intervals, or bounding boxes, forcing slow re-downloads and causing visual hallucinations.

### Decision
RMD separates the document narrative from media payloads by maintaining clean, structured manifests (`rmd:media`) and targeted evidence anchors (`rmd:annotation`). Downstream agent SDKs extract minimal **evidence slices** (~150 tokens) on demand.

### Consequences
* **Positive:** 99.98% token and cost savings (\$0.001 vs \$2.50 per query).
* **Positive:** Complete prevention of Base64 context window pollution and indirect prompt injection data exfiltration via malformed image tags.

