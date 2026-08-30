export interface ExampleDoc {
  id: string;
  name: string;
  kind: string;
  description: string;
  content: string;
}

export const EXAMPLES: ExampleDoc[] = [
  {
    id: 'blank',
    name: 'Blank Document (Custom Upload)',
    kind: 'blank',
    description: 'Empty document ready for your media upload.',
    content: `---
rmd: 0.1
id: doc:my-document
title: My Rich Media Document
language: en
license: CC-BY-4.0
---

# My Rich Media Document

Upload or drop any image, video, or audio file to automatically generate RMD media manifests and evidence anchors.
`
  },
  {
    id: 'image-report',
    name: '1. Rooftop Solar Inspection (Image + Spatial)',
    kind: 'image',
    description: 'Orthomosaic drone photo with spatial bounding box annotations & serial OCR.',
    content: `---
rmd: 0.1
id: doc:solar-roof-inspection-2026
title: Commercial Rooftop Solar Array Inspection
language: en
authors:
  - name: Drone Inspection Team Bravo
    role: Field Surveyor
created: 2026-08-17T09:15:00-07:00
updated: 2026-08-17T11:30:00-07:00
license: CC-BY-4.0
contentType: inspection-report
tags: [solar, drone, thermal, structural, inspection]
defaultMediaPolicy: defer
---

# Commercial Rooftop Solar Array Inspection Report

This inspection report covers the aerial drone photogrammetry and anomaly assessment for Sector 4 of the commercial solar facility. Multiple thermal hotspots and physical micro-fractures were detected during the automated flight pass.

\`\`\`rmd:media
id: roof-ortho-04
kind: image
src: https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1200&q=80
mime: image/jpeg
sha256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
byteSize: 18450200
width: 1200
height: 800
license: CC-BY-4.0
understanding:
  summary: "High-resolution orthomosaic of Sector 4 solar array showing 144 panel modules."
retrieval:
  priority: high
  preferredEvidence: [crop, ocr]
\`\`\`

## Identified Anomalies and Structural Faults

Visual and thermal inspection detected severe surface degradation and micro-fractures on Panel Array B-12.

\`\`\`rmd:annotation
id: ann-damaged-panel-01
target: roof-ortho-04
type: object-region
selector:
  type: xywh
  unit: pixel
  x: 420
  y: 280
  width: 320
  height: 240
body:
  label: micro-fractured-solar-cell
  severity: critical
  temperatureDeltaC: +18.4
claim: "Severe thermal anomaly and glass fracture detected on Module B-12 (Cell 4)."
confidence: 0.97
source: model
createdBy:
  name: solar-defect-detector
  version: 2.4.0
createdAt: 2026-08-17T10:02:00-07:00
\`\`\`

\`\`\`rmd:annotation
id: ann-serial-ocr-01
target: roof-ortho-04
type: text-region
selector:
  type: xywh
  unit: pixel
  x: 440
  y: 530
  width: 220
  height: 60
body:
  label: barcode-serial
  text: "SN-PV-99482-B12"
claim: "Serial barcode identified as SN-PV-99482-B12."
confidence: 0.99
source: extracted
\`\`\`

\`\`\`rmd:semantic
id: sem-roof-analysis-01
target: roof-ortho-04
caption: "Sector 4 solar array with identified cell fracture on Module B-12."
summary: "Defect inspection identified 1 critical module failure (B-12) requiring immediate string isolation and maintenance dispatch."
entities:
  - id: ent-mod-b12
    type: equipment
    label: Photovoltaic Module B-12
    confidence: 0.99
  - id: ent-fracture
    type: defect
    label: Thermal Micro-fracture
    confidence: 0.97
topics: [photovoltaic, hardware-failure, maintenance-dispatch, energy-loss]
relationships:
  - from: ann-damaged-panel-01
    to: ent-mod-b12
    type: affects
model:
  name: pv-analyzer-v3
  version: 3.1.0
source: model
confidence: 0.96
\`\`\`
`
  },
  {
    id: 'video-field-report',
    name: '2. Coastal Erosion Field Survey (Video + Temporal)',
    kind: 'video',
    description: '4K drone survey with scene index, temporal anchors, claims, and C2PA provenance.',
    content: `---
rmd: 0.1
id: doc:coastal-erosion-survey-2026
title: Southern Shoreline Coastal Erosion Field Survey
language: en
authors:
  - name: Dr. Elena Vance
    role: Coastal Geologist
created: 2026-08-17T09:30:00-07:00
updated: 2026-08-17T14:15:00-07:00
license: CC-BY-4.0
contentType: field-survey
tags: [coastal-erosion, drone-survey, sediment-transport, seawall-risk]
defaultMediaPolicy: defer
---

# Southern Shoreline Coastal Erosion Field Survey

Field survey conducted post-storm along the southern bluff perimeter. This document pairs 4K aerial photogrammetry with temporal scene indexes, geological annotations, and C2PA provenance tracking.

\`\`\`rmd:media
id: shoreline-survey-video
kind: video
src: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
mime: video/mp4
sha256: 4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945
byteSize: 1420500000
duration: 596.0
width: 3840
height: 2160
transcript: ./assets/shoreline-survey.transcript.json
license: CC-BY-4.0
provenance:
  c2pa: ./assets/shoreline-survey.c2pa.json
understanding:
  summary: "Comprehensive aerial video pass over southern seawall and active erosion scarp."
  scenes:
    - id: scene-001
      start: 0.0
      end: 38.4
      summary: "Wide flyover of southern concrete seawall foundation."
      entities: [seawall, revetment, high-tide-line]
    - id: scene-002
      start: 38.4
      end: 112.5
      summary: "Detailed orbital scan of the active 12-meter cliff scarp collapse."
      entities: [erosion-scarp, sandstone-collapse, talus-deposit]
    - id: scene-003
      start: 112.5
      end: 240.0
      summary: "Sediment wash-out zone near southern residential access road."
      entities: [sediment-plume, access-road, drainage-culvert]
retrieval:
  priority: high
  preferredEvidence: [scene, temporal-slice, transcript]
\`\`\`

## Critical Geological Observations

During the second orbital pass (38.4s to 112.5s), significant rotational cliff slump was recorded.

\`\`\`rmd:annotation
id: ann-scarp-collapse-01
target: shoreline-survey-video
type: evidence
selector:
  type: temporal
  start: 38.4
  end: 76.2
body: "Primary erosion scarp shows fresh shear fracture with 450 m3 estimated talus loss."
claim: "Active bluff collapse exposing uncompacted sandstone between 38.4s and 76.2s."
confidence: 0.94
source: verified
createdBy:
  name: Dr. Elena Vance
createdAt: 2026-08-17T11:00:00-07:00
\`\`\`

\`\`\`rmd:semantic
id: sem-shoreline-threat-assessment
target: shoreline-survey-video
caption: "Coastal erosion survey identifying critical bluff retreat rate."
summary: "Bluff retreat rate has accelerated to 1.8 meters/year following winter storm events, posing imminent risk to southern perimeter access."
entities:
  - id: ent-bluff-scarp
    type: geological-feature
    label: Torrey Sandstone Bluff Scarp
    confidence: 0.98
topics: [coastal-erosion, infrastructure-risk, bluff-stability, drone-telemetry]
relationships:
  - from: ann-scarp-collapse-01
    to: ent-bluff-scarp
    type: locates
model:
  name: coastal-risk-net
  version: 1.0.4
source: model
confidence: 0.93
\`\`\`

\`\`\`rmd:provenance
id: prov-drone-telemetry-01
target: shoreline-survey-video
creator: Drone Pilot ID #402 (GeoSurvey Corp)
license: CC-BY-4.0
c2pa: ./assets/shoreline-survey.c2pa.json
history:
  - action: captured
    at: 2026-08-17T09:30:00-07:00
    actor: Matrice-300-RTK
  - action: indexed-for-rmd
    at: 2026-08-17T10:45:00-07:00
    actor: rmd-indexer-v0.1
\`\`\`
`
  },
  {
    id: 'podcast-note',
    name: '3. Podcast Notes (Audio + Diarization)',
    kind: 'audio',
    description: 'Audio podcast with speaker entities, quote intervals, and topic anchors.',
    content: `---
rmd: 0.1
id: doc:ai-systems-podcast-ep42
title: "The Agentic Future Podcast - Ep. 42: Media Formats for Autonomous AI"
language: en
authors:
  - name: Sarah Lin
    role: Host
  - name: Marcus Vance
    role: Guest Architect
created: 2026-08-17T16:00:00-07:00
updated: 2026-08-17T18:00:00-07:00
license: CC-BY-NC-4.0
contentType: podcast-notes
tags: [podcast, ai-agents, multimodal, media-standards, c2pa]
---

# The Agentic Future Podcast — Episode 42

In this episode, Sarah and Marcus discuss why multimodal LLM agents struggle with raw audio/video files and how the RMD standard enables sub-second evidence retrieval.

\`\`\`rmd:media
id: podcast-ep42-audio
kind: audio
src: https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
mime: audio/mpeg
sha256: 4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a
byteSize: 68400120
duration: 372.0
license: CC-BY-NC-4.0
understanding:
  summary: "Discussion of multi-modal agent latency, audio segmentation, and the RMD evidence layer."
retrieval:
  priority: normal
  preferredEvidence: [transcript, audio-slice]
\`\`\`

## Key Discussion Points & Quotes

Marcus explains the core performance bottleneck when feeding 2-hour audio files to multi-modal reasoning models.

\`\`\`rmd:annotation
id: ann-quote-evidence-funnel
target: podcast-ep42-audio
type: quote
selector:
  type: temporal
  start: 42.0
  end: 88.5
body:
  speaker: "Marcus Vance"
  text: "Agents shouldn't re-transcribe or re-decode a 70MB MP3 every time a user asks a factual question. Give the agent an index with typed selectors first."
claim: "Marcus highlights the token and latency inefficiency of repeatedly decoding audio in agent loops."
confidence: 0.98
source: verified
\`\`\`

\`\`\`rmd:semantic
id: sem-podcast-entities
target: podcast-ep42-audio
caption: "Speaker diarization and topic segmentation for Episode 42."
entities:
  - id: ent-speaker-sarah
    type: person
    label: Sarah Lin (Host)
  - id: ent-speaker-marcus
    type: person
    label: Marcus Vance (System Architect)
  - id: ent-concept-rmd
    type: concept
    label: Rich Media Document Standard
topics: [agentic-coding, context-window-optimization, multimodal-inference, c2pa]
source: extracted
\`\`\`
`
  },
  {
    id: 'agent-workflow',
    name: '4. Autonomous Agent Workflow (Schema + Directives)',
    kind: 'agent',
    description: 'Agent directives, output schema contracts, tool hints, and multi-modal evidence link.',
    content: `---
rmd: 0.1
id: doc:agent-reasoning-workflow-demo
title: Autonomous Multi-Modal Agent Workflow Specification
language: en
authors:
  - name: Autonomous Agent Coordinator
    role: System
created: 2026-08-17T18:00:00-07:00
updated: 2026-08-17T18:30:00-07:00
license: Apache-2.0
contentType: agent-workflow
tags: [agent-spec, evidence-retrieval, output-contract, tool-hints]
---

# Autonomous Multi-Modal Agent Workflow

This document specifies retrieval contracts and execution instructions for AI reasoning agents evaluating multi-modal incident reports.

\`\`\`rmd:agent
id: agent-retrieval-policy-01
mode: retrieval
priority: high
instructions:
  - "Always inspect the semantic manifest and scene summaries before requesting raw media byte ranges."
  - "When citing factual claims, always attach the specific temporal or spatial selector ID in your evidence pack."
  - "If confidence of an annotation is below 0.85, flag it as unverified."
tools:
  - "rmd:resolve-evidence-slice"
  - "rmd:search-entities"
  - "rmd:get-transcript-range"
output:
  format: json
  schema: evidence-pack/v1
budget:
  maxEvidenceSlices: 3
  maxContextTokens: 2000
\`\`\`

\`\`\`rmd:schema
id: evidence-pack/v1
type: json-schema
src: ../schemas/evidence-pack.schema.json
description: "Output contract for agent reasoning packs returned to downstream verification pipelines."
\`\`\`

\`\`\`rmd:media
id: incident-security-cam-08
kind: video
src: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4
mime: video/mp4
sha256: 8c3b9911e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b
byteSize: 314000000
duration: 15.0
width: 1920
height: 1080
understanding:
  summary: "Security camera footage of loading bay perimeter gate during weather alert."
\`\`\`

\`\`\`rmd:annotation
id: ann-gate-breach-event
target: incident-security-cam-08
type: security-event
selector:
  type: temporal
  start: 4.2
  end: 11.8
body:
  severity: warning
  eventType: perimeter-door-unlatched
claim: "Loading bay perimeter door was blown unlatched between 4.2s and 11.8s."
confidence: 0.96
source: model
\`\`\`
`
  }
];
