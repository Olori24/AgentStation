import React from 'react';
import { GitBranch, Github, Cpu, Radio, Sparkles, History, CheckCircle2, AlertCircle, Loader2, Server, Plus } from 'lucide-react';
import { GITHUB_REPO_INFO } from '../data/defaults';
import { CiStatusInfo } from '../types';
import { AgentStationLogo } from './AgentStationLogo';

interface HeaderProps {
  onOpenGitHub: () => void;
  onOpenOllama: () => void;
  onOpenFullStack?: () => void;
  onNewMission: () => void;
  onOpenHistory: () => void;
  onOpenOnboarding: () => void;
  historyCount?: number;
  isExecuting: boolean;
  aiProvider?: 'gemini' | 'ollama';
  ollamaModel?: string;
  ciStatus?: CiStatusInfo | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGitHub,
  onOpenOllama,
  onOpenFullStack,
  onNewMission,
  onOpenHistory,
  onOpenOnboarding,
  historyCount = 0,
  isExecuting,
  aiProvider = 'gemini',
  ollamaModel = 'llama3',
  ciStatus,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <AgentStationLogo
          size="md"
          showText={true}
          showSubtitle={true}
          isLive={true}
          onClick={onNewMission}
        />

        <button
          onClick={onNewMission}
          title="Start a new task with a simple prompt"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Prompt</span>
        </button>
      </div>

      {/* Center cluster status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
        <Radio className={`w-3.5 h-3.5 ${isExecuting ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
        <span className="text-slate-300">
          {isExecuting ? 'Squad Active: Synthesizing Mission...' : 'Cluster: 5 Agents Synchronized'}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
        <span className="text-slate-400">Gemini 2.5 + Ollama Bridge</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenOnboarding}
          title="Quickstart & Real Use Case Test Drive"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Test Drive & Onboard</span>
          <span className="sm:hidden">Test Drive</span>
        </button>

        <button
          onClick={onOpenHistory}
          title="Mission History Archive"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <History className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">History</span>
          {historyCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
              {historyCount}
            </span>
          )}
        </button>

        {onOpenFullStack && (
          <button
            onClick={onOpenFullStack}
            title="Full-Stack Operations Center (DB, Auth RBAC, Real-time SSE, Job Queue, Sandbox, Artifacts)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 hover:text-indigo-200 transition shadow-sm"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Full-Stack Ops</span>
            <span className="sm:hidden">Ops</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline"></span>
          </button>
        )}

        <button
          onClick={onOpenOllama}
          title={`Configure AI Provider (Active: ${aiProvider === 'gemini' ? 'Gemini 2.5 Flash' : `Ollama ${ollamaModel}`})`}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
            aiProvider === 'ollama'
              ? 'bg-purple-950/60 border-purple-500/50 text-purple-200 hover:bg-purple-900/60'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          <Cpu className={`w-3.5 h-3.5 ${aiProvider === 'ollama' ? 'text-purple-300' : 'text-purple-400'}`} />
          <span className="hidden sm:inline">
            {aiProvider === 'ollama' ? `Ollama: ${ollamaModel}` : 'AI Engine'}
          </span>
          {aiProvider === 'ollama' && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={onOpenGitHub}
          title="GitHub Repository & Push Guide"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition"
        >
          <Github className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Repo:</span>
          <span className="font-mono text-blue-400">{GITHUB_REPO_INFO.owner}/{GITHUB_REPO_INFO.repo}</span>
          <GitBranch className="w-3 h-3 text-slate-500" />
        </button>

        {ciStatus && (
          <a
            href={ciStatus.runUrl || `https://github.com/${GITHUB_REPO_INFO.owner}/${GITHUB_REPO_INFO.repo}/actions`}
            target="_blank"
            rel="noopener noreferrer"
            title={`GitHub Actions CI/CD: ${ciStatus.status} (${ciStatus.conclusion || 'running'}) - Run #${ciStatus.runNumber || ''} (SHA: ${ciStatus.commitSha || ''})`}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border transition ${
              ciStatus.conclusion === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400'
                : ciStatus.status === 'in_progress' || ciStatus.status === 'queued'
                ? 'bg-amber-950/50 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                : 'bg-red-950/50 border-red-500/40 text-red-300 hover:bg-red-900/50'
            }`}
          >
            {ciStatus.conclusion === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : ciStatus.status === 'in_progress' || ciStatus.status === 'queued' ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span>CI:</span>
            <span className="capitalize font-semibold">
              {ciStatus.conclusion === 'success' ? 'Passing' : ciStatus.conclusion || ciStatus.status}
            </span>
          </a>
        )}

        <button
          onClick={onNewMission}
          disabled={isExecuting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Mission</span>
        </button>
      </div>
    </header>
  );
};
