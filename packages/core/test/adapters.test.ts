import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseRMD } from '../src/parser.js';
import { RMDDocumentLoader, RMDQueryRetriever } from '../src/adapters/langchain.js';

describe('LangChain & Agent Adapters', () => {
  const examplesDir = path.resolve(__dirname, '../../../examples');
  const sampleFile = path.join(examplesDir, 'image-report.rmd');
  const content = fs.readFileSync(sampleFile, 'utf-8');

  it('should load RMD document into LangChain Document objects', () => {
    const loader = new RMDDocumentLoader(content, 'image-report.rmd');
    const docs = loader.load();

    expect(docs.length).toBeGreaterThan(0);
    
    // First doc should be document overview
    expect(docs[0].metadata.type).toBe('document_overview');
    expect(docs[0].metadata.documentId).toBe('doc:solar-roof-inspection-2026');

    // Subsequent docs should contain evidence slices with selectors
    const evidenceDocs = docs.filter((d) => d.metadata.annotationId);
    expect(evidenceDocs.length).toBeGreaterThan(0);
    expect(evidenceDocs[0].metadata.selector).toBeDefined();
    expect(evidenceDocs[0].metadata.selector.type).toBe('xywh');
  });

  it('should query and retrieve relevant documents with RMDQueryRetriever', async () => {
    const doc = parseRMD(content);
    const retriever = new RMDQueryRetriever(doc, { minConfidence: 0.8 });

    const relevantDocs = await retriever.getRelevantDocuments('fracture');
    expect(relevantDocs.length).toBeGreaterThan(0);
    expect(relevantDocs[0].pageContent).toContain('EVIDENCE');
    expect(relevantDocs[0].metadata.selector).toBeDefined();
    expect(relevantDocs[0].metadata.targetMediaId).toBe('roof-ortho-04');
  });
});
