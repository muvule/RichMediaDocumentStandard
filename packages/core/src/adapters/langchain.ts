import { RMDDocument, AnnotationBlockAttrs, SemanticBlockAttrs } from '../types.js';
import { parseRMD } from '../parser.js';
import { RMDQueryEngine } from '../query.js';

/**
 * Standard LangChain Document structure compatible with LangChain Core.
 */
export interface LangChainDocument {
  pageContent: string;
  metadata: {
    source: string;
    documentId: string;
    targetMediaId?: string;
    annotationId?: string;
    selector?: any;
    confidence?: number;
    claim?: string;
    label?: string;
    [key: string]: any;
  };
}

/**
 * RMD Document Loader for LangChain.
 * Loads a Rich Media Document (.rmd) into atomic, grounded evidence documents.
 */
export class RMDDocumentLoader {
  private doc: RMDDocument;
  private sourcePath: string;

  constructor(source: string | RMDDocument, sourcePath: string = 'inline.rmd') {
    if (typeof source === 'string') {
      this.doc = parseRMD(source);
      this.sourcePath = sourcePath;
    } else {
      this.doc = source;
      this.sourcePath = sourcePath;
    }
  }

  /**
   * Load the RMD document into an array of LangChain Document objects.
   */
  public load(): LangChainDocument[] {
    const docs: LangChainDocument[] = [];
    const docId = this.doc.frontMatter.id;

    // 1. Document Overview / Frontmatter Document
    docs.push({
      pageContent: `# ${this.doc.frontMatter.title}\nID: ${docId}\nSpec: RMD v${this.doc.frontMatter.rmd}\n${this.doc.frontMatter.tags ? `Tags: ${this.doc.frontMatter.tags.join(', ')}` : ''}`,
      metadata: {
        source: this.sourcePath,
        documentId: docId,
        type: 'document_overview',
        frontMatter: this.doc.frontMatter
      }
    });

    // 2. Extract Grounded Annotation Evidence Slices
    for (const node of this.doc.nodes) {
      if (node.type === 'rmd.annotation') {
        const a = (node as any).attrs as AnnotationBlockAttrs;
        const label = (a.body as { label?: string })?.label || a.type || 'observation';
        const claim = a.claim || (a.body as { text?: string })?.text || 'Evidence anchor';
        
        let content = `[EVIDENCE] ${claim}\nTarget: ${a.target}\nClassification: ${a.type}`;
        if (a.selector) {
          content += `\nSelector: ${JSON.stringify(a.selector)}`;
        }
        if (a.confidence !== undefined) {
          content += `\nConfidence: ${(a.confidence * 100).toFixed(1)}%`;
        }

        docs.push({
          pageContent: content,
          metadata: {
            source: this.sourcePath,
            documentId: docId,
            annotationId: a.id,
            targetMediaId: a.target,
            selector: a.selector,
            confidence: a.confidence,
            claim: a.claim,
            label,
            annotationType: a.type
          }
        });
      } else if (node.type === 'rmd.semantic') {
        const s = (node as any).attrs as SemanticBlockAttrs;
        const summary = s.summary || s.caption || 'Semantic scene breakdown';
        docs.push({
          pageContent: `[SEMANTIC INDEX] Target: ${s.target}\nSummary: ${summary}\nTopics: ${(s.topics || []).join(', ')}`,
          metadata: {
            source: this.sourcePath,
            documentId: docId,
            targetMediaId: s.target,
            type: 'semantic_index',
            topics: s.topics,
            entities: s.entities
          }
        });
      }
    }

    return docs;
  }
}

/**
 * Custom LangChain Retriever powered by RMDQueryEngine.
 */
export class RMDQueryRetriever {
  private engine: RMDQueryEngine;

  constructor(
    docOrEngine: RMDDocument | RMDQueryEngine,
    private options: { minConfidence?: number; targetMediaId?: string } = {}
  ) {
    if (docOrEngine instanceof RMDQueryEngine) {
      this.engine = docOrEngine;
    } else {
      this.engine = new RMDQueryEngine(docOrEngine);
    }
  }

  /**
   * Retrieve relevant evidence documents for an agent query string.
   */
  public async getRelevantDocuments(query: string): Promise<LangChainDocument[]> {
    const evidenceSlices = this.engine.findEvidence(query);
    const minConf = this.options.minConfidence ?? 0.0;
    const docId = this.engine.getDocumentMetadata().id;

    return evidenceSlices
      .filter((s) => (s.confidence ?? 1.0) >= minConf)
      .filter((s) => !this.options.targetMediaId || s.targetAssetId === this.options.targetMediaId)
      .map((s) => ({
        pageContent: `[EVIDENCE] ${s.claim}\nTarget: ${s.targetAssetId}\nSelector: ${JSON.stringify(s.selector)}\nConfidence: ${((s.confidence || 1) * 100).toFixed(1)}%`,
        metadata: {
          source: 'rmd-query-engine',
          documentId: docId,
          annotationId: s.annotationId,
          targetMediaId: s.targetAssetId,
          selector: s.selector,
          confidence: s.confidence,
          claim: s.claim,
          sourceMediaUrl: s.assetSrc
        }
      }));
  }
}
