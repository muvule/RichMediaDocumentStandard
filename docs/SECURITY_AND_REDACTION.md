# Security & Media Redaction Guidelines

**Standard:** Rich Media Document (`.rmd`)  

---

## 1. Zero-Trust Multimodal Security Architecture

When exposing rich media documents to third-party LLMs and automated agent tools, security and privacy are critical.

### 1.1 Air-Gapped Local Processing
* The `@rmd/playground` and `@rmd/cli` reference implementations perform **100% client-side parsing**.
* Media files are never transmitted to unverified remote servers without explicit configuration.

### 1.2 Script Injection Protections
* The RMD parser and validator strictly forbid inline `<script>` tags (`ERR_SCRIPT_INJECTION`).
* In web viewers, all Markdown is rendered using React/DOM escaped text nodes, preventing XSS.

---

## 2. Media Redaction Standard (`type: redaction`)

Enterprise compliance (GDPR, HIPAA, FERPA) mandates masking sensitive identifiers (faces, license plates, medical PII) before sending crops to multimodal LLMs.

### 2.1 Spatial Redaction
```yaml
```rmd:annotation
id: anno:pii-face-blur-01
target: media:bodycam-footage
type: redaction
selector:
  type: xywh
  unit: pixel
  x: 540
  y: 220
  width: 120
  height: 140
body:
  action: blur
  radius: 25
  reason: "Bystander facial privacy (GDPR Art. 9 compliance)"
source: verified
```
```

### 2.2 Temporal Audio Redaction
```yaml
```rmd:annotation
id: anno:ssn-audio-mute
target: media:call-recording
type: redaction
selector:
  type: temporal
  start: 114.2
  end: 118.5
body:
  action: silence
  reason: "Credit card / SSN disclosure masking"
source: extracted
```
```

---

## 3. Pre-Ingest EXIF & Telemetry Sanitization

When publishing public RMD documents:
1. Strip GPS coordinates from EXIF tags unless explicitly needed for spatial mapping.
2. Replace local file absolute paths with relative paths (`./assets/photo.jpg`) or content-addressed storage (IPFS / S3).
