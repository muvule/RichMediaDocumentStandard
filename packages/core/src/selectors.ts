import {
  Selector,
  TemporalSelector,
  SpatialSelector,
  TextRangeSelector,
  CompositeSelector,
  MediaKind
} from './types.js';

export function isTemporalSelector(s: unknown): s is TemporalSelector {
  return typeof s === 'object' && s !== null && (s as TemporalSelector).type === 'temporal';
}

export function isSpatialSelector(s: unknown): s is SpatialSelector {
  if (typeof s !== 'object' || s === null) return false;
  const type = (s as SpatialSelector).type;
  return type === 'xywh' || type === 'polygon' || type === 'normalized-xywh';
}

export function isTextRangeSelector(s: unknown): s is TextRangeSelector {
  return typeof s === 'object' && s !== null && (s as TextRangeSelector).type === 'text-range';
}

export function isCompositeSelector(s: unknown): s is CompositeSelector {
  return typeof s === 'object' && s !== null && (s as CompositeSelector).type === 'composite';
}

/**
 * Format any selector into a clear, human-readable string representation.
 */
export function formatSelector(selector?: Selector): string {
  if (!selector) return 'None';

  switch (selector.type) {
    case 'temporal':
      return `${selector.start.toFixed(1)}s - ${selector.end.toFixed(1)}s (Δ ${(selector.end - selector.start).toFixed(1)}s)`;
    case 'xywh':
    case 'normalized-xywh': {
      const unit = selector.unit ?? (selector.type === 'normalized-xywh' ? 'normalized' : 'px');
      return `x:${selector.x ?? 0}, y:${selector.y ?? 0}, w:${selector.width ?? 0}, h:${selector.height ?? 0} (${unit})`;
    }
    case 'polygon':
      return `Polygon (${selector.points?.length ?? 0} points)`;
    case 'text-range':
      return `Text [${selector.startOffset}..${selector.endOffset}]`;
    case 'composite':
      return `Composite (${selector.chain.map(formatSelector).join(' ➔ ')})`;
    default:
      return 'Unknown selector';
  }
}

/**
 * Validates whether a selector type is compatible with a given media kind.
 */
export function isSelectorCompatibleWithMedia(selector: Selector, mediaKind: MediaKind): { valid: boolean; error?: string } {
  if (selector.type === 'temporal') {
    if (mediaKind !== 'video' && mediaKind !== 'audio') {
      return {
        valid: false,
        error: `Temporal selector is only allowed on 'video' or 'audio' media, but target is '${mediaKind}'`
      };
    }
    if (selector.start < 0 || selector.end < selector.start) {
      return {
        valid: false,
        error: `Invalid temporal range: start (${selector.start}) must be >= 0 and <= end (${selector.end})`
      };
    }
  }

  if (selector.type === 'xywh' || selector.type === 'polygon' || selector.type === 'normalized-xywh') {
    if (mediaKind !== 'image' && mediaKind !== 'video' && mediaKind !== '3d') {
      return {
        valid: false,
        error: `Spatial selector is only allowed on visual media ('image', 'video', '3d'), but target is '${mediaKind}'`
      };
    }
    if (selector.type === 'xywh' || selector.type === 'normalized-xywh') {
      if ((selector.width ?? 0) <= 0 || (selector.height ?? 0) <= 0) {
        return {
          valid: false,
          error: `Spatial width and height must be positive numbers`
        };
      }
    }
  }

  if (selector.type === 'composite') {
    if (!selector.chain || selector.chain.length === 0) {
      return { valid: false, error: `Composite selector must contain at least one child selector in 'chain'` };
    }
    for (const child of selector.chain) {
      const childRes = isSelectorCompatibleWithMedia(child, mediaKind);
      if (!childRes.valid) return childRes;
    }
  }

  return { valid: true };
}

/**
 * Check if two temporal intervals overlap.
 */
export function isTemporalOverlap(a: TemporalSelector, b: TemporalSelector): boolean {
  return Math.max(a.start, b.start) < Math.min(a.end, b.end);
}
