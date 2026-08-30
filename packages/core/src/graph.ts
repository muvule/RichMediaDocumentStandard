import {
  RMDDocument,
  AgentGraph,
  MediaBlockAttrs,
  AnnotationBlockAttrs,
  SemanticBlockAttrs,
  ProvenanceBlockAttrs,
  AgentBlockAttrs,
  SchemaBlockAttrs,
  IndexBlockAttrs,
  MediaASTNode,
  AnnotationASTNode,
  SemanticASTNode,
  ProvenanceASTNode,
  AgentASTNode,
  SchemaASTNode,
  IndexASTNode
} from './types.js';

export function toAgentGraph(doc: RMDDocument): AgentGraph {
  const assets: MediaBlockAttrs[] = [];
  const annotations: AnnotationBlockAttrs[] = [];
  const semantic: SemanticBlockAttrs[] = [];
  const provenance: ProvenanceBlockAttrs[] = [];
  const agentDirectives: AgentBlockAttrs[] = [];
  const schemas: SchemaBlockAttrs[] = [];
  const indexes: IndexBlockAttrs[] = [];
  const relationships: Array<{ from: string; to: string; type: string }> = [];

  for (const node of doc.nodes) {
    switch (node.type) {
      case 'rmd.media': {
        const m = (node as MediaASTNode).attrs;
        assets.push(m);
        break;
      }
      case 'rmd.annotation': {
        const a = (node as AnnotationASTNode).attrs;
        annotations.push(a);
        relationships.push({
          from: a.id,
          to: a.target,
          type: 'targets'
        });
        break;
      }
      case 'rmd.semantic': {
        const s = (node as SemanticASTNode).attrs;
        semantic.push(s);
        if (s.relationships) {
          relationships.push(...s.relationships);
        }
        relationships.push({
          from: s.id,
          to: s.target,
          type: 'describes'
        });
        break;
      }
      case 'rmd.provenance': {
        const p = (node as ProvenanceASTNode).attrs;
        provenance.push(p);
        relationships.push({
          from: p.id,
          to: p.target,
          type: 'provenance_for'
        });
        break;
      }
      case 'rmd.agent': {
        agentDirectives.push((node as AgentASTNode).attrs);
        break;
      }
      case 'rmd.schema': {
        schemas.push((node as SchemaASTNode).attrs);
        break;
      }
      case 'rmd.index': {
        indexes.push((node as IndexASTNode).attrs);
        break;
      }
    }
  }

  return {
    document: {
      id: doc.frontMatter.id,
      title: doc.frontMatter.title,
      language: doc.frontMatter.language,
      license: doc.frontMatter.license,
      contentType: doc.frontMatter.contentType,
      tags: doc.frontMatter.tags
    },
    assets,
    annotations,
    semantic,
    provenance,
    agentDirectives,
    schemas,
    indexes,
    relationships
  };
}
