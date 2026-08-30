import { z } from 'zod';
import {
  RMDDocument,
  ParseDiagnostic,
  MediaASTNode,
  AnnotationASTNode,
  SemanticASTNode,
  ProvenanceASTNode,
  AgentASTNode,
  SchemaASTNode,
  IndexASTNode,
  ASTNode
} from './types.js';
import { isSelectorCompatibleWithMedia } from './selectors.js';

// ----------------------------------------------------
// Zod Schemas
// ----------------------------------------------------

export const ID_REGEX = /^[a-zA-Z0-9_\-.:]+$/;

export const FrontMatterSchema = z.object({
  rmd: z
    .union([z.string(), z.number()])
    .transform((val) => String(val))
    .refine((v) => /^\d+\.\d+(\.\d+)?$/.test(v), {
      message: "rmd version must follow SemVer pattern (e.g. '0.1' or '0.1.0')"
    }),
  id: z.string().min(1, 'Missing document id').regex(ID_REGEX, 'Document ID contains invalid characters'),
  title: z.string().min(1, 'Missing document title'),
  language: z.string().optional().default('en'),
  created: z.string().optional(),
  updated: z.string().optional(),
  authors: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional(),
        email: z.string().email().optional()
      })
    )
    .optional(),
  license: z.string().optional(),
  contentType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  defaultMediaPolicy: z.enum(['stream', 'download', 'defer', 'offline']).optional()
});

export const TemporalSelectorSchema = z.object({
  type: z.literal('temporal'),
  start: z.number().min(0),
  end: z.number().min(0),
  frameStart: z.number().int().optional(),
  frameEnd: z.number().int().optional(),
  timebase: z.string().optional(),
  chapterId: z.string().optional()
});

export const SpatialSelectorSchema = z
  .object({
    type: z.enum(['xywh', 'polygon', 'normalized-xywh']),
    unit: z.enum(['pixel', 'percent', 'normalized']).optional().default('pixel'),
    x: z.number().min(0, 'Coordinate x cannot be negative').optional(),
    y: z.number().min(0, 'Coordinate y cannot be negative').optional(),
    width: z.number().min(0, 'Width cannot be negative').optional(),
    height: z.number().min(0, 'Height cannot be negative').optional(),
    points: z.array(z.tuple([z.number(), z.number()])).optional()
  })
  .superRefine((val, ctx) => {
    if (val.type === 'xywh') {
      if (val.unit === 'normalized') {
        if ((val.x ?? 0) > 1 || (val.y ?? 0) > 1 || (val.width ?? 0) > 1 || (val.height ?? 0) > 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Normalized spatial coordinates must be between 0.0 and 1.0'
          });
        }
      }
    } else if (val.type === 'normalized-xywh') {
      if ((val.x ?? 0) > 1 || (val.y ?? 0) > 1 || (val.width ?? 0) > 1 || (val.height ?? 0) > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Normalized spatial coordinates must be between 0.0 and 1.0'
        });
      }
    } else if (val.type === 'polygon') {
      if (!val.points || val.points.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Polygon selector requires at least 3 vertices'
        });
      }
    }
  });

export const TextRangeSelectorSchema = z.object({
  type: z.literal('text-range'),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
  exact: z.string().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional()
});

export const SelectorSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    TemporalSelectorSchema,
    SpatialSelectorSchema,
    TextRangeSelectorSchema,
    z.object({
      type: z.literal('composite'),
      chain: z.array(SelectorSchema).min(1)
    })
  ])
);

export const MediaBlockSchema = z.object({
  id: z.string().min(1).regex(ID_REGEX, 'Media ID contains invalid characters'),
  kind: z.enum(['image', 'video', 'audio', 'document', 'dataset', '3d']),
  src: z.string().min(1),
  mime: z.string().min(1),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/, 'sha256 must be a 64-character hexadecimal string').optional(),
  byteSize: z.number().int().nonnegative().optional(),
  duration: z.number().nonnegative().optional(),
  width: z.number().int().nonnegative().optional(),
  height: z.number().int().nonnegative().optional(),
  poster: z.string().optional(),
  captions: z.string().optional(),
  transcript: z.string().optional(),
  license: z.string().optional(),
  provenance: z.record(z.unknown()).optional(),
  understanding: z.record(z.unknown()).optional(),
  retrieval: z.record(z.unknown()).optional()
});

