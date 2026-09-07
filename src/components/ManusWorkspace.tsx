import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Send,
  CheckCircle2,
  Clock,
  Compass,
  Code2,
  ShieldCheck,
  Film,
  Check,
  ChevronRight,
  RotateCcw,
  Terminal,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';
import {
  SquadMission,
  AgentProfile,
  AgentRole,
  WorkspaceFile,
  VideoProject,
  TestExecutionResult,
} from '../types';
import { AgentActivityStream } from './AgentActivityStream';
import { CodeWorkspace } from './CodeWorkspace';

interface ManusWorkspaceProps {
  mission: SquadMission;
  agents: AgentProfile[];
  isExecuting: boolean;
  activeAgentRole?: AgentRole;
  onExecuteFollowUpPrompt: (prompt: string) => void;
  onRunCommand: (command: string) => Promise<void>;
  isRunningCommand: boolean;
  streamingTerminalOutput?: string;
  isStreamingTerminal?: boolean;
  isWsConnected?: boolean;
  onClearTerminal?: () => void;
  onUpdateFile?: (fileIndex: number, newContent: string) => void;
  onAddFile?: (newFile: WorkspaceFile) => void;
  onDeleteFile?: (fileIndex: number) => void;
  onUpdateVideo?: (updated: VideoProject) => void;
  onPushToGitHub?: () => void;
  onNewMission: () => void;
}

const STAGES = [
  { id: 'architect', label: 'Plan & Architect', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'developer', label: 'Generate Code', icon: <Code2 className="w-3.5 h-3.5" /> },
  { id: 'qa', label: 'Sandbox & PyTest', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: 'video_producer', label: 'Video Studio', icon: <Film className="w-3.5 h-3.5" /> },
  { id: 'delivery', label: 'Ready to Run', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
];

const FOLLOW_UP_SUGGESTIONS = [
  'Add dark mode theme toggle',
  'Run pytest -v in sandbox',
  'Add input validation & error toasts',
  'Generate full documentation in README.md',
];

export const ManusWorkspace: React.FC<ManusWorkspaceProps> = ({
  mission,
  agents,
  isExecuting,
  activeAgentRole,
  onExecuteFollowUpPrompt,
  onRunCommand,
  isRunningCommand,
  streamingTerminalOutput,
  isStreamingTerminal = false,
  isWsConnected = false,
  onClearTerminal,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onUpdateVideo,
  onPushToGitHub,
  onNewMission,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isExecuting) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExecuting]);

  const handleFollowUpSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followUpText.trim() || isExecuting) return;
    onExecuteFollowUpPrompt(followUpText.trim());
    setFollowUpText('');
  };

  const getStageStatus = (stageId: string, index: number) => {
    if (!isExecuting) return 'completed';
    const roleOrder = ['architect', 'developer', 'qa', 'video_producer', 'delivery'];
    const currentIdx = activeAgentRole ? roleOrder.indexOf(activeAgentRole) : 1;
    if (index < currentIdx) return 'completed';
    if (index === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      {/* Workspace Subheader / Stage Stepper */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Mission Title & Status */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onNewMission}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition shrink-0"
              title="Start a fresh new prompt"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>New Task</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  Goal:
                </span>
                <span className="text-sm font-semibold text-slate-100 truncate max-w-md sm:max-w-xl">
                  {mission.prompt}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {isExecuting ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Squad Working ({elapsedSeconds}s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mission Completed & Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* 5-Step Autonomous Pipeline Bar */}
        <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {STAGES.map((stage, idx) => {
            const status = getStageStatus(stage.id, idx);
            return (
              <div key={stage.id} className="flex items-center gap-2 min-w-max">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    status === 'active'
                      ? 'bg-blue-600 text-white shadow-sm font-bold animate-pulse'
                      : status === 'completed'
                      ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                      : 'bg-slate-950 text-slate-500 border border-slate-800/50'
                  }`}
                >
                  {status === 'completed' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    stage.icon
                  )}
                  <span>{stage.label}</span>
                </div>
                {idx < STAGES.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dual-Pane Manus Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-3 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[760px]">
          {/* Left Column: Autonomous Squad Activity & Follow-up Chat (4 cols) */}
          <div className="lg:col-span-4 h-full flex flex-col gap-3 min-h-0">
            {/* Real-time Activity Stream */}
            <div className="flex-1 min-h-0">
              <AgentActivityStream logs={mission.logs} isExecuting={isExecuting} />
            </div>

            {/* Follow-up Prompt Input Box (Manus Chat) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl">
              <div className="text-[11px] font-mono text-slate-400 font-semibold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1 text-blue-400">
                  <Sparkles className="w-3 h-3" />
                  Direct Agent Squad
                </span>
                <span className="text-[10px] text-slate-500">Refine or add feature</span>
              </div>

              <form onSubmit={handleFollowUpSubmit} className="relative">
                <input
                  type="text"
                  value={followUpText}
                  onChange={(e) => setFollowUpText(e.target.value)}
                  placeholder="e.g. Add dark mode, run tests, fix styling..."
                  disabled={isExecuting}
                  className="w-full bg-slate-950 text-slate-100 text-xs rounded-xl pl-3 pr-10 py-2.5 border border-slate-700/80 focus:outline-none focus:border-blue-500 font-sans disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!followUpText.trim() || isExecuting}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition"
                  title="Send prompt to squad"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick follow-up pills */}
              <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
                {FOLLOW_UP_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFollowUpText(suggestion);
                      onExecuteFollowUpPrompt(suggestion);
                    }}
                    disabled={isExecuting}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition whitespace-nowrap disabled:opacity-50"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Unified Deliverable Canvas (8 cols) */}
          <div className="lg:col-span-8 h-full flex flex-col min-h-0">
            <CodeWorkspace
              files={mission.files}
              execution={mission.execution}
              video={mission.video}
              onUpdateVideo={onUpdateVideo}
              defaultTab="preview"
              onRunCommand={onRunCommand}
              isRunningCommand={isRunningCommand}
              streamingTerminalOutput={streamingTerminalOutput}
              isStreamingTerminal={isStreamingTerminal}
              isWsConnected={isWsConnected}
              onClearTerminal={onClearTerminal}
              onUpdateFile={onUpdateFile}
              onAddFile={onAddFile}
              onDeleteFile={onDeleteFile}
              onPushToGitHub={onPushToGitHub}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
