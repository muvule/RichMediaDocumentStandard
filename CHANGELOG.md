# Changelog

All notable changes to the Rich Media Document Standard and its reference implementations are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-30

### Added
* **Interactive Visual Bounding Box Annotator:** In `@rmd/playground`, added mouse click-and-drag reticle drawing on media canvases with responsive coordinate translation, live SVG dashed preview, and automatic `rmd:annotation` block insertion.
* **LangChain & LlamaIndex Agent Adapters:** Added `RMDDocumentLoader` and `RMDQueryRetriever` in TypeScript (`@rmd/core/adapters`) and standalone Python reference scripts in `examples/python/`.
* **Actionable CLI Diagnostic Remediation:** Enhanced `rmd validate` to output human-readable suggestions and copy-pasteable YAML example fixes for validation errors.
* **Computer Vision & Web Exporters / Importers:**
  * `rmd export --format coco`: Exports COCO JSON dataset format.
  * `rmd export --format geojson`: Exports GeoJSON FeatureCollection.
  * `rmd export --format html`: Generates standalone, zero-dependency HTML visual reports with embedded SVG bounding box overlays.
  * `rmd import --format yolo`: Ingests YOLO normalized bounding box text files into valid `.rmd` documents.

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
