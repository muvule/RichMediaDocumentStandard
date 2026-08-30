/**
 * RMD (Rich Media Document) Standard - TypeScript Type Definitions
 * Version: 0.1.0
 */

export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

export interface SourceRange {
  start: SourceLocation;
  end: SourceLocation;
}

export interface ParseDiagnostic {
  level: 'error' | 'warning' | 'info';
  message: string;
  code: string;
  range?: SourceRange;
  nodeId?: string;
}

export interface FrontMatter {
  rmd: string;
  id: string;
  title: string;
  language?: string;
  created?: string;
  updated?: string;
  authors?: Array<{ name: string; role?: string; email?: string }>;
  license?: string;
  contentType?: string;
  tags?: string[];
  defaultMediaPolicy?: 'stream' | 'download' | 'defer' | 'offline';
  [key: string]: unknown;
}

// ----------------------------------------------------
// Selectors
// ----------------------------------------------------

export interface TemporalSelector {
  type: 'temporal';
  start: number;
  end: number;
  frameStart?: number;
  frameEnd?: number;
  timebase?: string;
  chapterId?: string;
}

export interface SpatialSelector {
  type: 'xywh' | 'polygon' | 'normalized-xywh';
  unit?: 'pixel' | 'percent' | 'normalized';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  points?: Array<[number, number]>;
}

export interface TextRangeSelector {
  type: 'text-range';
  startOffset: number;
  endOffset: number;
  exact?: string;
  prefix?: string;
  suffix?: string;
}

export interface CompositeSelector {
  type: 'composite';
  chain: Selector[];
}

export type Selector = TemporalSelector | SpatialSelector | TextRangeSelector | CompositeSelector;

// ----------------------------------------------------
// Block Attributes
// ----------------------------------------------------

export type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'dataset' | '3d';

export interface SceneDefinition {
  id: string;
  start: number;
  end: number;
  summary: string;
  entities?: string[];
}

