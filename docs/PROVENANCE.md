# Cryptographic Integrity & C2PA Provenance

**Standard:** Rich Media Document (`.rmd`)  

---

## 1. Overview

In forensic, industrial, legal, and intelligence workflows, autonomous agents cannot trust media without verified provenance. RMD establishes a multi-layered trust fabric:

```
┌────────────────────────────────────────────────────────┐
│  Layer 1: SHA-256 Byte-Exact Content Hashing           │
│  Guarantees byte integrity against silent tampering    │
├────────────────────────────────────────────────────────┤
│  Layer 2: C2PA Content Credentials (JUMBF Manifest)    │
│  Hardware signature & edit history from sensor/camera  │
├────────────────────────────────────────────────────────┤
│  Layer 3: RMD Provenance Graph (rmd:provenance)        │
│  Explicit transformation history & model lineage       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layer 1: SHA-256 Ingestion Verification

When media is ingested via `rmd ingest` or referenced in `rmd:media`:
1. The CLI computes the SHA-256 digest of the raw media asset.
2. The 64-hex hash is stored in `media.sha256`.
3. When an agent or validator verifies the document (`rmd validate`), it re-computes the hash of the local asset and flags `ERR_SHA256_MISMATCH` if the file has been altered.

---

## 3. Layer 2: C2PA Trust Fabric Integration

The Coalition for Content Provenance and Authenticity (C2PA) embeds cryptographic claims directly into media containers using JUMBF boxes.

RMD references and validates C2PA manifests:
```yaml
```rmd:media
id: media:bodycam-raw
kind: video
src: ./assets/incident-video.mp4
mime: video/mp4
sha256: 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945
provenance:
  c2pa: ./assets/incident-video.c2pa.json
```

```rmd:provenance
id: prov:bodycam-audit
target: media:bodycam-raw
creator: "Axon Body 4 Hardware Security Module"
license: "Restricted Evidence"
c2pa: ./assets/incident-video.c2pa.json
history:
  - action: captured
    at: "2026-08-17T09:15:00Z"
    actor: "Officer J. Doe (Badge #482)"
  - action: ingested
    at: "2026-08-17T11:30:00Z"
    actor: "RMD Automated Evidence Ingest Worker v0.1"
```
```

`@rmd/core` provides `inspectC2PAManifest(manifest)` to verify cryptographic issuers, timestamps, and assertion chains.
