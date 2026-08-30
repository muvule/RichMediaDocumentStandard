import { describe, it, expect } from 'vitest';
import { probeBufferMetadata, synthesizeRMDDocument, DiscoveredAsset } from '../src/ingest';
import { parseRMD } from '../src/parser';
import { validateDocument } from '../src/validators';

describe('RMD Ingestion Pipeline', () => {
  it('should probe PNG buffer metadata and extract dimensions', () => {
    // Construct minimal valid PNG header (8 bytes signature + IHDR chunk)
    const pngHeader = new Uint8Array(33);
    pngHeader.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
    const view = new DataView(pngHeader.buffer);
    view.setUint32(8, 13, false); // IHDR length
    pngHeader.set([0x49, 0x48, 0x44, 0x52], 12); // "IHDR"
    view.setUint32(16, 3840, false); // Width: 3840
    view.setUint32(20, 2160, false); // Height: 2160

    const asset = probeBufferMetadata(pngHeader, '4k_drone_ortho.png', '/tmp/4k_drone_ortho.png', 'assets/4k_drone_ortho.png');
    expect(asset.kind).toBe('image');
    expect(asset.mime).toBe('image/png');
    expect(asset.width).toBe(3840);
    expect(asset.height).toBe(2160);
    expect(asset.sha256).toBeDefined();
  });

  it('should probe audio metadata and calculate durations', () => {
    const fakeMp3 = new Uint8Array(320000); // ~20 seconds at 128kbps
    const asset = probeBufferMetadata(fakeMp3, 'interview.mp3', '/tmp/interview.mp3', 'assets/interview.mp3');
    expect(asset.kind).toBe('audio');
    expect(asset.mime).toBe('audio/mpeg');
    expect(asset.duration).toBeGreaterThanOrEqual(10);
  });

  it('should synthesize multi-asset .rmd documents with grounded evidence anchors', () => {
    const assets: DiscoveredAsset[] = [
      {
        filePath: '/tmp/bridge_drone.jpg',
        relativePath: './assets/bridge_drone.jpg',
        fileName: 'bridge_drone.jpg',
        kind: 'image',
        mime: 'image/jpeg',
        byteSize: 4500120,
        sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        width: 6000,
        height: 4000
      },
      {
        filePath: '/tmp/bridge_survey.mp4',
        relativePath: './assets/bridge_survey.mp4',
        fileName: 'bridge_survey.mp4',
        kind: 'video',
        mime: 'video/mp4',
        byteSize: 154000000,
        sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        duration: 90.0,
        width: 1920,
        height: 1080
      },
      {
        filePath: '/tmp/engineer_notes.mp3',
        relativePath: './assets/engineer_notes.mp3',
        fileName: 'engineer_notes.mp3',
        kind: 'audio',
        mime: 'audio/mpeg',
        byteSize: 8400000,
        sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        duration: 210.0
      }
    ];

    const result = synthesizeRMDDocument(assets, {
      title: 'Infrastructure Bridge Structural Survey 2026',
      detectObjects: true,
      detectScenes: true,
      transcribe: true,
      minConfidence: 0.85
    });

    expect(result.rmdContent).toContain('title: Infrastructure Bridge Structural Survey 2026');
    expect(result.rmdContent).toContain('```rmd:media');
    expect(result.rmdContent).toContain('```rmd:annotation');
    expect(result.rmdContent).toContain('```rmd:semantic');
    expect(result.assets.length).toBe(3);
    expect(result.annotationsCount).toBeGreaterThanOrEqual(4);

    // Validate that the synthesized document passes deterministic RMD validator with 0 errors
    const parsed = parseRMD(result.rmdContent);
    const diagnostics = validateDocument(parsed);
    const errors = diagnostics.filter((d) => d.level === 'error');
    expect(errors.length).toBe(0);
  });
});
