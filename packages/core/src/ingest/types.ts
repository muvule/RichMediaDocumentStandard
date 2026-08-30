import { RMDDocument, Selector, FrontMatter } from '../types.js';

export interface IngestOptions {
  title?: string;
  id?: string;
  authors?: Array<{ name: string; role?: string }>;
  tags?: string[];
  detectObjects?: boolean;
  detectScenes?: boolean;
  transcribe?: boolean;
  generateSummary?: boolean;
  minConfidence?: number;
  engine?: 'auto' | 'local' | 'mock' | 'cloud';
}

export interface DiscoveredAsset {
  filePath: string;
  relativePath: string;
  fileName: string;
  kind: 'image' | 'video' | 'audio' | 'document';
  mime: string;
  byteSize: number;
  sha256: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface IngestedAnnotationResult {
  id: string;
  targetId: string;
  type: string;
  selector: Selector;
  claim: string;
  confidence: number;
  source: 'model' | 'extracted';
  body?: Record<string, any>;
  createdBy?: { name: string; version?: string };
}

export interface IngestedDocumentResult {
  rmdContent: string;
  doc: RMDDocument;
  assets: DiscoveredAsset[];
  annotationsCount: number;
  diagnostics: any[];
}
