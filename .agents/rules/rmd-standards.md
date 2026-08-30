---
description: Governance, attribution, cryptographic realism, and code quality invariants for the Rich Media Document Standard repository.
globs: ["**/*"]
always_on: true
---

# RMD Repository Governance & Specification Rules

## 1. Ownership & Attribution
* Sole author, maintainer, and copyright holder: **`muvule`** (https://github.com/muvule/RichMediaDocumentStandard).
* License: **Apache 2.0**.
* Never reference personal names or generic placeholder teams ("RMD Project Contributors") in copy, docs, or citations.

## 2. Specification & Cryptographic Invariants
* **Strict Schema Conformance:** All `.rmd` examples across `README.md`, `docs/`, and `examples/` must be 100% compliant with `schemas/rmd-source-blocks.schema.json` and Zod validators (`kind: image`, `mime: image/jpeg`, W3C `xywh` with `unit: pixel`).
* **Realistic Hashes:** Never use the empty-string SHA-256 hash (`e3b0c442...`). Always provide authentic content digests.
* **ID Grammar:** All block IDs must conform to `^[a-zA-Z0-9_\-.:]+$` with recommended prefixes (`doc:`, `media:`, `anno:`, `sem:`, `prov:`).

## 3. Code Quality & Formatting
* Preserve zero-dependency architectures in `@rmd/core`.
* Maintain 100% client-side privacy in `@rmd/playground` (zero remote telemetry or uploads).
* Write clean systems engineering comments without AI generator markers.
