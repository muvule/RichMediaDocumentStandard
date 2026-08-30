import React, { useRef, useState } from 'react';
import { MediaBlockAttrs, AnnotationBlockAttrs, TemporalSelector } from '@rmd/core';
import { Play, Pause, Volume2, Plus, Check, X, Sparkles, Quote } from 'lucide-react';

interface AudioPlayerProps {
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
    body?: { speaker?: string; text?: string };
  }) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  media,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [inTime, setInTime] = useState<number>(0);
  const [outTime, setOutTime] = useState<number>(() => Math.min(15, media.duration || 15));
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [speakerName, setSpeakerName] = useState('Speaker A');
  const [quoteText, setQuoteText] = useState('Key statement or discussion point in this audio segment.');
  const [claimText, setClaimText] = useState('Speaker emphasizes key technical tradeoff.');
  const [confidence, setConfidence] = useState(0.95);

  const temporalAnns = annotations.filter(
    (a) => a.target === media.id && a.selector && a.selector.type === 'temporal'
  );

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleInsertAudioAnnotation = () => {
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
      label: 'audio-quote',
      confidence,
      body: {
        speaker: speakerName,
        text: quoteText
      }
    });

    setShowAnchorModal(false);
  };

  const duration = media.duration || 120;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-xl p-4 space-y-3">
      {/* Hidden Audio Tag */}
      <audio
        ref={audioRef}
        src={media.src}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Audio Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-xs font-mono text-slate-200">{media.id}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {media.mime} {media.byteSize ? `| ${(media.byteSize / (1024 * 1024)).toFixed(2)} MB` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="text-purple-400 font-bold">{currentTime.toFixed(1)}s</span>
          <span>/</span>
          <span>{duration.toFixed(1)}s</span>
        </div>
      </div>

      {/* Interactive Progress Scrub Bar */}
      <div
        className="h-2.5 bg-slate-800 rounded-full cursor-pointer overflow-hidden relative group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const newTime = (clickX / rect.width) * duration;
          handleSeek(newTime);
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-75"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Play Controls & Annotation Toolbar */}
      <div className="flex items-center justify-between text-xs font-mono pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-800/80 rounded-lg transition font-bold"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play Audio'}
          </button>
        </div>

        {onAddAnnotation && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setInTime(parseFloat(currentTime.toFixed(1)))}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Set In Point"
            >
              In: {inTime.toFixed(1)}s
            </button>
            <button
              onClick={() => setOutTime(parseFloat(currentTime.toFixed(1)))}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Set Out Point"
            >
              Out: {outTime.toFixed(1)}s
            </button>
            <button
              onClick={() => setShowAnchorModal(true)}
              className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold flex items-center gap-1 transition shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              Anchor Quote
            </button>
          </div>
        )}
      </div>

      {/* Audio Annotation Form Modal */}
      {showAnchorModal && (
        <div className="p-3.5 bg-slate-950 border border-purple-500 rounded-lg space-y-3 text-xs font-mono animate-in fade-in">
          <div className="flex items-center justify-between text-purple-400 font-bold">
            <span className="flex items-center gap-1.5">
              <Quote className="w-4 h-4" />
              Anchor Audio Interval [{inTime.toFixed(1)}s ➔ {outTime.toFixed(1)}s]
            </span>
            <button onClick={() => setShowAnchorModal(false)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="text-slate-400 block mb-0.5">Speaker:</label>
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-0.5">Spoken Quote / Transcript snippet:</label>
              <input
                type="text"
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-0.5">Factual Claim:</label>
            <input
              type="text"
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setShowAnchorModal(false)}
              className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleInsertAudioAnnotation}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded flex items-center gap-1 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Insert rmd:annotation Block
            </button>
          </div>
        </div>
      )}

      {/* Temporal Audio Annotations */}
      {temporalAnns.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Grounded Audio Anchors:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {temporalAnns.map((ann) => {
              const sel = ann.selector as TemporalSelector;
              const isSelected = selectedAnnotationId === ann.id;
              const speaker = (ann.body as { speaker?: string })?.speaker;

              return (
                <button
                  key={ann.id}
                  onClick={() => {
                    onSelectAnnotation?.(ann.id);
                    handleSeek(sel.start);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono border transition flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-purple-950 border-purple-500 text-purple-300 font-bold shadow'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span>
                    {speaker ? `${speaker}: ` : ''}[{sel.start}s - {sel.end}s]
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
