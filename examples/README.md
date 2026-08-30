# Multi-Modal Evidence Showcase

This folder contains reference `.rmd` documents demonstrating how different rich media modalities are indexed into **smallest useful evidence units**:

---

## 1. `image-report.rmd` (High-Resolution Image Inspection)
* **Use Case:** Commercial rooftop solar panel drone photogrammetry.
* **Smallest Useful Evidence Unit:** Spatial bounding box (`xywh = 440, 530, 220, 60 px`) targeting a single photovoltaic cell micro-fracture and barcode serial string (`SN-PV-99482-B12`).
* **Savings:** Delivers a 220x60 crop instead of re-sending the full 18MB high-res orthomosaic.

---

## 2. `video-field-report.rmd` (4K Aerial Drone Video)
* **Use Case:** Coastal erosion cliff collapse post-storm field survey.
* **Smallest Useful Evidence Unit:** 37.8-second temporal interval (`start: 38.4s, end: 76.2s`) paired with C2PA provenance and a geological retreat claim.
* **Savings:** Streams a 37-second slice instead of transferring 1.4GB of raw 4K video.

---

## 3. `podcast-note.rmd` (Multi-Channel Audio)
* **Use Case:** Multimodal AI podcast conversation recording.
* **Smallest Useful Evidence Unit:** Speaker-diarized timestamp transcript slice (`start: 142.5s, end: 188.0s`) with speaker attribution and claim tags.

---

## 4. `agent-workflow.rmd` (Structured Agent Directive & Schemas)
* **Use Case:** Autonomous insurance claims damage evaluation pipeline.
* **Smallest Useful Evidence Unit:** Strict JSON output schema constraints (`$defs/damageClaimOutput`), budget limits (`maxEvidenceSlices: 5`), and minimum confidence bounds (`0.85`).
