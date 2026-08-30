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
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="rmdLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d1527" />
            <stop offset="50%" stopColor="#07090e" />
            <stop offset="100%" stopColor="#030407" />
          </linearGradient>

          <linearGradient id="rmdAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="rmdCyan" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          <linearGradient id="rmdSheet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <filter id="rmdGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Shield / App Icon Base */}
        <rect width="512" height="512" rx="112" fill="url(#rmdLogoBg)" stroke="#1e293b" strokeWidth="6" />

        {/* Layer 1: Back document */}
        <rect x="136" y="108" width="220" height="296" rx="20" fill="#0f172a" stroke="#334155" strokeWidth="3" opacity="0.6" transform="rotate(-6 246 256)" />

        {/* Layer 2: Main Document */}
        <g filter="url(#rmdGlow)">
          <path
            d="M 160 100 L 310 100 L 368 158 L 368 392 C 368 405.25 357.25 416 344 416 L 160 416 C 146.75 416 136 405.25 136 392 L 136 124 C 136 110.75 146.75 100 160 100 Z"
            fill="url(#rmdSheet)"
            stroke="#38bdf8"
            strokeWidth="4"
          />
          <path d="M 310 100 L 310 158 L 368 158 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3.5" strokeLinejoin="round" />
        </g>

        {/* Markdown prose bars */}
        <rect x="176" y="152" width="104" height="14" rx="7" fill="#10b981" />
        <rect x="176" y="180" width="154" height="10" rx="5" fill="#64748b" opacity="0.7" />
        <rect x="176" y="202" width="124" height="10" rx="5" fill="#64748b" opacity="0.4" />

        {/* Spatial Bounding Reticle (xywh) */}
        <g transform="translate(196, 236)">
          <rect x="0" y="0" width="144" height="136" rx="12" fill="#022c22" fillOpacity="0.6" stroke="url(#rmdAccent)" strokeWidth="3.5" strokeDasharray="8,5" />
          
          {/* Corner brackets */}
          <path d="M -6 16 L -6 -6 L 16 -6" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 128 -6 L 150 -6 L 150 16" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M -6 120 L -6 142 L 16 142" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 128 142 L 150 142 L 150 120" fill="none" stroke="#34d399" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

          {/* Crosshair core */}
          <circle cx="72" cy="68" r="18" fill="url(#rmdAccent)" />
          <circle cx="72" cy="68" r="7" fill="#ffffff" />
          <line x1="72" y1="36" x2="72" y2="48" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="72" y1="88" x2="72" y2="100" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="40" y1="68" x2="52" y2="68" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="92" y1="68" x2="104" y2="68" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />

          {/* xywh tag */}
          <rect x="8" y="10" width="46" height="16" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
          <text x="31" y="22" fill="#34d399" fontFamily="monospace" fontSize="9" fontWeight="bold" textAnchor="middle">xywh</text>
        </g>

        {/* Temporal Audio/Video Wave */}
        <path d="M 112 376 Q 148 340 188 382 T 264 360" fill="none" stroke="url(#rmdCyan)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="112" cy="376" r="6" fill="#38bdf8" />
        <circle cx="264" cy="360" r="6" fill="#10b981" />
      </svg>

      {showText && (
        <span className="font-bold text-base tracking-tight text-white font-sans">
          Rich Media Document
        </span>
      )}
    </div>
  );
};
