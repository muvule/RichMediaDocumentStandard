import {
  RMDDocument,
  AgentGraph,
  MediaBlockAttrs,
  AnnotationBlockAttrs,
  SemanticBlockAttrs,
  EvidenceSlice,
  PromptContextOptions,
  ByteSavingsMetrics
} from './types.js';
import { toAgentGraph } from './graph.js';
import { formatSelector } from './selectors.js';

export class RMDQueryEngine {
  private doc: RMDDocument;
  private graph: AgentGraph;
  private assetMap: Map<string, MediaBlockAttrs>;
  private annotationMap: Map<string, AnnotationBlockAttrs>;
  private semanticMap: Map<string, SemanticBlockAttrs>;

  constructor(doc: RMDDocument) {
    this.doc = doc;
    this.graph = toAgentGraph(doc);
    this.assetMap = new Map(this.graph.assets.map((a) => [a.id, a]));
    this.annotationMap = new Map(this.graph.annotations.map((a) => [a.id, a]));
    this.semanticMap = new Map(this.graph.semantic.map((s) => [s.id, s]));
  }

  getGraph(): AgentGraph {
    return this.graph;
  }

  getDocumentMetadata() {
    return this.graph.document;
  }

  getAssets(): MediaBlockAttrs[] {
    return this.graph.assets;
  }

  getAsset(id: string): MediaBlockAttrs | undefined {
    return this.assetMap.get(id);
  }

  getAnnotations(targetId?: string): AnnotationBlockAttrs[] {
    if (!targetId) return this.graph.annotations;
    return this.graph.annotations.filter((a) => a.target === targetId);
  }

  getAnnotation(id: string): AnnotationBlockAttrs | undefined {
    return this.annotationMap.get(id);
  }

  getSemanticBlocks(targetId?: string): SemanticBlockAttrs[] {
    if (!targetId) return this.graph.semantic;
    return this.graph.semantic.filter((s) => s.target === targetId);
  }

  /**
   * Resolve an annotation into a minimal evidence unit (temporal slice, spatial region, or text span).
   */
  resolveEvidenceSlice(annotationId: string): EvidenceSlice | null {
    const ann = this.annotationMap.get(annotationId);
    if (!ann) return null;

    const asset = this.assetMap.get(ann.target);
    const assetKind = asset?.kind ?? 'video';
    const assetSrc = asset?.src ?? './unknown';
    const summary = (asset?.understanding as { summary?: string })?.summary;

    return {
      annotationId: ann.id,
      targetAssetId: ann.target,
      assetKind,
      assetSrc,
      selector: ann.selector,
      claim: ann.claim,
      body: ann.body,
      confidence: ann.confidence,
      source: ann.source,
      mediaSummary: summary
    };
  }

  /**
   * Search annotations, scenes, OCR, and semantic entities for evidence matching a query.
   */
  findEvidence(query: string): EvidenceSlice[] {
    const q = query.toLowerCase().trim();
    const results: EvidenceSlice[] = [];

    for (const ann of this.graph.annotations) {
      let matchScore = 0;
      const claimText = (ann.claim ?? '').toLowerCase();
      const bodyText = typeof ann.body === 'string' ? ann.body.toLowerCase() : JSON.stringify(ann.body ?? '').toLowerCase();

      if (claimText.includes(q)) matchScore += 2;
      if (bodyText.includes(q)) matchScore += 1;

      // Check target asset understanding
      const asset = this.assetMap.get(ann.target);
      if (asset?.understanding) {
        const undText = JSON.stringify(asset.understanding).toLowerCase();
        if (undText.includes(q)) matchScore += 1;
      }

      if (matchScore > 0) {
        const slice = this.resolveEvidenceSlice(ann.id);
        if (slice) results.push(slice);
      }
    }

    return results;
  }

