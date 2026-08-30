# `@rmd/playground` Interactive Web Studio

The `@rmd/playground` package is an open-source React web studio for visualizing, inspecting, and debugging Rich Media Documents.

---

## 1. Browser Support Matrix

The playground leverages standard Web APIs (HTML5 Video/Audio, Canvas, SVG, Object URLs, CSS Grid):

| Browser | Supported Versions | Notes |
| :--- | :---: | :--- |
| **Google Chrome / Chromium** | 90+ | Full support (Hardware-accelerated video decoding) |
| **Mozilla Firefox** | 88+ | Full support |
| **Apple Safari** | 15+ | Full support (H.264 / H.265 / WebM / MP4) |
| **Microsoft Edge** | 90+ | Full support |

---

## 2. Accessibility & Spatial Reticle Navigation

* **Keyboard Navigation:** Users can press `Tab` to cycle through active bounding box overlays and timecode regions.
* **Screen Reader Integration:** Every spatial box announces its natural-language `claim` and `label` attribute via ARIA live regions.
* **High-Contrast Reticles:** Overlay strokes feature dual-layer borders (high-contrast cyan/emerald with dark outline) ensuring 4.5:1 WCAG contrast against any visual background.

---

## 3. Client-Side Privacy Guarantee

* **100% In-Memory Sandbox:** When a user drops a media file or `.rmd` document into the playground, it is loaded locally using `URL.createObjectURL(file)`.
* **Zero Remote Network Uploads:** Files are never sent to external servers, cloud databases, or third-party telemetry.
