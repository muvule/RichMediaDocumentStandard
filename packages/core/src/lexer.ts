import { SourceLocation, SourceRange } from './types.js';

export type TokenType =
  | 'frontmatter'
  | 'markdown'
  | 'rmd_block';

export interface BaseToken {
  type: TokenType;
  range: SourceRange;
  raw: string;
}

export interface FrontMatterToken extends BaseToken {
  type: 'frontmatter';
  content: string;
}

export interface MarkdownToken extends BaseToken {
  type: 'markdown';
  content: string;
}

export interface RMDBlockToken extends BaseToken {
  type: 'rmd_block';
  blockType: string;
  payload: string;
  tagRange: SourceRange;
}

export type Token = FrontMatterToken | MarkdownToken | RMDBlockToken;

/**
 * Line-oriented lexer that splits an RMD document into frontmatter, markdown sections,
 * and fenced rmd:* blocks with exact line, column, and byte offsets.
 */
export function tokenizeRMD(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split(/\r?\n/);
  
  // Calculate line start byte offsets
  const lineOffsets: number[] = [];
  let currentOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    lineOffsets.push(currentOffset);
    // Find length including the newline character
    const match = source.slice(currentOffset).match(/^.*?\r?\n/);
    if (match) {
      currentOffset += match[0].length;
    } else {
      currentOffset += lines[i].length;
    }
  }

  function getLocation(lineIdx: number, colIdx: number): SourceLocation {
    const lineStart = lineOffsets[lineIdx] ?? currentOffset;
    return {
      line: lineIdx + 1,
      column: colIdx + 1,
      offset: lineStart + colIdx
    };
  }

  let lineIdx = 0;

  // 1. Check for YAML Front Matter at document start
  if (lines.length > 0 && lines[0].trim() === '---') {
    let fmEndIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        fmEndIdx = i;
        break;
      }
    }

    if (fmEndIdx !== -1) {
      const fmContent = lines.slice(1, fmEndIdx).join('\n');
      const startLoc = getLocation(0, 0);
      const endLoc = getLocation(fmEndIdx, lines[fmEndIdx].length);
      const raw = source.slice(startLoc.offset, endLoc.offset);

      tokens.push({
        type: 'frontmatter',
        content: fmContent,
        raw,
        range: { start: startLoc, end: endLoc }
      });

      lineIdx = fmEndIdx + 1;
    }
  }

  // 2. Iterate through lines, collecting Markdown chunks and RMD fenced blocks
  let mdStartLine = lineIdx;
  const mdBuffer: string[] = [];

  function flushMarkdown() {
    if (mdBuffer.length === 0) return;
    const text = mdBuffer.join('\n');
    if (text.length === 0) {
      mdBuffer.length = 0;
      return;
    }

    const startLoc = getLocation(mdStartLine, 0);
    const lastLineIdx = mdStartLine + mdBuffer.length - 1;
    const endLoc = getLocation(lastLineIdx, lines[lastLineIdx].length);
    const raw = source.slice(startLoc.offset, endLoc.offset);

    tokens.push({
      type: 'markdown',
      content: text,
      raw,
      range: { start: startLoc, end: endLoc }
    });

    mdBuffer.length = 0;
  }

  while (lineIdx < lines.length) {
    const line = lines[lineIdx];
    const rmdFenceMatch = line.match(/^[ ]{0,3}(`{3,}|~{3,})rmd:([a-zA-Z0-9_\-]+)\s*$/);

    if (rmdFenceMatch) {
      flushMarkdown();
      const fenceChars = rmdFenceMatch[1];
      const fenceCharType = fenceChars[0];
      const blockType = rmdFenceMatch[2];
      const fenceStartLine = lineIdx;
      const fenceStartLoc = getLocation(lineIdx, 0);
      const tagEndLoc = getLocation(lineIdx, line.length);

      lineIdx++;
      const blockLines: string[] = [];
      let fenceEndLine = -1;

      while (lineIdx < lines.length) {
        const checkLine = lines[lineIdx].trim();
        if (checkLine.startsWith(fenceCharType.repeat(fenceChars.length)) && checkLine.replace(new RegExp(`^\\${fenceCharType}+`), '').trim() === '') {
          fenceEndLine = lineIdx;
          break;
        }
        blockLines.push(lines[lineIdx]);
        lineIdx++;
      }

      const endLineIdx = fenceEndLine !== -1 ? fenceEndLine : lines.length - 1;
      const endLineLength = fenceEndLine !== -1 ? lines[fenceEndLine].length : lines[endLineIdx].length;
      const fenceEndLoc = getLocation(endLineIdx, endLineLength);
      const raw = source.slice(fenceStartLoc.offset, fenceEndLoc.offset);

      tokens.push({
        type: 'rmd_block',
        blockType,
        payload: blockLines.join('\n'),
        raw,
        range: { start: fenceStartLoc, end: fenceEndLoc },
        tagRange: { start: fenceStartLoc, end: tagEndLoc }
      });

      lineIdx = endLineIdx + 1;
      mdStartLine = lineIdx;
    } else {
      if (mdBuffer.length === 0) {
        mdStartLine = lineIdx;
      }
      mdBuffer.push(line);
      lineIdx++;
    }
  }

  flushMarkdown();
  return tokens;
}
