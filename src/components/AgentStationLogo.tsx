import React from 'react';

interface AgentStationLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  isLive?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AgentStationLogo: React.FC<AgentStationLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  isLive = true,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    sm: {
      box: 'w-7 h-7',
      icon: 28,
      title: 'text-sm font-bold',
      subtitle: 'text-[9px]',
      version: 'hidden',
    },
    md: {
      box: 'w-10 h-10',
      icon: 40,
      title: 'text-lg font-extrabold',
      subtitle: 'text-xs',
      version: 'text-[10px]',
    },
    lg: {
      box: 'w-12 h-12',
      icon: 48,
      title: 'text-xl font-black',
      subtitle: 'text-xs',
      version: 'text-xs',
    },
    xl: {
      box: 'w-16 h-16',
      icon: 64,
      title: 'text-2xl font-black',
      subtitle: 'text-sm',
      version: 'text-xs',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
    >
      {/* Station Logomark Badge */}
      <div className={`relative flex items-center justify-center ${currentSize.box} rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/80 border border-blue-500/30 shadow-lg shadow-blue-500/15 shrink-0 group`}>
        <svg
          viewBox="0 0 64 64"
          width={currentSize.icon * 0.75}
          height={currentSize.icon * 0.75}
          className="transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="logoHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="logoCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>

          {/* Hexagonal Orbital Station Shell */}
          <polygon
            points="32,8 54,20 54,44 32,56 10,44 10,20"
            fill="#0b1329"
            stroke="url(#logoHexGrad)"
            strokeWidth="2.75"
            strokeLinejoin="round"
          />

          {/* Internal Radiating Traces */}
          <line x1="32" y1="8" x2="32" y2="24" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="54" y1="44" x2="41" y2="36" stroke="#818cf8" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="10" y1="44" x2="23" y2="36" stroke="#34d399" strokeWidth="2.2" strokeLinecap="round" />

          {/* Central Nexus Core Diamond */}
          <polygon
            points="32,24 41,32 32,40 23,32"
            fill="url(#logoCoreGrad)"
            stroke="#93c5fd"
            strokeWidth="1.8"
          />
          <circle cx="32" cy="32" r="3" fill="#ffffff" />

          {/* 5 Outer Agent Nodes */}
          <circle cx="32" cy="8" r="3" fill="#38bdf8" />
          <circle cx="54" cy="20" r="2.5" fill="#60a5fa" />
          <circle cx="54" cy="44" r="3" fill="#a78bfa" />
          <circle cx="32" cy="56" r="2.5" fill="#f472b6" />
          <circle cx="10" cy="44" r="3" fill="#34d399" />
          <circle cx="10" cy="20" r="2.5" fill="#2dd4bf" />
        </svg>

        {/* Live Cluster Activity Ping */}
        {isLive && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
          </span>
        )}
      </div>

      {/* Logotype Branding */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`tracking-tight text-white font-sans ${currentSize.title}`}>
              Agent<span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Station</span>
            </span>
            <span className={`font-mono uppercase font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 ${currentSize.version}`}>
              v2.4 Fullstack
            </span>
          </div>

          {showSubtitle && (
            <p className={`text-slate-400 hidden sm:block font-normal tracking-normal ${currentSize.subtitle}`}>
              Autonomous Multi-Agent Engineering & Video Studio
            </p>
          )}
        </div>
      )}
    </div>
  );
};
