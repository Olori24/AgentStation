import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Code2,
  Terminal,
  ShieldCheck,
  Film,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  ArrowRight,
  ExternalLink,
  Plus,
  Play,
  RotateCcw,
} from 'lucide-react';
import { SquadMission, AgentLogEntry, AgentRole } from '../types';

interface ManusConversationProps {
  mission: SquadMission;
  isExecuting: boolean;
  activeAgentRole?: AgentRole;
  onExecuteFollowUp: (prompt: string) => void;
  onNewTask: () => void;
  onSelectTab?: (tab: 'browser' | 'terminal' | 'code' | 'video') => void;
}

interface PlanStep {
  id: string;
  title: string;
  role: AgentRole;
  status: 'completed' | 'in_progress' | 'pending';
}

export const ManusConversation: React.FC<ManusConversationProps> = ({
  mission,
  isExecuting,
  activeAgentRole,
  onExecuteFollowUp,
  onNewTask,
  onSelectTab,
}) => {
  const [followUpText, setFollowUpText] = useState('');
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);
  const [isLogsExpanded, setIsLogsExpanded] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto scroll to bottom when new logs arrive while executing
  useEffect(() => {
    if (isExecuting && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mission.logs?.length, isExecuting]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!followUpText.trim() || isExecuting) return;
    onExecuteFollowUp(followUpText.trim());
    setFollowUpText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Build the 5 autonomous stages for the plan
  const getPlanSteps = (): PlanStep[] => {
    const roleOrder: AgentRole[] = ['architect', 'developer', 'qa', 'video_producer'];
    const currentIdx = activeAgentRole ? roleOrder.indexOf(activeAgentRole) : 1;

    const baseSteps: { id: string; title: string; role: AgentRole }[] = [
      { id: '1', title: 'Understand user requirements & project architecture', role: 'architect' },
      { id: '2', title: 'Scaffold application structure & data models', role: 'architect' },
      { id: '3', title: 'Implement full-stack source code, styling & state', role: 'developer' },
      { id: '4', title: 'Run isolated sandbox PyTest test suite', role: 'qa' },
      { id: '5', title: 'Launch live interactive app in Manus’s Computer', role: 'video_producer' },
    ];

    return baseSteps.map((step, idx) => {
      if (!isExecuting) {
        return { ...step, status: 'completed' };
      }
      if (idx < currentIdx) {
        return { ...step, status: 'completed' };
      }
      if (idx === currentIdx) {
        return { ...step, status: 'in_progress' };
      }
      return { ...step, status: 'pending' };
    });
  };

  const planSteps = getPlanSteps();

  const QUICK_PROMPTS = [
    'Add dark mode theme toggle',
    'Run pytest -v in terminal',
    'Add input validation & alerts',
    'Generate full README documentation',
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-slate-950 text-slate-200 font-sans">
      {/* Top Header of the Conversation */}
      <div className="h-14 px-5 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>New Task</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
              {mission.prompt}
            </h2>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-3 shrink-0">
          {isExecuting ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Manus Working ({elapsedSeconds}s)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 scrollbar-thin min-h-0">
        {/* 1. User Message */}
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-slate-300">You</span>
              <span className="text-[11px] font-mono text-slate-500">{mission.createdAt || 'Now'}</span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed font-sans">
              {mission.prompt}
            </p>
          </div>
        </div>

        {/* 2. Manus Agent Message */}
        <div className="flex items-start gap-3 max-w-3xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30">
            <Bot className="w-4 h-4" />
          </div>

          <div className="flex-1 space-y-4">
            {/* Agent Header */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Manus</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                Autonomous Agent
              </span>
            </div>

            {/* A. Manus Plan Checklist Box */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div
                onClick={() => setIsPlanExpanded(!isPlanExpanded)}
                className="px-4 py-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider">
                    Plan
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ({planSteps.filter((s) => s.status === 'completed').length}/{planSteps.length} completed)
                  </span>
                </div>
                {isPlanExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {isPlanExpanded && (
                <div className="p-3.5 space-y-2">
                  {planSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        {step.status === 'completed' ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : step.status === 'in_progress' ? (
                          <div className="w-4 h-4 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800" />
                        )}

                        <span
                          className={`font-sans ${
                            step.status === 'completed'
                              ? 'text-slate-300'
                              : step.status === 'in_progress'
                              ? 'text-amber-300 font-semibold'
                              : 'text-slate-500'
                          }`}
                        >
                          {idx + 1}. {step.title}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {step.status === 'completed'
                          ? 'Done'
                          : step.status === 'in_progress'
                          ? 'Running'
                          : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* B. Real-Time Tool Actions / Thoughts */}
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden">
              <div
                onClick={() => setIsLogsExpanded(!isLogsExpanded)}
                className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/60 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    Execution Steps ({mission.logs?.length || 0})
                  </span>
                </div>
                {isLogsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>

              {isLogsExpanded && (
                <div className="p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-thin text-xs font-mono">
                  {mission.logs && mission.logs.length > 0 ? (
                    mission.logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/60 flex items-start gap-2.5 leading-relaxed"
                      >
                        <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                          {log.timestamp}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <span className="text-blue-400 font-semibold">[{log.agentName}]:</span>
                            <span className="text-slate-300 font-sans">{log.message}</span>
                          </div>
                          {log.details && (
                            <div className="mt-1 text-[11px] text-slate-400 bg-slate-900/90 px-2 py-1 rounded border border-slate-800 break-all font-mono">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 py-2 text-center text-xs">
                      Initializing autonomous agent...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* C. Completion Deliverable Summary */}
            {!isExecuting && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Task Ready in Manus’s Computer</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {mission.files?.length || 0} files created • {mission.execution?.testsPassed || 0} tests passed
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The application has been generated, tested in the sandbox with PyTest, and is running live.
                  You can interact with the app, examine code, or test commands in <strong>Manus’s Computer</strong> on the right panel.
                </p>

                {onSelectTab && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => onSelectTab('browser')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Open Live Browser</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onSelectTab('code')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
                    >
                      View Source Code
                    </button>
                    <button
                      onClick={() => onSelectTab('terminal')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition"
                    >
                      View Terminal Logs
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Follow-Up Chat Box */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Direct Manus or ask for adjustments... (e.g. Add dark mode, run tests)"
            disabled={isExecuting}
            className="w-full bg-slate-900 text-slate-100 text-sm rounded-xl pl-4 pr-12 py-3 border border-slate-700/80 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-sans disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={!followUpText.trim() || isExecuting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition shadow-md shadow-blue-600/30"
            title="Send instruction to Manus"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Quick prompt suggestions */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-thin text-xs">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setFollowUpText(prompt);
                onExecuteFollowUp(prompt);
              }}
              disabled={isExecuting}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800 transition whitespace-nowrap disabled:opacity-50"
            >
              + {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
