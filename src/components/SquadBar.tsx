import React from 'react';
import { Compass, Code2, ShieldCheck, Megaphone, Film } from 'lucide-react';
import { AgentProfile, AgentRole } from '../types';

interface SquadBarProps {
  agents: AgentProfile[];
  activeAgentRole?: AgentRole;
  isExecuting: boolean;
}

const AGENT_ICONS: Record<AgentRole, React.ReactNode> = {
  architect: <Compass className="w-4 h-4" />,
  developer: <Code2 className="w-4 h-4" />,
  qa: <ShieldCheck className="w-4 h-4" />,
  creative: <Megaphone className="w-4 h-4" />,
  video_producer: <Film className="w-4 h-4" />,
  system: <Compass className="w-4 h-4" />,
};

export const SquadBar: React.FC<SquadBarProps> = ({
  agents,
  activeAgentRole,
  isExecuting,
}) => {
  return (
    <div className="w-full bg-slate-900/60 border-y border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-fit">
          <span>Active Squad:</span>
        </div>

        <div className="flex items-center gap-3 min-w-max">
          {agents.map((agent) => {
            const isActive = isExecuting && activeAgentRole === agent.id;
            const isDone = !isExecuting || agent.status === 'completed';

            return (
              <div
                key={agent.id}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-blue-500/10 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/20 animate-pulse'
                    : isDone
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : 'bg-slate-950 border-slate-800/60 text-slate-500'
                }`}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                  style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                >
                  {AGENT_ICONS[agent.id]}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">{agent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono text-slate-400 bg-slate-800/80">
                      {agent.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {isActive ? 'Computing step...' : agent.roleTitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
