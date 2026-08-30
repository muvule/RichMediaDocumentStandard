# Changelog

All notable changes to the Rich Media Document Standard and its reference implementations are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
