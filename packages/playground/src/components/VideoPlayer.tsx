import React, { useRef, useState } from 'react';
import { MediaBlockAttrs, AnnotationBlockAttrs, TemporalSelector } from '@rmd/core';
import { Play, Pause, Clock, Film, Plus, Check, X, Sparkles } from 'lucide-react';

interface VideoPlayerProps {
  media: MediaBlockAttrs;
  annotations: AnnotationBlockAttrs[];
  selectedAnnotationId?: string;
  onSelectAnnotation?: (id: string) => void;
  onAddAnnotation?: (ann: {
    target: string;
    selector: TemporalSelector;
    claim: string;
    label: string;
    confidence: number;
  }) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  media,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [inTime, setInTime] = useState<number>(0);
  const [outTime, setOutTime] = useState<number>(() => Math.min(10, media.duration || 10));
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [claimText, setClaimText] = useState('Critical event observed during this video interval.');
  const [labelText, setLabelText] = useState('event-anchor');
  const [confidence, setConfidence] = useState(0.95);

  const temporalAnns = annotations.filter(
    (a) => a.target === media.id && a.selector && a.selector.type === 'temporal'
  );

  const scenes = (media.understanding as { scenes?: Array<{ id: string; start: number; end: number; summary: string }> })?.scenes ?? [];

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleInsertTemporal = () => {
    if (!onAddAnnotation) return;
    const start = Math.min(inTime, outTime);
    const end = Math.max(inTime, outTime);

    onAddAnnotation({
      target: media.id,
      selector: {
        type: 'temporal',
        start: parseFloat(start.toFixed(1)),
        end: parseFloat(end.toFixed(1))
      },
      claim: claimText,
      label: labelText,
      confidence
    });

    setShowAnchorModal(false);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-xl space-y-2">
      {/* Video Viewport */}
      <div className="relative bg-black aspect-video flex items-center justify-center">
        <video
          ref={videoRef}
          src={media.src}
          className="w-full h-full object-contain"
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onEnded={() => setIsPlaying(false)}
          controls={false}
        />

        {/* Video Overlay Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-xs font-mono text-slate-300 border border-slate-700">
          <Film className="w-3.5 h-3.5 text-blue-400" />
          <span>{media.id}</span>
          <span className="text-slate-500">|</span>
          <span>{currentTime.toFixed(1)}s / {(media.duration || 0).toFixed(1)}s</span>
        </div>

        {/* Big Center Play/Pause button on hover */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white flex items-center justify-center transition-all opacity-0 hover:opacity-100 shadow-lg border border-slate-600"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
      </div>

      {/* Control Timeline & Authoring Bar */}
      <div className="p-3 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition font-bold"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <span className="text-emerald-400 font-semibold">{currentTime.toFixed(1)}s</span>
          </div>

          {/* Temporal In/Out Marker Buttons */}
          {onAddAnnotation && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInTime(parseFloat(currentTime.toFixed(1)))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                In: {inTime.toFixed(1)}s
              </button>
              <button
                onClick={() => setOutTime(parseFloat(currentTime.toFixed(1)))}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Out: {outTime.toFixed(1)}s
              </button>
              <button
                onClick={() => setShowAnchorModal(true)}
                className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center gap-1 transition shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Anchor Interval
              </button>
            </div>
          )}
        </div>

        {/* Modal/Form to Insert Temporal Annotation */}
        {showAnchorModal && (
          <div className="p-3 bg-slate-950 border border-emerald-500 rounded-lg space-y-2 text-xs font-mono animate-in fade-in">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Add Temporal Anchor [{inTime.toFixed(1)}s ➔ {outTime.toFixed(1)}s]
              </span>
              <button onClick={() => setShowAnchorModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-slate-400 block mb-0.5">Label:</label>
                <input
                  type="text"
                  value={labelText}
                  onChange={(e) => setLabelText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-400 block mb-0.5">Evidence Claim:</label>
                <input
                  type="text"
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowAnchorModal(false)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertTemporal}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded flex items-center gap-1 transition"
              >
                <Check className="w-3.5 h-3.5" />
                Insert rmd:annotation Block
              </button>
            </div>
          </div>
        )}

        {/* Interactive Scenes Timeline */}
        {scenes.length > 0 && (
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              Indexed Scene Intervals:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {scenes.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSeek(sc.start)}
                  className="p-1.5 bg-slate-800/80 hover:bg-blue-950/60 hover:border-blue-500 border border-slate-700 rounded text-left transition text-xs"
                >
                  <div className="font-mono text-[10px] text-blue-400 font-bold">
                    {sc.id} [{sc.start}s - {sc.end}s]
                  </div>
                  <div className="text-slate-300 truncate text-[11px] mt-0.5">{sc.summary}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Temporal Annotations Jump Buttons */}
        {temporalAnns.length > 0 && (
          <div className="space-y-1 pt-1 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Evidence Anchors:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {temporalAnns.map((ann) => {
                const sel = ann.selector as TemporalSelector;
                const isSelected = selectedAnnotationId === ann.id;
                return (
                  <button
                    key={ann.id}
                    onClick={() => {
                      onSelectAnnotation?.(ann.id);
                      handleSeek(sel.start);
                    }}
                    className={`px-2 py-1 rounded text-xs font-mono border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                        : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>{ann.id} [{sel.start}s - {sel.end}s]</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