export interface MediaBlockAttrs {
  id: string;
  kind: MediaKind;
  src: string;
  mime: string;
  sha256?: string;
  byteSize?: number;
  duration?: number;
  width?: number;
  height?: number;
  poster?: string;
  captions?: string;
  transcript?: string;
  license?: string;
  provenance?: {
    c2pa?: string;
    [key: string]: unknown;
  };
  understanding?: {
    summary?: string;
    scenes?: SceneDefinition[];
    [key: string]: unknown;
  };
  retrieval?: {
    priority?: 'high' | 'normal' | 'low';
    preferredEvidence?: string[];
    embeddingRef?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export type EvidenceSource = 'human' | 'model' | 'extracted' | 'verified';

export interface AnnotationBlockAttrs {
  id: string;
  target: string;
  type: string;
  selector?: Selector;
  body?: unknown;
  claim?: string;
  confidence?: number;
  source?: EvidenceSource;
  createdBy?: {
    name?: string;
    version?: string;
    [key: string]: unknown;
  } | string;
  createdAt?: string;
  [key: string]: unknown;
}

export interface SemanticEntity {
  id: string;
  type?: string;
  label: string;
  confidence?: number;
}

export interface SemanticRelationship {
  from: string;
  to: string;
  type: string;
}

export interface SemanticBlockAttrs {
  id: string;
  target: string;
  caption?: string;
  summary?: string;
  ocr?: Array<{ text: string; confidence?: number; bbox?: SpatialSelector }>;
  transcript?: Array<{ start: number; end: number; speaker?: string; text: string }>;
  entities?: SemanticEntity[];
  topics?: string[];
  relationships?: SemanticRelationship[];
  embeddingRef?: string;
  model?: {
    name?: string;
    version?: string;
    [key: string]: unknown;
  };
  source?: EvidenceSource;
  confidence?: number;
  [key: string]: unknown;
}

export interface ProvenanceHistoryItem {
  action: string;
  at?: string;
  actor?: string;
  parameters?: Record<string, unknown>;
}

export interface ProvenanceBlockAttrs {
  id: string;
  target: string;
  creator?: string;
  license?: string;
  c2pa?: string;
  history?: ProvenanceHistoryItem[];
  [key: string]: unknown;
}

export interface AgentBudget {
  maxEvidenceSlices?: number;
  maxContextTokens?: number;
  maxCostUsd?: number;
  allowedModalities?: MediaKind[];
  [key: string]: unknown;
}

export interface AgentBlockAttrs {
  id: string;
  mode?: string;
  priority?: 'high' | 'normal' | 'low';
  instructions?: string[];
  tools?: string[];
  output?: {
    format?: string;
    schema?: string;
    [key: string]: unknown;
  };
  budget?: AgentBudget;
  [key: string]: unknown;
}

export interface SchemaBlockAttrs {
  id: string;
  type: string;
  src?: string;
  schema?: Record<string, unknown>;
  description?: string;
  [key: string]: unknown;
}

export interface IndexArtifact {
  kind: string;
  src: string;
  format?: string;
  sha256?: string;
}

export interface IndexBlockAttrs {
  id: string;
  target: string;
  artifacts: IndexArtifact[];
  [key: string]: unknown;
}

// ----------------------------------------------------
// AST Nodes
// ----------------------------------------------------

export interface BaseASTNode {
  id: string;
  range: SourceRange;
  raw: string;
  errors: ParseDiagnostic[];
}

export interface MarkdownASTNode extends BaseASTNode {
  type: 'rmd.markdown';
}

export interface MediaASTNode extends BaseASTNode {
  type: 'rmd.media';
  attrs: MediaBlockAttrs;
}

export interface AnnotationASTNode extends BaseASTNode {
  type: 'rmd.annotation';
  attrs: AnnotationBlockAttrs;
}

export interface SemanticASTNode extends BaseASTNode {
  type: 'rmd.semantic';
  attrs: SemanticBlockAttrs;
}

export interface ProvenanceASTNode extends BaseASTNode {
  type: 'rmd.provenance';
  attrs: ProvenanceBlockAttrs;
}

export interface AgentASTNode extends BaseASTNode {
  type: 'rmd.agent';
  attrs: AgentBlockAttrs;
}

export interface SchemaASTNode extends BaseASTNode {
  type: 'rmd.schema';
  attrs: SchemaBlockAttrs;
}

export interface IndexASTNode extends BaseASTNode {
  type: 'rmd.index';
  attrs: IndexBlockAttrs;
}

export interface ExtensionASTNode extends BaseASTNode {
  type: 'rmd.extension';
  subtype: string;
  attrs: Record<string, unknown>;
}

export type ASTNode =
  | MarkdownASTNode
  | MediaASTNode
  | AnnotationASTNode
  | SemanticASTNode
  | ProvenanceASTNode
  | AgentASTNode
  | SchemaASTNode
  | IndexASTNode
  | ExtensionASTNode;

export interface RMDDocument {
  frontMatter: FrontMatter;
  nodes: ASTNode[];
  rawSource: string;
  diagnostics: ParseDiagnostic[];
}

// ----------------------------------------------------
// Agent Graph (Flattened Representation)
// ----------------------------------------------------

export interface AgentGraph {
  document: {
    id: string;
    title: string;
    language?: string;
    license?: string;
    contentType?: string;
    tags?: string[];
  };
  assets: MediaBlockAttrs[];
  annotations: AnnotationBlockAttrs[];
  semantic: SemanticBlockAttrs[];
  provenance: ProvenanceBlockAttrs[];
  agentDirectives: AgentBlockAttrs[];
  schemas: SchemaBlockAttrs[];
  indexes: IndexBlockAttrs[];
  relationships: Array<{ from: string; to: string; type: string }>;
}

// ----------------------------------------------------
// Evidence & Query Types
// ----------------------------------------------------

export interface EvidenceSlice {
  annotationId: string;
  targetAssetId: string;
  assetKind: MediaKind;
  assetSrc: string;
  selector?: Selector;
  claim?: string;
  body?: unknown;
  confidence?: number;
  source?: string;
  mediaSummary?: string;
}

export interface PromptContextOptions {
  maxTokens?: number;
  includeSelectors?: boolean;
  priorityAssets?: string[];
  query?: string;
}

export interface ByteSavingsMetrics {
  totalRawMediaBytes: number;
  metadataBytes: number;
  bytesSaved: number;
  savingsPercentage: number;
  estimatedInferenceSpeedupMultiplier: number;
}
