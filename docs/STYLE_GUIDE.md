# RMD Authoring & Style Guide

**Goal:** Maintain a clean, human-readable Markdown reading experience while embedding rich machine-readable metadata.

---

## 1. Document Structure & Layout

### 1.1 Frontmatter at the Top
Always declare document metadata in YAML frontmatter at line 1:
```yaml
---
rmd: 0.1
id: doc:my-survey-2026
title: Field Survey and Anomaly Report
language: en
license: CC-BY-4.0
tags: [inspection, drone, solar]
---
```

### 1.2 Narrative-First Ordering
Write the human-readable executive summary and narrative **before** or alongside the typed blocks:
```markdown
# Section Heading

Human narrative describing the context, mission background, and conclusions.

```rmd:media
id: media:survey-photo
kind: image
src: ./assets/survey.jpg
mime: image/jpeg
width: 4000
height: 3000
```

Detailed observation paragraph referencing the image above.

```rmd:annotation
id: anno:cracked-cell
target: media:survey-photo
type: defect
selector:
  type: xywh
  unit: pixel
  x: 520
  y: 640
  width: 180
  height: 120
claim: "Fracture along busbar on Module 4."
confidence: 0.96
source: verified
```
```

---

## 2. Formatting Guidelines

### 2.1 Indentation & Cleanliness
* Use **2 spaces** for indentation inside YAML fences. Never use tabs.
* Keep block attribute keys lowercase and camelCase for nested properties.
* Sort top-level keys logically: `id`, `target`, `type`, `selector`, `body`, `claim`, `confidence`, `source`.

### 2.2 IDs & Slugs
* Use kebab-case for slugs: `media:drone-pass-02`, `anno:thermal-leak-01`.
* Keep IDs concise, descriptive, and unique across the document.

### 2.3 Claims & Assertions
* Every `rmd:annotation` should include a concise `claim` string written in clear natural language.
* Good: `claim: "Active bluff collapse exposing uncompacted sandstone between 38.4s and 76.2s."`
* Bad: `claim: "look here"`
