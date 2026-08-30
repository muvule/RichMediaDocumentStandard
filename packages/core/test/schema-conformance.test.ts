import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  parseRMD,
  validateDocument,
  FrontMatterSchema,
  MediaBlockSchema,
  AnnotationBlockSchema,
  SemanticBlockSchema,
  ProvenanceBlockSchema,
  AgentBlockSchema,
  SchemaBlockSchema,
  IndexBlockSchema
} from '../src/index.js';

describe('Schema Conformance & Examples Integrity Test', () => {
  const examplesDir = path.resolve(__dirname, '../../../examples');
  const exampleFiles = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.rmd'));

  it('should find and test all reference .rmd example files', () => {
    expect(exampleFiles.length).toBeGreaterThanOrEqual(4);
  });

  for (const file of exampleFiles) {
    it(`should strictly conform to schemas and pass validation: ${file}`, () => {
      const fullPath = path.join(examplesDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // 1. Parse into AST
      const doc = parseRMD(content);
      expect(doc).toBeDefined();

      // 2. Validate Frontmatter Schema
      const fmResult = FrontMatterSchema.safeParse(doc.frontMatter);
      expect(fmResult.success, `Frontmatter validation failed for ${file}: ${JSON.stringify(fmResult)}`).toBe(true);

      // 3. Validate Every Block Attribute Schema
      for (const node of doc.nodes) {
        switch (node.type) {
          case 'rmd.media': {
            const res = MediaBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `MediaBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
          case 'rmd.annotation': {
            const res = AnnotationBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `AnnotationBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
          case 'rmd.semantic': {
            const res = SemanticBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `SemanticBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
          case 'rmd.provenance': {
            const res = ProvenanceBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `ProvenanceBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
          case 'rmd.agent': {
            const res = AgentBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `AgentBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
          case 'rmd.schema': {
            const res = SchemaBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `SchemaBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
          case 'rmd.index': {
            const res = IndexBlockSchema.safeParse((node as any).attrs);
            expect(res.success, `IndexBlockSchema error in ${file} node ${(node as any).attrs.id}: ${JSON.stringify(res)}`).toBe(true);
            break;
          }
        }
      }

      // 4. Run Semantic & Cross-Reference Validation
      const diagnostics = validateDocument(doc);
      const errors = diagnostics.filter((d) => d.level === 'error');
      expect(errors, `Validation errors found in ${file}: ${JSON.stringify(errors)}`).toHaveLength(0);
    });
  }
});
