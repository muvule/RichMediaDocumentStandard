import * as YAML from 'yaml';
import { tokenizeRMD, Token } from './lexer.js';
import {
  RMDDocument,
  FrontMatter,
  ASTNode,
  ParseDiagnostic,
  MarkdownASTNode,
  MediaASTNode,
  AnnotationASTNode,
  SemanticASTNode,
  ProvenanceASTNode,
  AgentASTNode,
  SchemaASTNode,
  IndexASTNode,
  ExtensionASTNode
} from './types.js';
import {
  FrontMatterSchema,
  MediaBlockSchema,
  AnnotationBlockSchema,
  SemanticBlockSchema,
  ProvenanceBlockSchema,
  AgentBlockSchema,
  SchemaBlockSchema,
  IndexBlockSchema,
  validateDocument
} from './validators.js';

let nodeCounter = 0;
function generateNodeId(prefix: string): string {
  return `node:${prefix}:${++nodeCounter}`;
}

export function parseRMD(source: string): RMDDocument {
  const tokens = tokenizeRMD(source);
  const diagnostics: ParseDiagnostic[] = [];
  const nodes: ASTNode[] = [];

  let frontMatter: FrontMatter = {
    rmd: '0.1',
    id: 'doc:untitled',
    title: 'Untitled Document'
  };

  for (const token of tokens) {
    if (token.type === 'frontmatter') {
      try {
        const parsed = YAML.parse(token.content);
        if (parsed && typeof parsed === 'object') {
          const fmResult = FrontMatterSchema.safeParse(parsed);
          if (fmResult.success) {
            frontMatter = { ...parsed, ...fmResult.data };
          } else {
            for (const issue of fmResult.error.issues) {
              diagnostics.push({
                level: 'error',
                code: 'ERR_INVALID_FRONTMATTER',
                message: `Frontmatter error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
            frontMatter = parsed as FrontMatter;
          }
        } else {
          diagnostics.push({
            level: 'error',
            code: 'ERR_EMPTY_FRONTMATTER',
            message: 'Frontmatter must be a YAML mapping object.',
            range: token.range
          });
        }
      } catch (err: any) {
        diagnostics.push({
          level: 'error',
          code: 'ERR_YAML_SYNTAX',
          message: `Frontmatter YAML syntax error: ${err.message}`,
          range: token.range
        });
      }
    } else if (token.type === 'markdown') {
      const mdNode: MarkdownASTNode = {
        id: generateNodeId('md'),
        type: 'rmd.markdown',
        range: token.range,
        raw: token.content,
        errors: []
      };
      nodes.push(mdNode);
    } else if (token.type === 'rmd_block') {
      const nodeErrors: ParseDiagnostic[] = [];
      let parsedPayload: any = {};

      try {
        parsedPayload = YAML.parse(token.payload) ?? {};
        if (typeof parsedPayload !== 'object' || parsedPayload === null) {
          nodeErrors.push({
            level: 'error',
            code: 'ERR_INVALID_BLOCK_PAYLOAD',
            message: `Block payload for 'rmd:${token.blockType}' must be a YAML/JSON object.`,
            range: token.range
          });
          parsedPayload = {};
        }
      } catch (err: any) {
        nodeErrors.push({
          level: 'error',
          code: 'ERR_YAML_SYNTAX',
          message: `Syntax error in 'rmd:${token.blockType}' block: ${err.message}`,
          range: token.range
        });
      }

      const blockType = token.blockType.toLowerCase();

      switch (blockType) {
        case 'media': {
          const val = MediaBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Media block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const mediaNode: MediaASTNode = {
            id: parsedPayload.id ? `node:media:${parsedPayload.id}` : generateNodeId('media'),
            type: 'rmd.media',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(mediaNode);
          break;
        }

        case 'annotation': {
          const val = AnnotationBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Annotation block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const annNode: AnnotationASTNode = {
            id: parsedPayload.id ? `node:annotation:${parsedPayload.id}` : generateNodeId('annotation'),
            type: 'rmd.annotation',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(annNode);
          break;
        }

        case 'semantic': {
          const val = SemanticBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Semantic block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const semNode: SemanticASTNode = {
            id: parsedPayload.id ? `node:semantic:${parsedPayload.id}` : generateNodeId('semantic'),
            type: 'rmd.semantic',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(semNode);
          break;
        }

        case 'provenance': {
          const val = ProvenanceBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Provenance block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const provNode: ProvenanceASTNode = {
            id: parsedPayload.id ? `node:provenance:${parsedPayload.id}` : generateNodeId('provenance'),
            type: 'rmd.provenance',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(provNode);
          break;
        }

        case 'agent': {
          const val = AgentBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Agent block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const agentNode: AgentASTNode = {
            id: parsedPayload.id ? `node:agent:${parsedPayload.id}` : generateNodeId('agent'),
            type: 'rmd.agent',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(agentNode);
          break;
        }

        case 'schema': {
          const val = SchemaBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Schema block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const schemaNode: SchemaASTNode = {
            id: parsedPayload.id ? `node:schema:${parsedPayload.id}` : generateNodeId('schema'),
            type: 'rmd.schema',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(schemaNode);
          break;
        }

        case 'index': {
          const val = IndexBlockSchema.safeParse(parsedPayload);
          if (!val.success) {
            for (const issue of val.error.issues) {
              nodeErrors.push({
                level: 'error',
                code: 'ERR_SCHEMA_VALIDATION',
                message: `Index block validation error in '${issue.path.join('.')}': ${issue.message}`,
                range: token.range
              });
            }
          }
          const indexNode: IndexASTNode = {
            id: parsedPayload.id ? `node:index:${parsedPayload.id}` : generateNodeId('index'),
            type: 'rmd.index',
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(indexNode);
          break;
        }

        default: {
          // Rule C: Unknown extension blocks are preserved
          const extNode: ExtensionASTNode = {
            id: parsedPayload.id ? `node:ext:${parsedPayload.id}` : generateNodeId(`ext-${blockType}`),
            type: 'rmd.extension',
            subtype: blockType,
            range: token.range,
            raw: token.raw,
            attrs: parsedPayload,
            errors: nodeErrors
          };
          nodes.push(extNode);
          break;
        }
      }
    }
  }

  const doc: RMDDocument = {
    frontMatter,
    nodes,
    rawSource: source,
    diagnostics
  };

  // Run comprehensive cross-reference and integrity validation
  const validationDiagnostics = validateDocument(doc);
  doc.diagnostics = validationDiagnostics;

  return doc;
}
