import React from 'react';
import { MediaBlockAttrs, AnnotationBlockAttrs } from '@rmd/core';
import { Image, Video, Music, FileText, Plus, Layers, Filter } from 'lucide-react';

interface AssetFilmstripProps {
  assets: MediaBlockAttrs[];
  annotations: AnnotationBlockAttrs[];
  selectedAssetId?: string;
  onSelectAsset: (assetId?: string) => void;
  onOpenDropzone: () => void;
}

export const AssetFilmstrip: React.FC<AssetFilmstripProps> = ({
  assets,
  annotations,
  selectedAssetId,
  onSelectAsset,
  onOpenDropzone
}) => {
  if (assets.length === 0) return null;

  const getKindIcon = (kind: string) => {
    switch (kind) {
      case 'image':
        return <Image className="w-3.5 h-3.5 text-emerald-400" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-2 flex items-center justify-between gap-3 shadow-md select-none font-mono text-xs">
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-[80%]">
        {/* View All Button */}
        <button
          onClick={() => onSelectAsset(undefined)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition ${
            !selectedAssetId
              ? 'bg-slate-800 border-slate-600 text-white font-bold shadow'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3 h-3 text-emerald-400" />
          <span>All ({assets.length})</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        {/* Individual Asset Chips */}
        {assets.map((asset, idx) => {
          const isSelected = selectedAssetId === asset.id;
          const anchorCount = annotations.filter((a) => a.target === asset.id).length;

          return (
            <button
              key={asset.id}
              onClick={() => onSelectAsset(isSelected ? undefined : asset.id)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition whitespace-nowrap ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500/80 text-emerald-300 font-bold shadow ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              {getKindIcon(asset.kind)}
              <span className="truncate max-w-[130px]">{asset.id}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  anchorCount > 0
                    ? isSelected
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-slate-800 text-emerald-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {anchorCount} {anchorCount === 1 ? 'anchor' : 'anchors'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add Media Quick Action */}
      <button
        onClick={onOpenDropzone}
        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg transition font-bold shadow-sm whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" />
        + Add Media
      </button>
    </div>
  );
};