  /**
   * Build a token-budgeted prompt context string for injecting directly into LLM prompts.
   */
  toPromptContext(options: PromptContextOptions = {}): string {
    const lines: string[] = [];
    lines.push(`### RMD Document: ${this.graph.document.title} (ID: ${this.graph.document.id})`);
    if (this.graph.document.tags && this.graph.document.tags.length > 0) {
      lines.push(`Tags: ${this.graph.document.tags.join(', ')}`);
    }

    // Media manifests summary
    lines.push(`\n#### Media Assets Manifest:`);
    for (const asset of this.graph.assets) {
      const durationStr = asset.duration ? ` | Duration: ${asset.duration}s` : '';
      const dimStr = asset.width && asset.height ? ` | Resolution: ${asset.width}x${asset.height}` : '';
      const sizeStr = asset.byteSize ? ` | Size: ${(asset.byteSize / (1024 * 1024)).toFixed(2)} MB` : '';
      lines.push(`- **[${asset.kind.toUpperCase()}]** \`${asset.id}\` (${asset.mime}${durationStr}${dimStr}${sizeStr})`);
      
      const und = asset.understanding as { summary?: string; scenes?: Array<{ id: string; start: number; end: number; summary: string }> } | undefined;
      if (und?.summary) {
        lines.push(`  *Summary:* ${und.summary}`);
      }
      if (und?.scenes && und.scenes.length > 0) {
        lines.push(`  *Indexed Scenes:*`);
        for (const sc of und.scenes) {
          lines.push(`    - Scene \`${sc.id}\` [${sc.start}s - ${sc.end}s]: ${sc.summary}`);
        }
      }
    }

    // Annotations & Evidence
    lines.push(`\n#### Grounded Evidence & Annotations:`);
    for (const ann of this.graph.annotations) {
      const selectorStr = ann.selector ? ` | Selector: ${formatSelector(ann.selector)}` : '';
      const confStr = ann.confidence !== undefined ? ` (conf: ${(ann.confidence * 100).toFixed(0)}%)` : '';
      const claimStr = ann.claim ? ` "${ann.claim}"` : '';
      lines.push(`- **[\`${ann.id}\`]** Target: \`${ann.target}\`${selectorStr}${confStr}${claimStr}`);
      if (ann.body && typeof ann.body === 'string') {
        lines.push(`  *Details:* ${ann.body}`);
      }
    }

    // Semantic Topics and Entities
    if (this.graph.semantic.length > 0) {
      lines.push(`\n#### Semantic Topics & Entities:`);
      for (const sem of this.graph.semantic) {
        if (sem.topics && sem.topics.length > 0) {
          lines.push(`- Topics: ${sem.topics.join(', ')}`);
        }
        if (sem.entities && sem.entities.length > 0) {
          lines.push(`- Entities: ${sem.entities.map((e) => `${e.label} [${e.type || 'entity'}]`).join(', ')}`);
        }
      }
    }

    // Agent Directives if present
    if (this.graph.agentDirectives.length > 0) {
      lines.push(`\n#### Agent Instructions & Retrieval Hints:`);
      for (const ad of this.graph.agentDirectives) {
        if (ad.instructions) {
          for (const ins of ad.instructions) {
            lines.push(`- *Guideline:* ${ins}`);
          }
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Calculate byte and token savings achieved by using RMD semantic metadata vs decoding raw media files.
   */
  calculateByteSavings(): ByteSavingsMetrics {
    let totalRawMediaBytes = 0;
    for (const asset of this.graph.assets) {
      if (asset.byteSize) {
        totalRawMediaBytes += asset.byteSize;
      } else {
        // Estimate fallback if byteSize not explicitly declared: 50MB for video, 5MB for audio, 2MB for image
        if (asset.kind === 'video') totalRawMediaBytes += 50 * 1024 * 1024;
        else if (asset.kind === 'audio') totalRawMediaBytes += 10 * 1024 * 1024;
        else if (asset.kind === 'image') totalRawMediaBytes += 3 * 1024 * 1024;
      }
    }

    const metadataBytes = new TextEncoder().encode(this.doc.rawSource).length;
    const bytesSaved = Math.max(0, totalRawMediaBytes - metadataBytes);
    const savingsPercentage = totalRawMediaBytes > 0 ? (bytesSaved / totalRawMediaBytes) * 100 : 0;
    const estimatedInferenceSpeedupMultiplier = metadataBytes > 0 ? Math.round(totalRawMediaBytes / metadataBytes) : 1;

    return {
      totalRawMediaBytes,
      metadataBytes,
      bytesSaved,
      savingsPercentage,
      estimatedInferenceSpeedupMultiplier
    };
  }
}
