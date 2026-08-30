# Rich Media Document (RMD) Specification v0.1

**Status:** Official Open Standard Specification (v0.1)  
**Editor:** muvule  
**License:** Apache 2.0  

---

## 1. Abstract

Rich Media Document (`.rmd`) is an open, plain-text, Git-diffable standard designed specifically for **multimodal AI agents** and human authors. It enriches CommonMark / GitHub Flavored Markdown (GFM) with typed metadata blocks that provide deterministic spatial, temporal, semantic, and cryptographic grounding over external multi-gigabyte media assets (images, 4K video, multichannel audio, 3D point clouds).

---

## 2. Document Grammar & Structure

An `.rmd` document is a UTF-8 encoded plain-text file consisting of two primary structures:
1. **YAML Frontmatter:** Delimited by opening and closing `---` triple hyphens at the top of the file.
2. **Document Body:** Standard CommonMark prose interleaved with typed fenced code blocks of the form ````rmd:<block-type> ... ````.

```
┌────────────────────────────────────────────────────────┐
│ ---                                                    │
│ rmd: 0.1                                               │
│ id: doc:<slug>                                         │
│ title: <Document Title>                                │
│ ...                                                    │
│ ---                                                    │
├────────────────────────────────────────────────────────┤
│ # Markdown Heading                                     │
│                                                        │
│ Standard human-readable narrative text.                │
│                                                        │
│ ```rmd:media                                           │
│ id: media:<slug>                                       │
│ kind: image | video | audio | document | dataset | 3d  │
│ src: <URI | Path>                                      │
│ mime: <MIME-Type>                                      │
│ sha256: <64-hex digest>                                │
│ ```                                                    │
│                                                        │
│ ```rmd:annotation                                      │
│ id: anno:<slug>                                        │
│ target: media:<slug>                                   │
│ type: <classification>                                 │
│ selector:                                              │
│   type: xywh | temporal | text-range | composite       │
│ body: <content | object>                               │
│ claim: <atomic natural language assertion>             │
│ confidence: 0.0 - 1.0                                  │
│ source: human | model | extracted | verified           │
│ ```                                                    │
└────────────────────────────────────────────────────────┘
```

---

## 3. ID Grammar & Namespace Conventions

All identifiers (`id` and `target`) MUST conform to the standard identifier regular expression:

$$\text{ID Pattern: } \texttt{\textasciicircum[a-zA-Z0-9\_\textbackslash-.:]+\$}$$

### Recommended Namespace Prefixes:
* **Documents:** `doc:<slug>` (e.g. `doc:solar-roof-inspection-2026`)
* **Media Assets:** `media:<slug>` or `<kind>-<slug>` (e.g. `media:drone-ortho-01`, `video-shoreline-survey`)
* **Evidence Annotations:** `anno:<slug>` or `ann-<slug>` (e.g. `anno:hotspot-panel-b12`)
* **Semantic Summaries:** `sem:<slug>` or `sem-<slug>`
* **Provenance Manifests:** `prov:<slug>` or `prov-<slug>`
* **Agent Directives:** `agent:<slug>`
* **Indexes & Embeddings:** `index:<slug>` or `idx-<slug>`

---

## 4. Typed Block Specifications

### 4.1 `rmd:media`
Declares an attached or referenced external media asset.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Yes** | Unique asset identifier. |
| `kind` | `enum` | **Yes** | One of `image`, `video`, `audio`, `document`, `dataset`, `3d`. |
| `src` | `string` | **Yes** | Relative path (`./assets/file.mp4`) or remote HTTPS URL. |
| `mime` | `string` | **Yes** | MIME format (e.g. `image/jpeg`, `video/mp4`, `audio/mpeg`). |
| `sha256` | `string` | Optional | 64-character lowercase hexadecimal cryptographic hash. |
| `byteSize` | `integer` | Optional | Total file size in bytes. |
| `duration` | `number` | Optional | Duration in seconds (video/audio). |
| `width` | `integer` | Optional | Pixel width (image/video). |
| `height` | `integer` | Optional | Pixel height (image/video). |
| `captions` | `string` | Optional | WebVTT captions URI. |
| `transcript` | `string` | Optional | Structured JSON transcript URI. |
| `understanding` | `object` | Optional | High-level summary and scene breakdowns. |
| `retrieval` | `object` | Optional | Priority, preferred evidence types, and embedding references. |

