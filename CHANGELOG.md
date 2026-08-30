# Changelog

All notable changes to the Rich Media Document Standard and its reference implementations are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-30

### Added
* **Pure-Python Zero-Dependency Parser:** Added `examples/python/rmd_core.py` providing in-memory parsing and node generation without requiring Node.js or PyYAML.
* **Interactive Standalone HTML Reports:** Upgraded `rmd export --format html` with bidirectional table/SVG hover synchronization, click-to-focus navigation, and responsive pan/zoom controls.
* **Automated CLI Remediation (`--fix`):** Enhanced `rmd validate --fix` to automatically repair missing frontmatter, sanitize invalid block IDs, upgrade insecure HTTP links, and infer missing media MIME types.
* **Batch YOLO Dataset Ingestion:** Upgraded `rmd import --format yolo` to support full dataset directories with `--classes` mapping (`classes.txt` or `data.yaml`).
* **Visual Canvas Taxonomy Presets & Handles:** Added 1-click classification presets (Defect, Object, OCR, Redaction, Landmark) and corner anchor handles in `@rmd/playground`.
* **LangChain & LlamaIndex Agent Adapters:** Added `RMDDocumentLoader` and `RMDQueryRetriever` in TypeScript (`@rmd/core/adapters`) and native Python loaders.
* **Actionable CLI Diagnostic Remediation:** Enhanced `rmd validate` to output formatted remediation guidance and example fixes.
* **Computer Vision & Web Exporters:** Added COCO JSON, GeoJSON, and HTML report export formats.

---

## [0.1.0] - 2026-08-17

### Added
* Initial public release of the **Rich Media Document (RMD) Standard Specification (v0.1)**.
* Reference parser, lexer, AST generator, and query engine in `@rmd/core`.
* Ingestion, validation, compilation, and benchmark CLI in `@rmd/cli`.
* Interactive web studio and progressive retrieval playground in `@rmd/playground`.
* W3C `xywh` spatial and temporal selector models.
* C2PA Content Credentials provenance integration.
* Automated multi-modal ingestion pipeline (`rmd ingest`).
* Canonical serialization algorithm for byte-exact digital signatures.
* Formal JSON Schemas for Document AST and raw YAML source code blocks.
* Comprehensive reproducible benchmark harness with token savings math.