export const AnnotationBlockSchema = z.object({
  id: z.string().min(1).regex(ID_REGEX, 'Annotation ID contains invalid characters'),
  target: z.string().min(1).regex(ID_REGEX, 'Target ID contains invalid characters'),
  type: z.string().min(1),
  selector: SelectorSchema.optional(),
  body: z.unknown().optional(),
  claim: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  source: z.enum(['human', 'model', 'extracted', 'verified']).optional(),
  createdBy: z.union([z.string(), z.record(z.unknown())]).optional(),
  createdAt: z.string().optional()
});

export const SemanticBlockSchema = z.object({
  id: z.string().min(1),
  target: z.string().min(1),
  caption: z.string().optional(),
  summary: z.string().optional(),
  ocr: z.array(z.record(z.unknown())).optional(),
  transcript: z.array(z.record(z.unknown())).optional(),
  entities: z
    .array(
      z.object({
        id: z.string(),
        type: z.string().optional(),
        label: z.string(),
        confidence: z.number().min(0).max(1).optional()
      })
    )
    .optional(),
  topics: z.array(z.string()).optional(),
  relationships: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        type: z.string()
      })
    )
    .optional(),
  embeddingRef: z.string().optional(),
  model: z.record(z.unknown()).optional(),
  source: z.enum(['human', 'model', 'extracted', 'verified']).optional(),
  confidence: z.number().min(0).max(1).optional()
});

export const ProvenanceBlockSchema = z.object({
  id: z.string().min(1),
  target: z.string().min(1),
  creator: z.string().optional(),
  license: z.string().optional(),
  c2pa: z.string().optional(),
  history: z
    .array(
      z.object({
        action: z.string(),
        at: z.string().optional(),
        actor: z.string().optional(),
        parameters: z.record(z.unknown()).optional()
      })
    )
    .optional()
});

export const AgentBlockSchema = z.object({
  id: z.string().min(1),
  mode: z.string().optional(),
  priority: z.enum(['high', 'normal', 'low']).optional(),
  instructions: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  output: z
    .object({
      format: z.string().optional(),
      schema: z.string().optional()
    })
    .optional(),
  budget: z.record(z.unknown()).optional()
});

export const SchemaBlockSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  src: z.string().optional(),
  schema: z.record(z.unknown()).optional(),
  description: z.string().optional()
});

export const IndexBlockSchema = z.object({
  id: z.string().min(1).regex(ID_REGEX, 'Index ID contains invalid characters'),
  target: z.string().min(1).regex(ID_REGEX, 'Target ID contains invalid characters'),
  artifacts: z.array(
    z.object({
      kind: z.string(),
      src: z.string(),
      format: z.string().optional(),
      sha256: z.string().regex(/^[a-fA-F0-9]{64}$/, 'sha256 must be a 64-character hexadecimal string').optional()
    })
  )
});

// ----------------------------------------------------
// Semantic Cross-Reference & Document Integrity Validation
// ----------------------------------------------------

