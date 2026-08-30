# Migration Guide

**Standard:** Rich Media Document (`.rmd`)  

---

## 1. Migrating from Plain GFM / CommonMark

In standard Markdown, media is an opaque link:
```markdown
<!-- Before: Standard GFM -->
# Solar Panel Anomaly
![Thermal Scan](./photos/roof-01.jpg)
```

In RMD, declare the media manifest and attach structured spatial annotations:
```markdown
<!-- After: RMD -->
# Solar Panel Anomaly

```rmd:media
id: media:roof-01
kind: image
src: ./photos/roof-01.jpg
mime: image/jpeg
width: 4000
height: 3000
```

```rmd:annotation
id: anno:hotspot-b12
target: media:roof-01
type: defect
selector:
  type: xywh
  unit: pixel
  x: 1420
  y: 880
  width: 240
  height: 190
claim: "Hotspot detected on Module B12."
confidence: 0.95
source: verified
```
```

---

## 2. Migrating from W3C Web Annotation (JSON-LD)

Convert JSON-LD `oa:Annotation` objects into plain-text `rmd:annotation` blocks:

```json
// Before: W3C Web Annotation JSON-LD
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "id": "http://example.org/anno1",
  "type": "Annotation",
  "target": {
    "source": "http://example.org/image1.jpg",
    "selector": {
      "type": "FragmentSelector",
      "conformsTo": "http://www.w3.org/TR/media-frags/",
      "value": "xywh=100,200,300,400"
    }
  },
  "body": {
    "type": "TextualBody",
    "value": "Thermal anomaly"
  }
}
```

```markdown
<!-- After: RMD Block -->
```rmd:annotation
id: anno:w3c-anno1
target: media:image1
type: annotation
selector:
  type: xywh
  unit: pixel
  x: 100
  y: 200
  width: 300
  height: 400
body: "Thermal anomaly"
```
```
