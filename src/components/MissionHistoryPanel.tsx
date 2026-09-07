import React, { useState, useMemo } from 'react';
import {
  History,
  X,
  Search,
  CheckCircle2,
  Clock,
  FileCode,
  Video,
  Terminal,
  ArrowRight,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { SquadMission } from '../types';

interface MissionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  missions: SquadMission[];
  activeMissionId: string;
  onSelectMission: (mission: SquadMission) => void;
  onDeleteMission?: (missionId: string) => void;
  onResetToDefaults?: () => void;
}

export const MissionHistoryPanel: React.FC<MissionHistoryPanelProps> = ({
  isOpen,
  onClose,
  missions,
  activeMissionId,
  onSelectMission,
  onDeleteMission,
  onResetToDefaults,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running'>('all');
  const [expandedMissionId, setExpandedMissionId] = useState<string | null>(null);

  const filteredMissions = useMemo(() => {
    return missions.filter((m) => {
      const matchesSearch =
        m.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.gitCommitMessage && m.gitCommitMessage.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ? true : m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [missions, searchQuery, statusFilter]);

  const handleExportMission = (m: SquadMission, e: React.MouseEvent) => {
    e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(m, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agentstation-${m.id}-manifest.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col min-h-0 text-slate-100 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Mission Execution History
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700 font-semibold">
                    {missions.length} Archived
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect artifact states, restore logs, and switch active squads
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by prompt, ID, or commit..."
                className="w-full bg-slate-950 text-xs text-slate-200 placeholder-slate-500 rounded-lg pl-9 pr-3 py-2 border border-slate-800 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter Buttons */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              {(['all', 'completed', 'running'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1 rounded capitalize font-medium transition ${
                    statusFilter === filter
                      ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Mission List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {filteredMissions.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p>No missions match your query.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              filteredMissions.map((m) => {
                const isActive = m.id === activeMissionId;
                const isExpanded = expandedMissionId === m.id;
                const filesCount = m.files?.length || 0;
                const testsPassed = m.execution?.testsPassed || 0;
                const scenesCount = m.video?.scenes?.length || 0;
                const logsCount = m.logs?.length || 0;

                return (
                  <div
                    key={m.id}
                    className={`rounded-xl border transition duration-150 overflow-hidden ${
                      isActive
                        ? 'bg-slate-950 border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Mission Card Header */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-amber-400 font-bold">
                            {m.id}
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{m.createdAt}</span>
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Active Workspace
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleExportMission(m, e)}
                            title="Export Mission JSON"
                            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteMission && missions.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteMission(m.id);
                              }}
                              title="Delete Mission"
                              className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompt Text */}
                      <p className="text-xs font-medium text-slate-200 leading-relaxed">
                        {m.prompt}
                      </p>

                      {/* Metrics Pill Grid */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-blue-400">
                          <FileCode className="w-3 h-3" />
                          <span>{filesCount} files</span>
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{testsPassed} tests passed</span>
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">
                          <Video className="w-3 h-3" />
                          <span>{scenesCount} scenes</span>
                        </span>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                          <Terminal className="w-3 h-3" />
                          <span>{logsCount} log events</span>
                        </span>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-900 gap-2">
                        <button
                          onClick={() => setExpandedMissionId(isExpanded ? null : m.id)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition font-mono"
                        >
                          <span>{isExpanded ? 'Hide Artifacts' : 'View Artifacts'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            onSelectMission(m);
                            onClose();
                          }}
                          disabled={isActive}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isActive
                              ? 'bg-slate-800 text-slate-500 cursor-default'
                              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md shadow-amber-600/20'
                          }`}
                        >
                          <span>{isActive ? 'Current State' : 'Restore & Load State'}</span>
                          {!isActive && <ArrowRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Artifact Inspector */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3 text-xs font-mono">
                        {/* Commit Info */}
                        {m.gitCommitMessage && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <GitBranch className="w-3 h-3 text-slate-500 shrink-0" />
                            <span className="truncate text-[11px]">{m.gitCommitMessage}</span>
                          </div>
                        )}

                        {/* Files List */}
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                            Generated Workspace Files:
                          </span>
                          <div className="space-y-1">
                            {m.files.map((file) => (
                              <div
                                key={file.name}
                                className="px-2 py-1 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                              >
                                <span className="text-slate-300">{file.path || file.name}</span>
                                <span className="text-slate-500 uppercase text-[10px]">{file.language}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Video Storyboard Preview */}
                        {m.video?.scenes && m.video.scenes.length > 0 && (
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                              Storyboard Scenes ({m.video.scenes.length}):
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {m.video.scenes.map((s, idx) => (
                                <div
                                  key={s.id || idx}
                                  className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[10px]"
                                >
                                  <div className="flex items-center justify-between text-slate-400">
                                    <span className="font-bold text-slate-300">{idx + 1}. {s.badge}</span>
                                    <span>{s.durationSec}s</span>
                                  </div>
                                  <p className="text-slate-400 truncate mt-0.5">{s.heading}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Reset & Seed Actions */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
            <span className="text-slate-500 font-mono text-[11px]">
              {missions.length} missions stored in session cache
            </span>

            {onResetToDefaults && (
              <button
                onClick={onResetToDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition font-mono text-xs"
                title="Reset history to sample templates"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Seed Templates</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
