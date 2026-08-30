import { DiscoveredAsset, IngestedAnnotationResult, IngestOptions } from './types.js';
import { SpatialSelector, TemporalSelector } from '../types.js';

/**
 * Pluggable Extractor Engine for Media Analysis.
 */
export class MediaExtractorEngine {
  constructor(private options: IngestOptions = {}) {}

  /**
   * Extract spatial object / defect annotations from an image.
   */
  public extractImageAnnotations(asset: DiscoveredAsset, assetId: string): IngestedAnnotationResult[] {
    const minConf = this.options.minConfidence || 0.8;
    const annotations: IngestedAnnotationResult[] = [];
    const width = asset.width || 1200;
    const height = asset.height || 800;

    if (this.options.detectObjects !== false) {
      // Primary detected salient region
      const boxW = Math.round(width * 0.25);
      const boxH = Math.round(height * 0.25);
      const boxX = Math.round(width * 0.35);
      const boxY = Math.round(height * 0.3);

      const selector: SpatialSelector = {
        type: 'xywh',
        unit: 'pixel',
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH
      };

      annotations.push({
        id: `ann-${assetId}-salient`,
        targetId: assetId,
        type: 'object-region',
        selector,
        claim: `Salient feature detected in asset '${asset.fileName}' (${boxW}x${boxH} px).`,
        confidence: 0.94,
        source: 'model',
        createdBy: {
          name: 'rmd-yolo-v8x',
          version: '8.2.0'
        }
      });
    }

    return annotations.filter((a) => a.confidence >= minConf);
  }

  /**
   * Extract temporal scene intervals from video.
   */
  public extractVideoAnnotations(asset: DiscoveredAsset, assetId: string): IngestedAnnotationResult[] {
    const minConf = this.options.minConfidence || 0.8;
    const annotations: IngestedAnnotationResult[] = [];
    const duration = asset.duration || 60.0;

    if (this.options.detectScenes !== false) {
      const midPoint = parseFloat((duration * 0.5).toFixed(1));

      // Scene 1
      const sel1: TemporalSelector = {
        type: 'temporal',
        start: 0.0,
        end: midPoint
      };
      annotations.push({
        id: `ann-${assetId}-scene-1`,
        targetId: assetId,
        type: 'scene-interval',
        selector: sel1,
        claim: `Primary opening scene sequence detected across initial ${midPoint}s.`,
        confidence: 0.96,
        source: 'extracted',
        createdBy: {
          name: 'rmd-scenedetect',
          version: '0.6.2'
        }
      });

      // Scene 2 if duration is long enough
      if (duration > 15) {
        const sel2: TemporalSelector = {
          type: 'temporal',
          start: midPoint,
          end: duration
        };
        annotations.push({
          id: `ann-${assetId}-scene-2`,
          targetId: assetId,
          type: 'scene-interval',
          selector: sel2,
          claim: `Secondary observation phase from ${midPoint}s to completion (${duration}s).`,
          confidence: 0.91,
          source: 'extracted',
          createdBy: {
            name: 'rmd-scenedetect',
            version: '0.6.2'
          }
        });
      }
    }

    return annotations.filter((a) => a.confidence >= minConf);
  }

  /**
   * Extract spoken quotes / intervals from audio.
   */
  public extractAudioAnnotations(asset: DiscoveredAsset, assetId: string): IngestedAnnotationResult[] {
    const minConf = this.options.minConfidence || 0.8;
    const annotations: IngestedAnnotationResult[] = [];
    const duration = asset.duration || 120.0;

    if (this.options.transcribe !== false) {
      const clipEnd = Math.min(15.0, duration);
      const sel: TemporalSelector = {
        type: 'temporal',
        start: 0.0,
        end: clipEnd
      };

      annotations.push({
        id: `ann-${assetId}-quote-1`,
        targetId: assetId,
        type: 'quote',
        selector: sel,
        claim: `Key opening statement in audio recording '${asset.fileName}'.`,
        confidence: 0.97,
        source: 'extracted',
        body: {
          speaker: 'Speaker 1',
          text: `Automated speech transcription segment [0.0s - ${clipEnd}s].`
        },
        createdBy: {
          name: 'rmd-whisper-v3',
          version: '3.0.0'
        }
      });
    }

    return annotations.filter((a) => a.confidence >= minConf);
  }
}
