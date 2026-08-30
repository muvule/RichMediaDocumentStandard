# 🗺️ Rich Media Document (RMD) Product & Engineering Roadmap

**Standard:** Rich Media Document (`.rmd`)  
**Maintainer:** `muvule`  
**License:** Apache 2.0  
**Status:** Living Document | Updated: August 2026

---

## 1. Prioritization Framework (Impact vs. Effort Matrix)

To maximize adoption and utility for multimodal AI agent builders, features are prioritized by their **Value Multiplier (Impact)** versus **Implementation Complexity (Effort)**:

```
▲ HIGH IMPACT
│
│  [P1.1] Visual Click-and-Drag Bbox Annotator    [P2.1] VS Code Extension & TextMate Grammar
│  [P1.2] LangChain & LlamaIndex Document Loader  [P2.2] Interactive Playground Tutorial
│  [P1.3] Actionable CLI Error Hints & Remedies    [P3.1] Zero-Knowledge Encrypted Blocks (AES-GCM)
│  [P1.4] YOLO / COCO Dataset Importers/Exporters [P3.2] Role-Based Access Control (RBAC/ACL)
│
│  ───────────────────────────────────────────────┼───────────────────────────────────────────────
│
│  [P1.5] Single-File HTML Standalone Exporter    [P3.3] PDF Visual Bounding Box Extractor
│                                                 [P3.4] Automated Conformance Badge CI System
│
└─────────────────────────────────────────────────────────────────────────────────────────────►
  LOW EFFORT (Fast Turnaround)                       HIGH EFFORT (Complex Architecture)
```

---

## 2. Roadmap Phases

### 🚀 Phase 1: DX, Agent Connectors & Visual Annotation (v0.2.0 — Immediate Focus)
*Target: Maximize developer adoption, agent integration ease, and no-code creation.*

| Feature | Category | Effort | Impact | Description |
| :--- | :--- | :---: | :---: | :--- |
| **1. Visual Click-to-Annotate in Studio** | Web Studio | Low | **Critical** | Allow users to draw bounding boxes with mouse on image/video previews in `@rmd/playground`, instantly appending formatted `rmd:annotation` blocks into the Markdown editor. |
| **2. LangChain & LlamaIndex Document Loaders** | Agent Ecosystem | Low | **High** | Publish official `RMDLoader` and `RMDQueryRetriever` packages for LangChain (Python & TS) and LlamaIndex to feed 150-token evidence slices straight into RAG pipelines. |
| **3. Actionable CLI Diagnostics & Fix Guidance** | CLI / DX | Low | **High** | Enhance `rmd validate` to output human-readable explanations and copy-pasteable code fixes alongside technical error codes (e.g. `ERR_CYCLIC_TARGET_REFERENCE`). |
| **4. YOLO & COCO Dataset Interoperability** | Tooling | Medium | **High** | Add CLI commands (`rmd import --format yolo` and `rmd export --format coco`) allowing computer vision teams to convert training annotations into `.rmd` documents. |
| **5. Standalone Interactive HTML Exporter** | Export | Low | **Medium** | Add `rmd export report.rmd --format html` producing a single, self-contained HTML page with embedded SVG bounding box overlays for sharing with non-technical stakeholders. |

---

### ⚡ Phase 2: Editor Tooling & Guided Onboarding (v0.3.0)
*Target: Frictionless IDE editing and interactive developer education.*

| Feature | Category | Effort | Impact | Description |
| :--- | :--- | :---: | :---: | :--- |
| **1. Official VS Code Extension** | IDE Tooling | Medium | **Critical** | Syntax highlighting for `rmd:*` code blocks, live hover preview of bounded image sub-crops, autocomplete for block IDs and selector keys, and inline diagnostics. |
| **2. Interactive Web Studio Walkthrough** | Onboarding | Low | **High** | A 3-step interactive onboarding modal in `@rmd/playground` guiding first-time users through loading an asset, drawing an evidence box, and querying prompt context. |
| **3. Obsidian / Markdown Editor Plugin** | Desktop Ecosystem | Medium | **Medium** | Community plugin for Obsidian and Logseq rendering SVG bounding box reticles directly over images within daily notes and research vaults. |
| **4. PDF Document Ingestion with Spatial OCR** | Ingest Pipeline | Medium | **High** | Extend `rmd ingest` to parse multi-page PDFs, extracting spatial text bounding boxes and chart images into structured `.rmd` manifests. |

---

### 🛡️ Phase 3: Zero-Knowledge Security & Enterprise Governance (v0.4.0)
*Target: Defense-grade privacy, multi-tenant compliance, and certification.*

| Feature | Category | Effort | Impact | Description |
| :--- | :--- | :---: | :---: | :--- |
| **1. Encrypted Evidence Blocks (`rmd:encrypted`)** | Security & Privacy | Medium | **High** | AES-256-GCM encrypted block extension allowing selective payload encryption of sensitive claims or raw media slices, decryptable only by agents with the secret key. |
| **2. Role-Based Access Control (ACL) Frontmatter** | Governance | Low | **Medium** | Standardize frontmatter `acl` directives defining which agent roles or verification tiers can access specific high-resolution media slices. |
| **3. Automated Compliance Badge & Conformance CI** | Certification | Low | **Medium** | GitHub Action and web badge (`RMD Compliant v0.1`) certifying third-party parsers, viewers, and model pipelines against the reference test suite. |

---

## 3. Immediate Technical Specifications for Top Priority Deliverables

### Deliverable A: LangChain Document Loader & Custom Retriever

```python
# lang_chain_rmd_loader.py
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever
import subprocess
import json

class RMDDocumentLoader:
    """Loads an .rmd file into lightweight, grounded evidence slices for LLM prompts."""
    def __init__(self, file_path: str):
        self.file_path = file_path

    def load(self) -> list[Document]:
        # Uses rmd export --format graph or direct core parser
        out = subprocess.check_output(["rmd", "export", self.file_path, "--format", "canonical"])
        graph = json.loads(out)
        
        docs = []
        for anno in graph.get("annotations", []):
            docs.append(Document(
                page_content=f"Claim: {anno.get('claim', '')}\nLabel: {anno.get('body', {}).get('label', '')}",
                metadata={
                    "doc_id": graph.get("documentId"),
                    "target_media": anno.get("target"),
                    "selector": anno.get("selector"),
                    "confidence": anno.get("confidence")
                }
            ))
        return docs
```

---

### Deliverable B: Visual Drag-and-Drop Reticle in Web Studio

* **Interaction Flow:**
  1. User selects an image or video in `@rmd/playground`.
  2. Toggle **"Annotate Mode"** (`Alt + Drag` or Reticle Tool).
  3. User clicks and drags over a region of interest.
  4. Playground calculates scaled pixel coordinates `[x, y, width, height]`.
  5. Studio auto-generates and inserts a new `rmd:annotation` block at the cursor in the Markdown editor:
     ```yaml
     ```rmd:annotation
     id: anno:custom-feature-01
     target: media:current-image
     type: note
     selector:
       type: xywh
       unit: pixel
       x: 420
       y: 310
       width: 180
       height: 140
     body:
       label: "New Identified Feature"
     claim: "Observed feature at bounded region."
     confidence: 0.95
     source: human
     ```
     ```
