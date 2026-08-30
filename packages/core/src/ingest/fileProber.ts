import { computeSha256 } from '../canonicalize.js';
import { DiscoveredAsset } from './types.js';

/**
 * Binary format parser for image & media dimensions without native C++ dependencies.
 */
export function probeBufferMetadata(
  buffer: Uint8Array,
  fileName: string,
  filePath: string,
  relativePath: string
): DiscoveredAsset {
  const byteSize = buffer.length;
  const sha256 = computeSha256(buffer);
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  let kind: 'image' | 'video' | 'audio' | 'document' = 'document';
  let mime = 'application/octet-stream';
  let width: number | undefined;
  let height: number | undefined;
  let duration: number | undefined;

  // 1. PNG Image
  if (
    ext === 'png' ||
    (buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47)
  ) {
    kind = 'image';
    mime = 'image/png';
    if (buffer.length >= 24) {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      width = view.getUint32(16, false);
      height = view.getUint32(20, false);
    }
  }

  // 2. JPEG Image
  else if (
    ['jpg', 'jpeg', 'jfif'].includes(ext) ||
    (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
  ) {
    kind = 'image';
    mime = 'image/jpeg';
    // Scan JPEG markers for SOF0 (0xFFC0) or SOF2 (0xFFC2)
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) {
        offset++;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        height = view.getUint16(offset + 5, false);
        width = view.getUint16(offset + 7, false);
        break;
      } else if (marker === 0xd9 || marker === 0xda) {
        break; // End of image / SOS
      } else {
        if (offset + 3 >= buffer.length) break;
        const length = (buffer[offset + 2] << 8) + buffer[offset + 3];
        offset += 2 + length;
      }
    }
    if (!width || !height) {
      width = 1920;
      height = 1080;
    }
  }

  // 3. WebP Image
  else if (
    ext === 'webp' ||
    (buffer.length > 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50)
  ) {
    kind = 'image';
    mime = 'image/webp';
    if (buffer.length >= 30) {
      // VP8X extended
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38 && buffer[15] === 0x58) {
        width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
        height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      } else {
        width = 1200;
        height = 800;
      }
    }
  }

  // 4. Video (MP4 / WebM / QuickTime)
  else if (['mp4', 'm4v', 'mov', 'webm'].includes(ext)) {
    kind = 'video';
    mime = ext === 'webm' ? 'video/webm' : 'video/mp4';
    width = 1920;
    height = 1080;
    // Scan for 'mvhd' atom in MP4
    for (let i = 0; i < buffer.length - 24; i++) {
      if (
        buffer[i] === 0x6d &&
        buffer[i + 1] === 0x76 &&
        buffer[i + 2] === 0x68 &&
        buffer[i + 3] === 0x64
      ) {
        const view = new DataView(buffer.buffer, buffer.byteOffset + i, 24);
        const version = view.getUint8(4);
        if (version === 0) {
          const timescale = view.getUint32(12, false);
          const durUnits = view.getUint32(16, false);
          if (timescale > 0) {
            duration = parseFloat((durUnits / timescale).toFixed(2));
          }
        }
        break;
      }
    }
    if (!duration || duration <= 0) {
      duration = Math.max(10, parseFloat((byteSize / 500000).toFixed(1)));
    }
  }

  // 5. Audio (MP3 / WAV / OGG / AAC / FLAC)
  else if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
    kind = 'audio';
    mime = ext === 'wav' ? 'audio/wav' : ext === 'ogg' ? 'audio/ogg' : 'audio/mpeg';
    if (ext === 'wav' && buffer.length > 36) {
      const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      const byteRate = view.getUint32(28, true);
      if (byteRate > 0) {
        duration = parseFloat(((byteSize - 44) / byteRate).toFixed(2));
      }
    }
    if (!duration || duration <= 0) {
      // Estimate 128kbps (16KB/sec) for MP3
      duration = Math.max(5, parseFloat((byteSize / 16000).toFixed(1)));
    }
  }

  return {
    filePath,
    relativePath,
    fileName,
    kind,
    mime,
    byteSize,
    sha256,
    width,
    height,
    duration
  };
}
