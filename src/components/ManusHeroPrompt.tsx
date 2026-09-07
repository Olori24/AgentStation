import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Terminal,
  Code2,
  Video,
  Shield,
  Layers,
  ArrowRight,
  History,
  CheckCircle2,
  Cpu,
  Github,
} from 'lucide-react';
import { SquadMission } from '../types';

interface ManusHeroPromptProps {
  onExecutePrompt: (prompt: string) => void;
  isExecuting: boolean;
  recentMissions: SquadMission[];
  onSelectMission: (mission: SquadMission) => void;
  onOpenOnboarding?: () => void;
}

const INSPIRATION_CARDS = [
  {
    id: 'kanban',
    title: 'Full-Stack Task Board',
    description: 'Enterprise task manager with SQLite persistence, REST API, drag-and-drop, and PyTest validation suite.',
    prompt: 'Build an enterprise task manager with SQLite storage, REST API, drag-and-drop Kanban, and complete PyTest suite.',
    category: 'Full-Stack Web App',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    icon: <Layers className="w-4 h-4 text-blue-400" />,
  },
  {
    id: 'crypto',
    title: 'Crypto Market Streamer',
    description: 'Real-time cryptocurrency arbitrage terminal with live WebSocket ticker, risk calculators, and alerts.',
    prompt: 'Create a high-frequency cryptocurrency arbitrage terminal with real-time WebSocket ticker and price charts.',
    category: 'Real-Time / WebSocket',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'security',
    title: 'Zero-Knowledge Auth Vault',
    description: 'Encrypted credential safe with client-side hashing, session tokens, security audits, and sandbox tests.',
    prompt: 'Build a zero-knowledge credential vault CLI and web dashboard with PBKDF2 hashing and SQLite backend.',
    category: 'Security & DevOps',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: <Shield className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'video',
    title: 'Kinetic SaaS Launch Video',
    description: 'Viral product announcement with animated kinetic typography, audio soundtrack cues, and storyboard.',
    prompt: 'Generate a kinetic 1080p SaaS launch video campaign with punchy hook scenes, audio cues, and voiceover script.',
    category: 'Video Production',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    icon: <Video className="w-4 h-4 text-purple-400" />,
  },
];

export const ManusHeroPrompt: React.FC<ManusHeroPromptProps> = ({
  onExecutePrompt,
  isExecuting,
  recentMissions,
  onSelectMission,
  onOpenOnboarding,
}) => {
  const [promptText, setPromptText] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptText.trim() || isExecuting) return;
    onExecutePrompt(promptText.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center justify-center min-h-[80vh]">
      {/* Top Manus Brand Header */}
      <div className="flex flex-col items-center text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-300 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Manus Autonomous Agent</span>
          <span className="text-slate-500">•</span>
          <span className="text-blue-400 font-bold">Virtual Computer Active</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          What can I do for you today?
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Assign a complex task, build full-stack web applications, or execute test suites. Manus plans, writes code, and executes autonomously.
        </p>
      </div>

      {/* Center Manus Omnibox */}
      <div className="w-full relative mb-10">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="relative rounded-2xl bg-slate-900/95 border border-slate-700/80 hover:border-slate-600 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 shadow-2xl transition-all duration-200">
            <div className="p-4 sm:p-5">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Assign a task or ask a question... (e.g. Build an enterprise task manager with SQLite, REST API, tests, and launch video)"
                rows={3}
                disabled={isExecuting}
                className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-base sm:text-lg focus:outline-none resize-none leading-relaxed font-sans"
                autoFocus
              />
            </div>

            {/* Bottom Bar inside Omnibox */}
            <div className="px-4 py-3 bg-slate-950/60 rounded-b-2xl border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              {/* Feature Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700/50">
                  <Code2 className="w-3 h-3 text-blue-400" />
                  Full-Stack App
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700/50">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  PyTest Sandbox
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700/50">
                  <Terminal className="w-3 h-3 text-amber-400" />
                  Browser Operator
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-mono text-[11px] border border-slate-700/50">
                  <Video className="w-3 h-3 text-purple-400" />
                  Video Studio
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!promptText.trim() || isExecuting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isExecuting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Agent Working...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Agent</span>
                    <span className="hidden sm:inline text-xs font-mono text-blue-200 ml-1">↵</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Inspiration Prompt Cards */}
      <div className="w-full space-y-3 mb-10">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick-Start Inspirations
          </span>
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition"
            >
              Take Interactive Tour →
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {INSPIRATION_CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => {
                setPromptText(card.prompt);
                onExecutePrompt(card.prompt);
              }}
              className="text-left p-4 rounded-xl bg-slate-900/70 hover:bg-slate-800/90 border border-slate-800/80 hover:border-slate-700 transition group flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                      {card.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition">
                      {card.title}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                    {card.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {card.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-slate-300 transition">
                <span>Click to launch immediately</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Missions list */}
      {recentMissions && recentMissions.length > 0 && (
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-400" />
              Recent Missions
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {recentMissions.length} saved
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentMissions.slice(0, 4).map((m) => (
              <div
                key={m.id}
                onClick={() => onSelectMission(m)}
                className="p-3 rounded-lg bg-slate-900/50 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700 transition cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition">
                    {m.prompt}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                    <span>{m.createdAt || 'Recent'}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{m.files?.length || 0} files</span>
                    <span>•</span>
                    <span>{m.execution?.testsPassed || 0} tests passed</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1 text-xs text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
