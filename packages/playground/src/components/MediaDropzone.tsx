import React, { useState, useRef } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Image,
  Video,
  Music,
  FileText,
  X,
  Sparkles,
  CheckCircle2,
  PlusCircle,
  RefreshCw,
  FilePlus2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { MediaBlockAttrs } from '@rmd/core';

interface MediaDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  hasExistingMedia?: boolean;
  onAddMedia: (mediaAttrs: MediaBlockAttrs, importMode?: 'append' | 'replace' | 'new') => void;
  onLoadRMDFile: (content: string, filename: string) => void;
}

export const MediaDropzone: React.FC<MediaDropzoneProps> = ({
  isOpen,
  onClose,
  hasExistingMedia = false,
  onAddMedia,
  onLoadRMDFile
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [urlKind, setUrlKind] = useState<'image' | 'video' | 'audio'>('image');
  const [urlMime, setUrlMime] = useState('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingMedia, setPendingMedia] = useState<MediaBlockAttrs | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFinishWithMode = (mode: 'append' | 'replace' | 'new') => {
    if (!pendingMedia) return;
    onAddMedia(pendingMedia, mode);
    setPendingMedia(null);
    setIsProcessing(false);
    onClose();
  };

  const processReadyMedia = (media: MediaBlockAttrs) => {
    if (hasExistingMedia) {
      setPendingMedia(media);
      setIsProcessing(false);
    } else {
      onAddMedia(media, 'append');
      setIsProcessing(false);
      onClose();
    }
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);
    setStatusMessage(`Analyzing ${file.name}...`);

    try {
      const fileName = file.name;
      const ext = fileName.split('.').pop()?.toLowerCase() || '';

      // 1. If RMD or Markdown document
      if (ext === 'rmd' || ext === 'md' || file.type.includes('markdown') || file.type.includes('text')) {
        if (file.size > 25 * 1024 * 1024) {
          throw new Error(`Document exceeds size limit: '${fileName}' is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Plain-text .rmd files have a 25MB safety ceiling to prevent browser memory exhaustion.`);
        }
        const text = await file.text();
        onLoadRMDFile(text, fileName);
        setIsProcessing(false);
        onClose();
        return;
      }

      const fileUrl = URL.createObjectURL(file);
      const cleanId = fileName.replace(/[^a-zA-Z0-9_\-]/g, '-').toLowerCase();

      // 2. If Image
      if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
        const img = new window.Image();
        img.src = fileUrl;
        
        await Promise.race([
          new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          }),
          new Promise((resolve) => setTimeout(resolve, 500))
        ]);

        const width = img.naturalWidth || 1200;
        const height = img.naturalHeight || 800;

        const mediaAttrs: MediaBlockAttrs = {
          id: `image-${cleanId}`,
          kind: 'image',
          src: fileUrl,
          mime: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          byteSize: file.size,
          width,
          height,
          understanding: {
            summary: `Imported image '${fileName}' (${width}x${height} px).`
          },
          retrieval: {
            priority: 'high',
            preferredEvidence: ['crop', 'ocr']
          }
        };

        processReadyMedia(mediaAttrs);
        return;
      }

      // 3. If Video
      if (file.type.startsWith('video/') || ['mp4', 'webm', 'mov', 'ogg'].includes(ext)) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = fileUrl;

        await Promise.race([
          new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(true);
            video.onerror = () => resolve(true);
          }),
          new Promise((resolve) => setTimeout(resolve, 600))
        ]);

        const duration = video.duration && !isNaN(video.duration) && video.duration > 0
          ? parseFloat(video.duration.toFixed(2))
          : Math.max(15, parseFloat((file.size / 500000).toFixed(1)));
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

        const mediaAttrs: MediaBlockAttrs = {
          id: `video-${cleanId}`,
          kind: 'video',
          src: fileUrl,
          mime: file.type || 'video/mp4',
          byteSize: file.size,
          duration,
          width,
          height,
          understanding: {
            summary: `Imported video '${fileName}' (${duration}s duration, ${width}x${height} px).`,
            scenes: [
              {
                id: 'scene-001',
                start: 0,
                end: parseFloat((duration * 0.5).toFixed(1)),
                summary: 'Initial segment of the recording.'
              }
            ]
          },
          retrieval: {
            priority: 'high',
            preferredEvidence: ['scene', 'temporal-slice']
          }
        };

        processReadyMedia(mediaAttrs);
        return;
      }

      // 4. If Audio
      if (file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'].includes(ext)) {
        const audio = document.createElement('audio');
        audio.preload = 'metadata';
        audio.src = fileUrl;

        await Promise.race([
          new Promise((resolve) => {
            audio.onloadedmetadata = () => resolve(true);
            audio.onerror = () => resolve(true);
          }),
          new Promise((resolve) => setTimeout(resolve, 600))
        ]);

        const duration = audio.duration && !isNaN(audio.duration) && audio.duration > 0
          ? parseFloat(audio.duration.toFixed(2))
          : Math.max(30, parseFloat((file.size / 24000).toFixed(1)));

        const mediaAttrs: MediaBlockAttrs = {
          id: `audio-${cleanId}`,
          kind: 'audio',
          src: fileUrl,
          mime: file.type || 'audio/mpeg',
          byteSize: file.size,
          duration,
          understanding: {
            summary: `Imported audio recording '${fileName}' (${duration}s duration).`
          },
          retrieval: {
            priority: 'normal',
            preferredEvidence: ['transcript', 'audio-slice']
          }
        };

        processReadyMedia(mediaAttrs);
        return;
      }

      // Default fallback
      const mediaAttrs: MediaBlockAttrs = {
        id: `asset-${cleanId}`,
        kind: 'document',
        src: fileUrl,
        mime: file.type || 'application/octet-stream',
        byteSize: file.size,
        understanding: {
          summary: `Imported binary asset '${fileName}'.`
        }
      };
      processReadyMedia(mediaAttrs);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Failed to process file.');
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = urlInput.trim();
    if (!trimmed) return;

    // Security check: validate protocol against javascript: or unsafe schemes
    const isSafeUrl = /^(https?:\/\/|\.\/|\/|blob:|data:(image|video|audio)\/)/i.test(trimmed);
    if (!isSafeUrl || /^(javascript|vbscript|data:text\/html):/i.test(trimmed)) {
      setErrorMessage('Security Warning: Only standard web URLs (http://, https://) and media data URIs are permitted. Malicious or script protocols are blocked.');
      return;
    }

    const cleanId = trimmed.split('/').pop()?.split('?')[0]?.replace(/[^a-zA-Z0-9_\-]/g, '-').toLowerCase() || 'remote-media';
    const mediaAttrs: MediaBlockAttrs = {
      id: `${urlKind}-${cleanId}`,
      kind: urlKind,
      src: trimmed,
      mime: urlMime || (urlKind === 'video' ? 'video/mp4' : urlKind === 'audio' ? 'audio/mpeg' : 'image/jpeg'),
      width: urlKind === 'image' ? 1200 : urlKind === 'video' ? 1920 : undefined,
      height: urlKind === 'image' ? 800 : urlKind === 'video' ? 1080 : undefined,
      duration: urlKind === 'video' ? 120.0 : urlKind === 'audio' ? 180.0 : undefined,
      understanding: {
        summary: `Remote ${urlKind} asset imported via URL.`
      }
    };

    processReadyMedia(mediaAttrs);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-white">Import Media Asset</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High-Visibility UI Warning / Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3.5 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs font-mono flex items-start gap-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <div className="font-bold text-red-300 flex items-center gap-1.5">
                <span>Guardrail Warning</span>
              </div>
              <p className="text-red-200/90 font-sans text-xs leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-100 p-1 rounded-lg hover:bg-red-900/60 transition"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* If pending media: Show Import Intent Selection */}
        {pendingMedia ? (
          <div className="p-6 space-y-4 font-mono text-xs animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Asset Analyzed: {pendingMedia.id}
              </div>
              <p className="text-slate-300 font-sans text-xs pt-1">
                Your document already contains media. How would you like to add this new asset?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-2">
              {/* Option 1: Append */}
              <button
                onClick={() => handleFinishWithMode('append')}
                className="p-3.5 bg-slate-950 hover:bg-emerald-950/40 border border-slate-700 hover:border-emerald-500 rounded-xl text-left transition flex items-start gap-3 group shadow"
              >
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-emerald-300">
                    Append as Additional Asset (Recommended)
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Adds a new section to your report for multi-asset cross-referencing.
                  </div>
                </div>
              </button>

              {/* Option 2: Replace */}
              <button
                onClick={() => handleFinishWithMode('replace')}
                className="p-3.5 bg-slate-950 hover:bg-blue-950/40 border border-slate-700 hover:border-blue-500 rounded-xl text-left transition flex items-start gap-3 group shadow"
              >
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-blue-300">
                    Replace Current Media
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Swaps out the existing media manifest with this new asset.
                  </div>
                </div>
              </button>

              {/* Option 3: New Document */}
              <button
                onClick={() => handleFinishWithMode('new')}
                className="p-3.5 bg-slate-950 hover:bg-purple-950/40 border border-slate-700 hover:border-purple-500 rounded-xl text-left transition flex items-start gap-3 group shadow"
              >
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20">
                  <FilePlus2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-100 group-hover:text-purple-300">
                    Start Fresh Document
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    Clears the workspace and creates a clean RMD file for this asset.
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/50 text-xs font-semibold font-mono">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'upload'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Local File (Drag & Drop)
              </button>
              <button
                onClick={() => setActiveTab('url')}
                className={`flex-1 py-2.5 text-center flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'url'
                    ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Remote URL
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-4">
              {activeTab === 'upload' ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileProcess(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-950/60 hover:bg-emerald-950/10 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".rmd,.md,image/*,video/*,audio/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileProcess(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="flex gap-2 text-slate-400">
                    <div className="p-2 rounded-lg bg-slate-800"><Image className="w-5 h-5 text-emerald-400" /></div>
                    <div className="p-2 rounded-lg bg-slate-800"><Video className="w-5 h-5 text-blue-400" /></div>
                    <div className="p-2 rounded-lg bg-slate-800"><Music className="w-5 h-5 text-purple-400" /></div>
                    <div className="p-2 rounded-lg bg-slate-800"><FileText className="w-5 h-5 text-amber-400" /></div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      Click to browse or drop any image, video, audio, or .rmd file
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Supports MP4, WebM, MP3, WAV, JPG, PNG, WebP, SVG, RMD
                    </p>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400 shadow">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Max 25MB for .rmd text docs • Air-gapped local memory</span>
                  </div>

                  {isProcessing && (
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                      {statusMessage}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleUrlSubmit} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-400 mb-1">Direct Media URL:</label>
                    <input
                      type="url"
                      required
                      placeholder="https://example.com/asset.mp4"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Media Kind:</label>
                      <select
                        value={urlKind}
                        onChange={(e) => {
                          const k = e.target.value as 'image' | 'video' | 'audio';
                          setUrlKind(k);
                          setUrlMime(k === 'video' ? 'video/mp4' : k === 'audio' ? 'audio/mpeg' : 'image/jpeg');
                        }}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="image">Image (jpg, png, webp)</option>
                        <option value="video">Video (mp4, webm)</option>
                        <option value="audio">Audio (mp3, wav)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">MIME Type:</label>
                      <input
                        type="text"
                        value={urlMime}
                        onChange={(e) => setUrlMime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Configure Asset
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
