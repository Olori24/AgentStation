import React, { useState } from 'react';
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  Cpu,
  Github,
  PanelLeftClose,
  PanelLeft,
  Server,
  HelpCircle,
  ExternalLink,
  Bot,
} from 'lucide-react';
import { SquadMission } from '../types';

interface ManusSidebarProps {
  missions: SquadMission[];
  currentMissionId?: string;
  onSelectMission: (mission: SquadMission) => void;
  onNewTask: () => void;
  onDeleteMission?: (id: string) => void;
  isExecuting: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenGitHub?: () => void;
  onOpenOllama?: () => void;
  onOpenFullStack?: () => void;
  onOpenOnboarding?: () => void;
  aiProvider: 'gemini' | 'ollama';
}

export const ManusSidebar: React.FC<ManusSidebarProps> = ({
  missions,
  currentMissionId,
  onSelectMission,
  onNewTask,
  onDeleteMission,
  isExecuting,
  isOpen,
  onToggleOpen,
  onOpenGitHub,
  onOpenOllama,
  onOpenFullStack,
  onOpenOnboarding,
  aiProvider,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMissions = missions.filter((m) =>
    m.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) {
    return (
      <div className="w-14 bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-3 justify-between shrink-0 select-none">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleOpen}
            title="Expand Sidebar"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          <button
            onClick={onNewTask}
            title="New Task (Ctrl+K)"
            disabled={isExecuting}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/30 transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 text-slate-500">
          <button
            onClick={onOpenGitHub}
            title="GitHub Sync"
            className="p-2 rounded-lg hover:text-slate-200 hover:bg-slate-850 transition"
          >
            <Github className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenOllama}
            title="AI Model Settings"
            className="p-2 rounded-lg hover:text-slate-200 hover:bg-slate-850 transition"
          >
            <Cpu className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none h-full min-h-0 text-slate-200 font-sans">
      {/* Top Header & New Task Button */}
      <div className="p-3.5 pb-2 border-b border-slate-800/70">
        {/* Brand Bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-white">Manus</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-blue-400 border border-slate-700 font-semibold">
                  AGENT
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onToggleOpen}
            title="Collapse Sidebar"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-850 transition"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary + New Task Button */}
        <button
          onClick={onNewTask}
          disabled={isExecuting}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition disabled:opacity-40"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </div>
          <span className="text-[10px] font-mono bg-blue-700/80 px-1.5 py-0.5 rounded text-blue-100">
            ⌘K
          </span>
        </button>

        {/* Search Bar */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-900/90 text-slate-200 placeholder-slate-500 rounded-lg border border-slate-800/80 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Task History List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin min-h-0">
        <div className="px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
          <span>Recent Tasks</span>
          <span>{filteredMissions.length}</span>
        </div>

        {filteredMissions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 px-3">
            No matching tasks found.
          </div>
        ) : (
          filteredMissions.map((m) => {
            const isSelected = m.id === currentMissionId;
            return (
              <div
                key={m.id}
                onClick={() => onSelectMission(m)}
                className={`group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition ${
                  isSelected
                    ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/80 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-blue-400' : 'bg-slate-600 group-hover:bg-slate-400'
                      }`}
                    />
                    <div className="truncate text-xs text-slate-200 group-hover:text-white">
                      {m.prompt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-1 pl-3">
                    <span>{m.createdAt || 'Recent'}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{m.files?.length || 0} files</span>
                    <span>•</span>
                    <span>{m.execution?.testsPassed || 0} tests</span>
                  </div>
                </div>

                {onDeleteMission && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMission(m.id);
                    }}
                    title="Delete task"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Settings & Status */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950/60">
        {/* Model Status Pill */}
        <button
          onClick={onOpenOllama}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 text-[11px] text-slate-300 transition"
        >
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate">
              {aiProvider === 'gemini' ? 'Gemini 2.5 Flash' : 'Local Ollama'}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* GitHub Repository Sync */}
        <button
          onClick={onOpenGitHub}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800/80 text-[11px] text-slate-300 transition"
        >
          <div className="flex items-center gap-2">
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Olori24/AgentStation</span>
          </div>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </button>

        {/* Full-Stack Ops & Guide */}
        <div className="flex items-center gap-2 pt-1">
          {onOpenFullStack && (
            <button
              onClick={onOpenFullStack}
              className="flex-1 py-1 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 text-center transition flex items-center justify-center gap-1"
            >
              <Server className="w-3 h-3 text-amber-400" />
              <span>Full-Stack</span>
            </button>
          )}

          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="flex-1 py-1 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 text-center transition flex items-center justify-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-emerald-400" />
              <span>Tour</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