### 4.2 `rmd:annotation`
Defines an anchored claim, bounding box, or temporal evidence slice.

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | `string` | **Yes** | Unique annotation identifier. |
| `target` | `string` | **Yes** | Target media `id` or document `id`. |
| `type` | `string` | **Yes** | Semantic class (e.g. `defect`, `ocr`, `evidence`, `redaction`, `quote`). |
| `selector` | `object` | Optional | Spatial, temporal, or text-range coordinate selector. |
| `body` | `string\|object` | Optional | Extracted payload, OCR label, or structured properties. |
| `claim` | `string` | Optional | Atomic, testable assertion in natural language. |
| `confidence` | `number` | Optional | Float between `0.0` and `1.0`. Required when `source: model`. |
| `source` | `enum` | Optional | One of `human`, `model`, `extracted`, `verified`. |
| `createdBy` | `string\|object` | Optional | Model name/version or surveyor name. |
| `createdAt` | `string` | Optional | ISO-8601 UTC timestamp. |

### 4.3 `rmd:semantic`
Aggregates high-level topic graphs, extracted entities, and OCR/transcript indexes across one or more assets.

### 4.4 `rmd:provenance`
Attaches C2PA Content Credentials manifests, cryptographic signatures, or transformation histories.

### 4.5 `rmd:agent`
Defines strict execution directives, output schemas, and token/slice budgets for autonomous AI agents.

### 4.6 `rmd:index`
Declares multi-modal vector embeddings, spatial quadtrees, or BM25 keyword index artifacts for sub-millisecond retrieval.

---

## 5. Selector Models

RMD extends W3C Media Fragments 1.0 and Web Annotation Data Models:

### 5.1 Spatial Selector (`xywh` / `polygon`)
```yaml
selector:
  type: xywh
  unit: pixel # pixel | percent | normalized
  x: 440
  y: 530
  width: 220
  height: 60
```

### 5.2 Temporal Selector (`temporal`)
```yaml
selector:
  type: temporal
  start: 38.4
  end: 76.2
  timebase: "1/30"
```

### 5.3 Composite Selector (`composite`)
Combines multiple selectors (e.g. tracking a spatial bounding box inside a temporal video interval):
```yaml
selector:
  type: composite
  chain:
    - type: temporal
      start: 12.0
      end: 24.5
    - type: xywh
      unit: pixel
      x: 100
      y: 200
      width: 300
      height: 250
```

---

## 6. Canonical Serialization Algorithm

To enable tamper-evident digital signatures and reproducible byte hashing, `@rmd/core` defines a deterministic serialization algorithm:

1. **Unicode Normalization:** All text must be NFC normalized.
2. **Newline Normalization:** All line breaks are converted to Unix LF (`\n`). Trailing whitespace is stripped.
3. **YAML Key Sorting:** Object dictionary keys within `rmd:*` blocks are sorted lexicographically (`a-z`).
4. **Number Formatting:** Float values are formatted without trailing zeros (e.g. `12.5`, not `12.5000`), with coordinate values capped at 6 decimal places.
5. **Indentation:** Exactly 2 spaces per indentation level. Tabs are forbidden.

---

## 7. Versioning & Backward Compatibility

RMD follows **Semantic Versioning 2.0.0**:
* **`0.X` (Draft Specification):** New optional fields may be introduced. Deprecations provide 1 minor version warning.
* **`1.0` (Stable Standard):** Breaking schema changes will require incrementing the major version. Parsers MUST ignore unrecognized extension blocks (`rmd:custom-*`) and unknown attribute keys without failing.
