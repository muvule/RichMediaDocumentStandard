# Accessibility (a11y) & Internationalization (i18n) Guide

**Standard:** Rich Media Document (`.rmd`)  

---

## 1. Accessibility Standards (WCAG 2.1 AA Compliance)

RMD documents are designed to be accessible to screen readers, keyboard-only navigators, and assistive technologies.

### 1.1 Textual Fallbacks for Visual & Temporal Selectors
Every spatial and temporal selector MUST have a natural-language description:
* For `rmd:media`: Provide `captions`, `transcript`, and `understanding.summary`.
* For `rmd:annotation`: Provide `claim` and `body.text`. When a screen reader navigates to an `xywh` bounding box or video timestamp, it announces the `claim` rather than raw coordinate numbers.

### 1.2 Contrast & Interactive Reticles in RMD Viewers
* SVG bounding box reticles MUST provide at least a **4.5:1 contrast ratio** against both light and dark media backgrounds (accomplished via high-contrast outer stroke borders).
* Keyboard navigation MUST support `Tab` cycling through annotations and `Space` / `Enter` to focus the corresponding media frame or bounding box.

---

## 2. Internationalization (i18n)

### 2.1 Document Language Tagging
Declare the primary language in the frontmatter using standard **IETF BCP 47** language codes:
```yaml
---
rmd: 0.1
id: doc:tokyo-metro-inspection-2026
title: 東京メトロ構造物定期点検報告書
language: ja-JP
---
```

### 2.2 Multi-Lingual Annotations & Captions
When authoring multi-lingual reports:
1. Provide localized WebVTT captions in `rmd:media`:
   ```yaml
   captions:
     en: ./captions-en.vtt
     es: ./captions-es.vtt
     ja: ./captions-ja.vtt
   ```
2. Annotations can include multi-lingual claim translations:
   ```yaml
   ```rmd:annotation
   id: anno:cracked-revetment
   target: media:station-camera-01
   claim:
     en: "Stress crack detected on column 4."
     ja: "第4支柱にひび割れが検出されました。"
   ```
   ```
