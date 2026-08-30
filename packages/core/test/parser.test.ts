import { describe, it, expect } from 'vitest';
import { parseRMD } from '../src/parser.js';
import { toAgentGraph } from '../src/graph.js';
import { MediaASTNode, AnnotationASTNode } from '../src/types.js';

describe('RMD Parser', () => {
  it('should parse valid frontmatter and standard markdown', () => {
    const source = `---
rmd: 0.1
id: doc:test-01
title: Test Document
---

# Hello World
This is standard markdown.
`;
    const doc = parseRMD(source);
    expect(doc.frontMatter.id).toBe('doc:test-01');
    expect(doc.frontMatter.title).toBe('Test Document');
    expect(doc.frontMatter.rmd).toBe('0.1');
    expect(doc.nodes.length).toBe(1);
    expect(doc.nodes[0].type).toBe('rmd.markdown');
    expect(doc.diagnostics.length).toBe(0);
  });

  it('should parse rmd:media and rmd:annotation blocks with exact source ranges', () => {
    const source = `---
rmd: 0.1
id: doc:test-02
title: Media Test
---

\`\`\`rmd:media
id: test-video-01
kind: video
src: ./test.mp4
mime: video/mp4
duration: 120.0
\`\`\`

\`\`\`rmd:annotation
id: ann-01
target: test-video-01
type: evidence
selector:
  type: temporal
  start: 10.0
  end: 25.0
claim: "Action occurred between 10s and 25s."
confidence: 0.95
source: verified
\`\`\`
`;
    const doc = parseRMD(source);
    expect(doc.nodes.length).toBe(2);
    expect(doc.nodes[0].type).toBe('rmd.media');
    expect(doc.nodes[1].type).toBe('rmd.annotation');

    const media = doc.nodes[0] as MediaASTNode;
    expect(media.attrs.id).toBe('test-video-01');
    expect(media.attrs.kind).toBe('video');
    expect(media.attrs.duration).toBe(120.0);

    const ann = doc.nodes[1] as AnnotationASTNode;
    expect(ann.attrs.id).toBe('ann-01');
    expect(ann.attrs.target).toBe('test-video-01');
    expect(ann.attrs.selector?.type).toBe('temporal');
    expect(ann.attrs.confidence).toBe(0.95);

    // Verify source range offsets are accurate
    expect(media.range.start.line).toBe(7);
    expect(media.range.end.line).toBe(13);
  });

  it('should support JSON payloads inside rmd blocks', () => {
    const source = `---
rmd: 0.1
id: doc:json-test
title: JSON Test
---

\`\`\`rmd:media
{
  "id": "img-01",
  "kind": "image",
  "src": "./photo.jpg",
  "mime": "image/jpeg",
  "width": 1920,
  "height": 1080
}
\`\`\`
`;
    const doc = parseRMD(source);
    expect(doc.nodes.length).toBe(1);
    const media = doc.nodes[0] as MediaASTNode;
    expect(media.attrs.id).toBe('img-01');
    expect(media.attrs.width).toBe(1920);
    expect(media.attrs.height).toBe(1080);
    expect(doc.diagnostics.length).toBe(0);
  });

  it('should preserve unknown rmd extension blocks (Rule C)', () => {
    const source = `---
rmd: 0.1
id: doc:ext-test
title: Extension Test
---

\`\`\`rmd:custom-sensor-stream
sensorId: lidar-lidar-09
frequencyHz: 20
\`\`\`
`;
    const doc = parseRMD(source);
    expect(doc.nodes.length).toBe(1);
    expect(doc.nodes[0].type).toBe('rmd.extension');
    expect((doc.nodes[0] as any).subtype).toBe('custom-sensor-stream');
    expect((doc.nodes[0] as any).attrs.sensorId).toBe('lidar-lidar-09');
  });

  it('should recover gracefully and record diagnostics on malformed blocks', () => {
    const source = `---
rmd: 0.1
id: doc:malformed-test
title: Malformed Test
---

\`\`\`rmd:media
id: broken-media
kind: invalid_kind_here
src: ./test.mp4
\`\`\`
`;
    const doc = parseRMD(source);
    expect(doc.nodes.length).toBe(1);
    expect(doc.diagnostics.length).toBeGreaterThan(0);
    const err = doc.diagnostics.find((d) => d.code === 'ERR_SCHEMA_VALIDATION');
    expect(err).toBeDefined();
  });
});
