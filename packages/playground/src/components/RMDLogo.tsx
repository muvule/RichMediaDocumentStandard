import React from 'react';

interface RMDLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const RMDLogo: React.FC<RMDLogoProps> = ({
  size = 32,
  className = '',
  showText = false
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        <defs>
          <linearGradient id="rmdLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="60%" stopColor="#059669" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="rmdGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <linearGradient id="sheetBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#162032" />
            <stop offset="100%" stopColor="#0b1322" />
          </linearGradient>
        </defs>

        {/* Outer App Shield / Badge */}
        <rect x="3" y="3" width="94" height="94" rx="22" fill="#080e1a" stroke="#1e293b" strokeWidth="3" />
        
        {/* Soft Ambient Inner Glow */}
        <rect x="18" y="16" width="64" height="68" rx="12" fill="#10b981" fillOpacity="0.12" />

        {/* Document Sheet Shape */}
        <path
          d="M 28 18 L 56 18 L 74 36 L 74 78 C 74 81.3 71.3 84 68 84 L 28 84 C 24.7 84 22 81.3 22 78 L 22 24 C 22 20.7 24.7 18 28 18 Z"
          fill="url(#sheetBgGrad)"
          stroke="url(#rmdGlowGrad)"
          strokeWidth="3.5"
        />
        {/* Folded Corner */}
        <path d="M 56 18 L 56 36 L 74 36 Z" fill="#1e293b" stroke="url(#rmdGlowGrad)" strokeWidth="3" />

        {/* Markdown Prose Header Bar */}
        <line x1="30" y1="32" x2="48" y2="32" stroke="#34d399" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="30" y1="42" x2="64" y2="42" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />

        {/* Spatial Bounding Box Reticle Brackets (xywh) */}
        {/* Top-Left */}
        <path d="M 33 57 L 33 50 L 41 50" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Top-Right */}
        <path d="M 59 50 L 67 50 L 67 57" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom-Left */}
        <path d="M 33 67 L 33 74 L 41 74" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom-Right */}
        <path d="M 59 74 L 67 74 L 67 67" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Center Target Focal Point */}
        <circle cx="50" cy="62" r="5" fill="url(#rmdLogoGrad)" />
        <circle cx="50" cy="62" r="2" fill="#ffffff" />
      </svg>

      {showText && (
        <span className="font-bold text-sm sm:text-base tracking-tight text-white font-sans">
          Rich Media Document
        </span>
      )}
    </div>
  );
};
