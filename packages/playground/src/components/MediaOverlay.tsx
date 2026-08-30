import React, { useState, useRef } from 'react';
import { MediaBlockAttrs, AnnotationBlockAttrs, SpatialSelector } from '@rmd/core';
import { Layers, Crosshair, Plus, Check, X, Sparkles } from 'lucide-react';

interface MediaOverlayProps {
  media: MediaBlockAttrs;
  annotations: AnnotationBlockAttrs[];
  selectedAnnotationId?: string;
  onSelectAnnotation?: (id: string) => void;
  onAddAnnotation?: (ann: {
    target: string;
    selector: SpatialSelector;
    claim: string;
    label: string;
    confidence: number;
  }) => void;
}

export const MediaOverlay: React.FC<MediaOverlayProps> = ({
  media,
  annotations,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation
}) => {
  const [hoveredAnnId, setHoveredAnnId] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [pendingBox, setPendingBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Form fields for newly drawn box
  const [newLabel, setNewLabel] = useState('defect-region');
  const [newClaim, setNewClaim] = useState('Anomaly identified in selected bounding region.');
  const [newConfidence, setNewConfidence] = useState(0.95);

  const containerRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawingMode(false);
        setPendingBox(null);
        setCurrentBox(null);
        setIsDragging(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Spatial annotations targeting this media
  const spatialAnns = annotations.filter(
    (a) => a.target === media.id && a.selector && (a.selector.type === 'xywh' || a.selector.type === 'normalized-xywh')
  );

  const imgWidth = media.width || 1200;
  const imgHeight = media.height || 800;

  const getImageCoordinates = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = imgWidth / rect.width;
    const scaleY = imgHeight / rect.height;

    return {
      x: Math.round(clientX * scaleX),
      y: Math.round(clientY * scaleY)
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawingMode) return;
    const coords = getImageCoordinates(e);
    setDragStart(coords);
    setIsDragging(true);
    setCurrentBox({ x: coords.x, y: coords.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingMode || !isDragging || !dragStart) return;
    const coords = getImageCoordinates(e);

    const x = Math.max(0, Math.min(dragStart.x, coords.x));
    const y = Math.max(0, Math.min(dragStart.y, coords.y));
    const width = Math.min(imgWidth - x, Math.abs(coords.x - dragStart.x));
    const height = Math.min(imgHeight - y, Math.abs(coords.y - dragStart.y));

    setCurrentBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawingMode || !isDragging || !currentBox) return;
    setIsDragging(false);
    if (currentBox.width > 20 && currentBox.height > 20) {
      setPendingBox(currentBox);
    }
    setCurrentBox(null);
  };

  const handleSavePendingBox = () => {
    if (!pendingBox || !onAddAnnotation) return;
    const selector: SpatialSelector = {
      type: 'xywh',
      unit: 'pixel',
      x: pendingBox.x,
      y: pendingBox.y,
      width: pendingBox.width,
      height: pendingBox.height
    };

    onAddAnnotation({
      target: media.id,
      selector,
      label: newLabel,
      claim: newClaim,
      confidence: newConfidence
    });

    setPendingBox(null);
    setIsDrawingMode(false);
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shadow-xl select-none ${
          isDrawingMode ? 'cursor-crosshair ring-2 ring-emerald-500/80' : ''
        }`}
      >
        {/* Media Image */}
        <img
          src={media.src}
          alt={media.id}
          className="w-full h-auto object-cover block pointer-events-none"
          style={{ aspectRatio: `${imgWidth} / ${imgHeight}` }}
        />

        {/* SVG Overlay for Existing & Drawing Bounding Boxes */}
        <svg
          viewBox={`0 0 ${imgWidth} ${imgHeight}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* Existing Annotations */}
          {spatialAnns.map((ann) => {
            const sel = ann.selector as SpatialSelector;
            const isSelected = selectedAnnotationId === ann.id;
            const isHovered = hoveredAnnId === ann.id;
            const isCritical = (ann.body as { severity?: string })?.severity === 'critical';

            const strokeColor = isSelected
              ? '#22c55e'
              : isCritical
              ? '#ef4444'
              : isHovered
              ? '#38bdf8'
              : '#eab308';
            const fillColor = isSelected
              ? 'rgba(34, 197, 94, 0.25)'
              : isCritical
              ? 'rgba(239, 68, 68, 0.2)'
              : 'rgba(234, 179, 8, 0.15)';

            const isNormalized = sel.type === 'normalized-xywh' || sel.unit === 'normalized';
            const isPercent = sel.unit === 'percent';

            const rawX = sel.x ?? 0;
            const rawY = sel.y ?? 0;
            const rawW = sel.width ?? (isNormalized ? 0.2 : 100);
            const rawH = sel.height ?? (isNormalized ? 0.2 : 100);

            const x = isNormalized ? rawX * imgWidth : isPercent ? (rawX / 100) * imgWidth : rawX;
            const y = isNormalized ? rawY * imgHeight : isPercent ? (rawY / 100) * imgHeight : rawY;
            const w = isNormalized ? rawW * imgWidth : isPercent ? (rawW / 100) * imgWidth : rawW;
            const h = isNormalized ? rawH * imgHeight : isPercent ? (rawH / 100) * imgHeight : rawH;

            return (
              <g
                key={ann.id}
                className={isDrawingMode ? '' : 'cursor-pointer pointer-events-auto transition-all duration-150'}
                onClick={() => !isDrawingMode && onSelectAnnotation?.(ann.id)}
                onMouseEnter={() => setHoveredAnnId(ann.id)}
                onMouseLeave={() => setHoveredAnnId(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected || isHovered ? 4 : 2}
                  strokeDasharray={isSelected ? 'none' : '4,2'}
                  rx={4}
                />
                <rect
                  x={x}
                  y={Math.max(0, y - 28)}
                  width={Math.max(140, (ann.claim?.length ?? 10) * 6)}
                  height={26}
                  fill="rgba(15, 23, 42, 0.9)"
                  rx={4}
                />
                <text
                  x={x + 8}
                  y={Math.max(18, y - 10)}
                  fill={strokeColor}
                  fontSize={13}
                  fontWeight="bold"
                  fontFamily="system-ui"
                >
                  {ann.id} ({((ann.confidence ?? 0.95) * 100).toFixed(0)}%)
                </text>
              </g>
            );
          })}

          {/* Real-time Drawing Box */}
          {currentBox && (
            <rect
              x={currentBox.x}
              y={currentBox.y}
              width={currentBox.width}
              height={currentBox.height}
              fill="rgba(34, 197, 94, 0.3)"
              stroke="#22c55e"
              strokeWidth={3}
              strokeDasharray="6,3"
              rx={4}
            />
          )}

          {/* Pending Finalized Box */}
          {pendingBox && (
            <rect
              x={pendingBox.x}
              y={pendingBox.y}
              width={pendingBox.width}
              height={pendingBox.height}
              fill="rgba(34, 197, 94, 0.4)"
              stroke="#22c55e"
              strokeWidth={4}
              rx={4}
            />
          )}
        </svg>

        {/* Asset Header Toolbar */}
        <div className="absolute top-2 left-2 flex items-center gap-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-xs font-mono text-slate-300 border border-slate-700">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>{media.id}</span>
          <span className="text-slate-500">|</span>
          <span>{imgWidth}x{imgHeight}</span>
          <span className="text-slate-500">|</span>
          <span className="text-emerald-400">{spatialAnns.length} anchors</span>
        </div>

        {/* Draw BBox Tool Button */}
        {onAddAnnotation && (
          <div className="absolute top-2 right-2">
            <button
              onClick={() => {
                setIsDrawingMode(!isDrawingMode);
                setPendingBox(null);
              }}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-lg ${
                isDrawingMode
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                  : 'bg-slate-900/90 text-slate-200 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              {isDrawingMode ? 'Drawing Active (Click & Drag)' : '+ Draw BBox'}
            </button>
          </div>
        )}
      </div>

      {/* Popover Form to Save Newly Drawn Box */}
      {pendingBox && (
        <div className="p-3.5 bg-slate-900 border border-emerald-500 rounded-lg shadow-xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Create Spatial Annotation [x:{pendingBox.x}, y:{pendingBox.y}, {pendingBox.width}x{pendingBox.height} px]
            </span>
            <button onClick={() => setPendingBox(null)} className="text-slate-400 hover:text-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-0.5">Label ID:</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 block mb-0.5">Factual Claim / Observation:</label>
              <input
                type="text"
                value={newClaim}
                onChange={(e) => setNewClaim(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs font-mono">
            <button
              onClick={() => setPendingBox(null)}
              className="px-3 py-1 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePendingBox}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded flex items-center gap-1 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Insert rmd:annotation Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
