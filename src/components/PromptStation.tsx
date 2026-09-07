import React, { useState } from 'react';
import { Play, Sparkles, Terminal, Video, Shield, CheckCircle2 } from 'lucide-react';
import { PROMPT_PRESETS } from '../data/defaults';

interface PromptStationProps {
  onExecutePrompt: (prompt: string) => void;
  isExecuting: boolean;
  onOpenOnboarding?: () => void;
}

export const PromptStation: React.FC<PromptStationProps> = ({
  onExecutePrompt,
  isExecuting,
  onOpenOnboarding,
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isExecuting) return;
    onExecutePrompt(prompt.trim());
  };

  const handleSelectPreset = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    if (!isExecuting) {
      onExecutePrompt(presetPrompt);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-2">
      {/* Search / Command Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-2 sm:p-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-3 px-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should the agent squad build? (e.g. Build an encryption CLI and make a launch teaser video)..."
                disabled={isExecuting}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!prompt.trim() || isExecuting}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Squad Working...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Squad</span>
                </>
              )}
            </button>
          </div>

          {/* Feature toggles indicators */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 px-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Full-Stack Code</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                <Shield className="w-3.5 h-3.5" />
                <span>PyTest Sandbox</span>
              </span>
              <span className="flex items-center gap-1.5 text-purple-400 font-mono">
                <Video className="w-3.5 h-3.5" />
                <span>Kinetic Video & Audio</span>
              </span>
            </div>
            <div className="font-mono text-slate-500">
              Synced to <span className="text-blue-400">Olori24/AgentStation:main</span>
            </div>
          </div>
        </div>
      </form>

      {/* Preset Pills */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition min-w-max shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Test Drive Real Use Cases</span>
          </button>
        )}

        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 min-w-max">
          <span>Presets:</span>
        </span>
        {PROMPT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectPreset(p.prompt)}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition min-w-max disabled:opacity-50"
          >
            <span>{p.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-blue-400 font-mono">
              {p.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
