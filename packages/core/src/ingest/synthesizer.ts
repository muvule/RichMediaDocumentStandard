import { DiscoveredAsset, IngestedAnnotationResult, IngestedDocumentResult, IngestOptions } from './types.js';
import { MediaExtractorEngine } from './extractors.js';
import { parseRMD } from '../parser.js';
import { validateDocument } from '../validators.js';

/**
 * Synthesizes discovered assets and extractor outputs into a valid .rmd document.
 */
export function synthesizeRMDDocument(
  assets: DiscoveredAsset[],
  options: IngestOptions = {}
): IngestedDocumentResult {
  const extractor = new MediaExtractorEngine(options);
  const title = options.title || 'Automated Rich Media Document';
  const docId = options.id || `doc:ingest-${Date.now().toString().slice(-6)}`;
  const createdDate = new Date().toISOString();

  const lines: string[] = [];

  // 1. Frontmatter
  lines.push('---');
  lines.push('rmd: 0.1');
  lines.push(`id: ${docId}`);
  lines.push(`title: ${title}`);
  lines.push('language: en');
  if (options.authors && options.authors.length > 0) {
    lines.push('authors:');
    for (const a of options.authors) {
      lines.push(`  - name: ${a.name}`);
      if (a.role) lines.push(`    role: ${a.role}`);
    }
  } else {
    lines.push('authors:');
    lines.push('  - name: RMD Automated Ingestion Engine');
    lines.push('    role: Ingestion Pipeline');
  }
  lines.push(`created: ${createdDate}`);
  lines.push('license: CC-BY-4.0');
  lines.push('contentType: automated-ingestion');
  if (options.tags && options.tags.length > 0) {
    lines.push(`tags: [${options.tags.join(', ')}]`);
  } else {
    lines.push('tags: [automated, ingestion, multimodal, evidence]');
  }
  lines.push('defaultMediaPolicy: defer');
  lines.push('---');
  lines.push('');

  // 2. Document Heading & Introduction
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(
    `This rich media report was automatically compiled by the \`rmd ingest\` pipeline. ` +
    `It aggregates ${assets.length} media asset(s) with grounded multimodal evidence selectors and semantic manifests.`
  );
  lines.push('');

  let totalAnnotations = 0;
  const allEntities: Array<{ id: string; label: string; type: string }> = [];
  const usedAssetIds = new Set<string>();

  // 3. Process Each Asset
  for (let idx = 0; idx < assets.length; idx++) {
    const asset = assets[idx];
    let cleanId = `${asset.kind}-${asset.fileName.replace(/[^a-zA-Z0-9_\-]/g, '-').toLowerCase()}`;
    if (usedAssetIds.has(cleanId)) {
      cleanId = `${cleanId}-${idx + 1}`;
    }
    usedAssetIds.add(cleanId);

    lines.push(`## Asset ${idx + 1}: ${asset.fileName}`);
    lines.push('');
    lines.push(
      `File format: \`${asset.mime}\` (${(asset.byteSize / (1024 * 1024)).toFixed(2)} MB)` +
        (asset.width ? `, resolution: \`${asset.width}x${asset.height} px\`` : '') +
        (asset.duration ? `, duration: \`${asset.duration}s\`` : '') +
        '.'
    );
    lines.push('');

    // Emit rmd:media block
    lines.push('```rmd:media');
    lines.push(`id: ${cleanId}`);
    lines.push(`kind: ${asset.kind}`);
    lines.push(`src: ${asset.relativePath || asset.filePath}`);
    lines.push(`mime: ${asset.mime}`);
    lines.push(`sha256: "${asset.sha256}"`);
    lines.push(`byteSize: ${asset.byteSize}`);
    if (asset.width) lines.push(`width: ${asset.width}`);
    if (asset.height) lines.push(`height: ${asset.height}`);
    if (asset.duration) lines.push(`duration: ${asset.duration}`);

    lines.push('understanding:');
    lines.push(`  summary: "Automated analysis of ${asset.fileName}."`);
    lines.push('retrieval:');
    lines.push('  priority: high');
    lines.push(
      `  preferredEvidence: [${
        asset.kind === 'image'
          ? '"crop", "ocr"'
          : asset.kind === 'video'
          ? '"scene", "temporal-slice"'
          : '"transcript", "audio-slice"'
      }]`
    );
    lines.push('```');
    lines.push('');

    // Run extractors based on kind
    let annotations: IngestedAnnotationResult[] = [];
    if (asset.kind === 'image') {
      annotations = extractor.extractImageAnnotations(asset, cleanId);
    } else if (asset.kind === 'video') {
      annotations = extractor.extractVideoAnnotations(asset, cleanId);
    } else if (asset.kind === 'audio') {
      annotations = extractor.extractAudioAnnotations(asset, cleanId);
    }

    totalAnnotations += annotations.length;

    // Emit rmd:annotation blocks
    for (const ann of annotations) {
      lines.push('```rmd:annotation');
      lines.push(`id: ${ann.id}`);
      lines.push(`target: ${ann.targetId}`);
      lines.push(`type: ${ann.type}`);
      lines.push('selector:');

      if (ann.selector.type === 'temporal') {
        lines.push('  type: temporal');
        lines.push(`  start: ${ann.selector.start}`);
        lines.push(`  end: ${ann.selector.end}`);
      } else if (ann.selector.type === 'xywh') {
        lines.push('  type: xywh');
        lines.push(`  unit: ${ann.selector.unit}`);
        lines.push(`  x: ${ann.selector.x}`);
        lines.push(`  y: ${ann.selector.y}`);
        lines.push(`  width: ${ann.selector.width}`);
        lines.push(`  height: ${ann.selector.height}`);
      }

      if (ann.body) {
        lines.push('body:');
        for (const [k, v] of Object.entries(ann.body)) {
          lines.push(`  ${k}: "${String(v).replace(/"/g, '\\"')}"`);
        }
      }

      lines.push(`claim: "${ann.claim.replace(/"/g, '\\"')}"`);
      lines.push(`confidence: ${ann.confidence}`);
      lines.push(`source: ${ann.source}`);

      if (ann.createdBy) {
        lines.push('createdBy:');
        lines.push(`  name: ${ann.createdBy.name}`);
        if (ann.createdBy.version) lines.push(`  version: ${ann.createdBy.version}`);
      }

      lines.push('```');
      lines.push('');

      allEntities.push({
        id: `ent-${cleanId}`,
        label: asset.fileName,
        type: asset.kind
      });
    }
  }

  // 4. Emit Global Semantic Index
  if (options.generateSummary !== false && allEntities.length > 0) {
    lines.push('```rmd:semantic');
    lines.push('id: sem-document-index');
    lines.push('target: doc');
    lines.push(`summary: "Comprehensive index covering ${assets.length} multi-modal asset(s) and ${totalAnnotations} grounded evidence anchor(s)."`);
    lines.push('topics: [automated-ingestion, multimodal-evidence, multi-asset-survey]');
    lines.push('entities:');
    for (const ent of allEntities) {
      lines.push(`  - id: ${ent.id}`);
      lines.push(`    type: ${ent.type}`);
      lines.push(`    label: "${ent.label}"`);
      lines.push('    confidence: 0.95');
    }
    lines.push('```');
    lines.push('');
  }

  const rmdContent = lines.join('\n');
  const parsedDoc = parseRMD(rmdContent);
  validateDocument(parsedDoc);

  return {
    rmdContent,
    doc: parsedDoc,
    assets,
    annotationsCount: totalAnnotations,
    diagnostics: parsedDoc.diagnostics
  };
}