export function validateDocument(doc: RMDDocument): ParseDiagnostic[] {
  const diagnostics: ParseDiagnostic[] = [...doc.diagnostics];
  for (const node of doc.nodes) {
    if (node.errors && node.errors.length > 0) {
      diagnostics.push(...node.errors);
    }
  }
  const seenIds = new Set<string>();

  // 1. Validate Document Front Matter
  if (!doc.frontMatter.rmd) {
    diagnostics.push({
      level: 'error',
      code: 'ERR_MISSING_RMD_VERSION',
      message: "Document frontmatter is missing required 'rmd' spec version."
    });
  }
  if (!doc.frontMatter.id) {
    diagnostics.push({
      level: 'error',
      code: 'ERR_MISSING_DOC_ID',
      message: "Document frontmatter is missing required 'id'."
    });
  }
  if (!doc.frontMatter.title) {
    diagnostics.push({
      level: 'error',
      code: 'ERR_MISSING_DOC_TITLE',
      message: "Document frontmatter is missing required 'title'."
    });
  }

  // 2. Collect and Index Media Assets, Annotations & Indexes
  const mediaMap = new Map<string, MediaASTNode>();
  const annotationMap = new Map<string, AnnotationASTNode>();
  const indexSet = new Set<string>();

  for (const node of doc.nodes) {
    if (node.type === 'rmd.index') {
      const idxNode = node as IndexASTNode;
      indexSet.add(idxNode.attrs.id);
    } else if (node.type === 'rmd.annotation') {
      const annNode = node as AnnotationASTNode;
      if (!annotationMap.has(annNode.attrs.id)) {
        annotationMap.set(annNode.attrs.id, annNode);
      }
    }
  }

  for (const node of doc.nodes) {
    if (node.type === 'rmd.media') {
      const mediaNode = node as MediaASTNode;
      if (seenIds.has(mediaNode.attrs.id)) {
        diagnostics.push({
          level: 'error',
          code: 'ERR_DUPLICATE_ID',
          message: `Duplicate ID detected: '${mediaNode.attrs.id}' is used multiple times.`,
          range: node.range,
          nodeId: mediaNode.attrs.id
        });
      } else {
        seenIds.add(mediaNode.attrs.id);
        mediaMap.set(mediaNode.attrs.id, mediaNode);
      }

      // Syntax check on ID format
      if (!ID_REGEX.test(mediaNode.attrs.id)) {
        diagnostics.push({
          level: 'error',
          code: 'ERR_INVALID_ID_SYNTAX',
          message: `ID '${mediaNode.attrs.id}' contains special characters outside pattern [a-zA-Z0-9_\\-.:]+`,
          range: node.range,
          nodeId: mediaNode.attrs.id
        });
      }

      // Security check: Warn on remote unencrypted media
      if (mediaNode.attrs.src.startsWith('http://')) {
        diagnostics.push({
          level: 'warning',
          code: 'WARN_INSECURE_MEDIA_URL',
          message: `Media source '${mediaNode.attrs.src}' uses unencrypted HTTP protocol. Use HTTPS.`,
          range: node.range,
          nodeId: mediaNode.attrs.id
        });
      }

      // Integrity check: Warn on external remote media missing SHA-256
      if (
        (mediaNode.attrs.src.startsWith('http://') || mediaNode.attrs.src.startsWith('https://')) &&
        !mediaNode.attrs.sha256
      ) {
        diagnostics.push({
          level: 'warning',
          code: 'WARN_MISSING_SHA256',
          message: `Remote media '${mediaNode.attrs.id}' lacks a 'sha256' cryptographic hash for tamper-evident verification.`,
          range: node.range,
          nodeId: mediaNode.attrs.id
        });
      }

      // Embedding reference check
      if (mediaNode.attrs.retrieval?.embeddingRef && !indexSet.has(mediaNode.attrs.retrieval.embeddingRef)) {
        diagnostics.push({
          level: 'warning',
          code: 'WARN_UNKNOWN_INDEX_REF',
          message: `Media '${mediaNode.attrs.id}' references undeclared embedding index '${mediaNode.attrs.retrieval.embeddingRef}'.`,
          range: node.range,
          nodeId: mediaNode.attrs.id
        });
      }
    }
  }

  // 3. Validate Blocks and Cross-References
  for (const node of doc.nodes) {
    if (node.type === 'rmd.markdown') {
      // Security check: disallow <script> injection
      if (/<script\b[^>]*>([\s\S]*?)<\/script>/gi.test(node.raw)) {
        diagnostics.push({
          level: 'error',
          code: 'ERR_SCRIPT_INJECTION',
          message: 'Inline <script> tags are forbidden in RMD documents.',
          range: node.range
        });
      }
      continue;
    }

    // Check duplicate ID and ID syntax for all blocks
    if ('attrs' in node && (node.attrs as { id?: string }).id) {
      const blockId = (node.attrs as { id: string }).id;
      if (node.type !== 'rmd.media') {
        if (seenIds.has(blockId)) {
          diagnostics.push({
            level: 'error',
            code: 'ERR_DUPLICATE_ID',
            message: `Duplicate ID detected: '${blockId}' is already used.`,
            range: node.range,
            nodeId: blockId
          });
        } else {
          seenIds.add(blockId);
        }

        if (!ID_REGEX.test(blockId)) {
          diagnostics.push({
            level: 'error',
            code: 'ERR_INVALID_ID_SYNTAX',
            message: `ID '${blockId}' contains characters outside pattern [a-zA-Z0-9_\\-.:]+`,
            range: node.range,
            nodeId: blockId
          });
        }
      }
    }

    // A. Validate Annotations
    if (node.type === 'rmd.annotation') {
      const annNode = node as AnnotationASTNode;
      const targetId = annNode.attrs.target;
      const targetMedia = mediaMap.get(targetId);
      const targetAnno = annotationMap.get(targetId);

      if (!targetMedia && !targetAnno && targetId !== doc.frontMatter.id && targetId !== 'doc') {
        diagnostics.push({
          level: 'error',
          code: 'ERR_UNKNOWN_TARGET',
          message: `Annotation '${annNode.attrs.id}' targets non-existent media asset or annotation '${targetId}'.`,
          range: node.range,
          nodeId: annNode.attrs.id
        });
      }

      // Cycle detection for annotation-to-annotation chains
      if (targetAnno) {
        const chain = [annNode.attrs.id];
        let curr: string | undefined = targetId;
        while (curr && annotationMap.has(curr)) {
          if (curr === annNode.attrs.id || (chain.length > 1 && chain.slice(1).includes(curr))) {
            diagnostics.push({
              level: 'error',
              code: 'ERR_CYCLIC_TARGET_REFERENCE',
              message: `Cyclic target reference detected in annotation chain: ${[...chain, curr].join(' ➔ ')}.`,
              range: node.range,
              nodeId: annNode.attrs.id
            });
            break;
          }
          chain.push(curr);
          curr = annotationMap.get(curr)?.attrs.target;
        }
      }

      if (annNode.attrs.confidence !== undefined && (annNode.attrs.confidence < 0 || annNode.attrs.confidence > 1)) {
        diagnostics.push({
          level: 'error',
          code: 'ERR_INVALID_CONFIDENCE_RANGE',
          message: `Annotation '${annNode.attrs.id}' confidence must be between 0.0 and 1.0 (received ${annNode.attrs.confidence}).`,
          range: node.range,
          nodeId: annNode.attrs.id
        });
      }

      // Resolve root media for selector validation
      let rootMedia = targetMedia;
      if (!rootMedia && targetAnno) {
        let curr: string | undefined = targetId;
        const seen = new Set<string>();
        while (curr && annotationMap.has(curr) && !seen.has(curr)) {
          seen.add(curr);
          curr = annotationMap.get(curr)?.attrs.target;
          if (curr && mediaMap.has(curr)) {
            rootMedia = mediaMap.get(curr);
            break;
          }
        }
      }

      if (annNode.attrs.selector && rootMedia) {
        const compat = isSelectorCompatibleWithMedia(annNode.attrs.selector, rootMedia.attrs.kind);
        if (!compat.valid) {
          diagnostics.push({
            level: 'error',
            code: 'ERR_INCOMPATIBLE_SELECTOR',
            message: `Incompatible selector on annotation '${annNode.attrs.id}': ${compat.error}`,
            range: node.range,
            nodeId: annNode.attrs.id
          });
        }

        // Bounds check: temporal selector start/end against media duration
        if (
          annNode.attrs.selector.type === 'temporal' &&
          rootMedia.attrs.duration !== undefined &&
          annNode.attrs.selector.end > rootMedia.attrs.duration
        ) {
          diagnostics.push({
            level: 'warning',
            code: 'WARN_SELECTOR_OUT_OF_BOUNDS',
            message: `Annotation temporal end (${annNode.attrs.selector.end}s) exceeds media duration (${rootMedia.attrs.duration}s).`,
            range: node.range,
            nodeId: annNode.attrs.id
          });
        }
      }

      // Provenance warning for model claims without confidence
      if (annNode.attrs.source === 'model' && annNode.attrs.confidence === undefined) {
        diagnostics.push({
          level: 'warning',
          code: 'WARN_MISSING_MODEL_CONFIDENCE',
          message: `Annotation '${annNode.attrs.id}' is model-generated but lacks a 'confidence' score.`,
          range: node.range,
          nodeId: annNode.attrs.id
        });
      }
    }

    // B. Validate Semantic Blocks
    if (node.type === 'rmd.semantic') {
      const semNode = node as SemanticASTNode;
      const targetId = semNode.attrs.target;
      if (!mediaMap.has(targetId) && targetId !== doc.frontMatter.id && targetId !== 'doc') {
        diagnostics.push({
          level: 'error',
          code: 'ERR_UNKNOWN_TARGET',
          message: `Semantic block '${semNode.attrs.id}' targets non-existent media asset '${targetId}'.`,
          range: node.range,
          nodeId: semNode.attrs.id
        });
      }

      if (semNode.attrs.confidence !== undefined && (semNode.attrs.confidence < 0 || semNode.attrs.confidence > 1)) {
        diagnostics.push({
          level: 'error',
          code: 'ERR_INVALID_CONFIDENCE_RANGE',
          message: `Semantic block '${semNode.attrs.id}' confidence must be between 0.0 and 1.0 (received ${semNode.attrs.confidence}).`,
          range: node.range,
          nodeId: semNode.attrs.id
        });
      }
    }

    // C. Validate Provenance Blocks
    if (node.type === 'rmd.provenance') {
      const provNode = node as ProvenanceASTNode;
      const targetId = provNode.attrs.target;
      if (!mediaMap.has(targetId) && targetId !== doc.frontMatter.id && targetId !== 'doc') {
        diagnostics.push({
          level: 'error',
          code: 'ERR_UNKNOWN_TARGET',
          message: `Provenance block '${provNode.attrs.id}' targets non-existent media asset '${targetId}'.`,
          range: node.range,
          nodeId: provNode.attrs.id
        });
      }
    }
  }

  return diagnostics;
}
