# Configuration & Diagnostic Codes

**Standard:** Rich Media Document (`.rmd`)  

---

## 1. Configuration Files (`.rmdrc` / `rmd.config.json`)

The `@rmd/cli` and `@rmd/core` tools discover configuration in the current working directory or user home directory.

### Example `rmd.config.json`:
```json
{
  "specVersion": "0.1",
  "defaultLicense": "Apache-2.0",
  "ingest": {
    "detectObjects": true,
    "detectScenes": true,
    "transcribe": true,
    "minConfidence": 0.80,
    "generateHashes": true,
    "outputDirectory": "./dist"
  },
  "validation": {
    "strict": true,
    "allowInsecureHttp": false,
    "requireSha256": true
  }
}
```

---

## 2. Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `RMD_CONFIG_PATH` | Explicit path to config file | `.rmdrc` / `rmd.config.json` |
| `RMD_CACHE_DIR` | Cache directory for media probing | `~/.rmd/cache` |
| `RMD_MAX_FILE_SIZE` | Max file size in bytes for text parsing | `26214400` (25MB) |
| `RMD_LOG_LEVEL` | Logging verbosity (`debug`, `info`, `warn`, `error`) | `info` |

---

## 3. Diagnostic Code Reference

| Code | Level | Description |
| :--- | :---: | :--- |
| `ERR_MISSING_RMD_VERSION` | Error | Frontmatter lacks required `rmd: 0.1` version. |
| `ERR_MISSING_DOC_ID` | Error | Frontmatter lacks required `id`. |
| `ERR_MISSING_DOC_TITLE` | Error | Frontmatter lacks required `title`. |
| `ERR_DUPLICATE_ID` | Error | An identifier is reused across multiple blocks. |
| `ERR_UNKNOWN_TARGET` | Error | Annotation, semantic, or provenance block targets a non-existent media asset. |
| `ERR_INCOMPATIBLE_SELECTOR` | Error | Using a temporal selector on an image or a spatial selector on audio. |
| `ERR_INVALID_CONFIDENCE_RANGE`| Error | Confidence score is not within `0.0` to `1.0`. |
| `ERR_SCRIPT_INJECTION` | Error | Prohibited `<script>` tag detected in Markdown body. |
| `WARN_INSECURE_MEDIA_URL` | Warning | Media `src` uses unencrypted HTTP instead of HTTPS. |
| `WARN_MISSING_SHA256` | Warning | Remote external media asset lacks a SHA-256 integrity digest. |
| `WARN_UNKNOWN_INDEX_REF` | Warning | Asset or semantic block references an undeclared embedding index. |
| `WARN_SELECTOR_OUT_OF_BOUNDS` | Warning | Temporal selector end timecode exceeds media duration. |
| `WARN_INVALID_ID_SYNTAX` | Warning | ID contains characters outside recommended `[a-zA-Z0-9_\-.:]+` pattern. |
| `WARN_MISSING_MODEL_CONFIDENCE` | Warning | AI model annotation is missing a confidence score. |
