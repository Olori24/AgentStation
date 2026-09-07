import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Copy, Check, Filter, Compass, Code2, ShieldCheck, Megaphone, Film } from 'lucide-react';
import { AgentLogEntry, AgentRole } from '../types';

interface AgentActivityStreamProps {
  logs: AgentLogEntry[];
  isExecuting: boolean;
}

const ROLE_COLORS: Record<AgentRole, { bg: string; text: string; icon: React.ReactNode }> = {
  architect: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    icon: <Compass className="w-3.5 h-3.5" />,
  },
  developer: {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    icon: <Code2 className="w-3.5 h-3.5" />,
  },
  qa: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
  },
  creative: {
    bg: 'bg-pink-500/10 border-pink-500/30',
    text: 'text-pink-400',
    icon: <Megaphone className="w-3.5 h-3.5" />,
  },
  video_producer: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    text: 'text-purple-400',
    icon: <Film className="w-3.5 h-3.5" />,
  },
  system: {
    bg: 'bg-slate-800/60 border-slate-700/60',
    text: 'text-slate-300',
    icon: <Terminal className="w-3.5 h-3.5" />,
  },
};

export const AgentActivityStream: React.FC<AgentActivityStreamProps> = ({
  logs,
  isExecuting,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isExecuting]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.agentName}]: ${l.message} ${l.details ? `(${l.details})` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = selectedRole === 'all'
    ? logs
    : logs.filter((l) => l.role === selectedRole);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Stream Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Squad Activity Stream
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {logs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3 h-3 text-slate-500 absolute left-2 pointer-events-none" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-slate-800 text-slate-300 text-[11px] rounded-md pl-6 pr-2 py-1 border border-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Agents</option>
              <option value="architect">Atlas (Architect)</option>
              <option value="developer">Cypher (Developer)</option>
              <option value="qa">Sentinel (QA)</option>
              <option value="creative">Vesper (Creative)</option>
              <option value="video_producer">Nova (Video)</option>
            </select>
          </div>

          <button
            onClick={handleCopyLogs}
            title="Copy all logs"
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs scrollbar-thin"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No agent logs for this filter.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const roleStyle = ROLE_COLORS[log.role] || ROLE_COLORS.system;

            return (
              <div
                key={log.id}
                className="group relative pl-3 border-l-2 border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleStyle.bg} ${roleStyle.text}`}
                  >
                    {roleStyle.icon}
                    {log.agentName}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                    [{log.type}]
                  </span>
                </div>
                <div className="text-slate-200 text-xs leading-relaxed font-sans sm:font-mono">
                  {log.message}
                </div>
                {log.details && (
                  <div className="mt-1 p-2 rounded bg-slate-950/70 text-[11px] text-slate-400 border border-slate-800/80 break-words">
                    {log.details}
                  </div>
                )}
              </div>
            );
          })
        )}

        {isExecuting && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span>Agent cluster is deliberating and executing tasks...</span>
          </div>
        )}
      </div>
    </div>
  );
};
