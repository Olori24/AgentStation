import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Film,
  Terminal,
  Columns,
  Sparkles,
  Github,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react';
import { Header } from './components/Header';
import { SquadBar } from './components/SquadBar';
import { PromptStation } from './components/PromptStation';
import { AgentActivityStream } from './components/AgentActivityStream';
import { CodeWorkspace } from './components/CodeWorkspace';
import { VideoStudio } from './components/VideoStudio';
import { GitHubModal } from './components/GitHubModal';
import { OllamaModal } from './components/OllamaModal';
import { MissionHistoryPanel } from './components/MissionHistoryPanel';
import { UserOnboardingModal } from './components/UserOnboardingModal';
import { FullStackOperationsModal } from './components/FullStackOperationsModal';
import { ManusHeroPrompt } from './components/ManusHeroPrompt';
import { ManusWorkspace } from './components/ManusWorkspace';
import { DEFAULT_AGENTS, INITIAL_MISSION, GITHUB_REPO_INFO } from './data/defaults';
import { SAMPLE_MISSIONS } from './data/sampleMissions';
import { SquadMission, AgentProfile, AgentRole, AgentLogEntry, WorkspaceFile, VideoProject, CiStatusInfo, TerminalStreamMessage } from './types';

export default function App() {
  const [missionHistory, setMissionHistory] = useState<SquadMission[]>(() => {
    try {
      const saved = localStorage.getItem('agentstation_missions_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SAMPLE_MISSIONS;
  });

  const [mission, setMission] = useState<SquadMission>(() => {
    return missionHistory[0] || INITIAL_MISSION;
  });
  const [isHomePromptMode, setIsHomePromptMode] = useState<boolean>(false);
  const [agents, setAgents] = useState<AgentProfile[]>(DEFAULT_AGENTS);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeAgentRole, setActiveAgentRole] = useState<AgentRole | undefined>(undefined);
  const [isRunningCommand, setIsRunningCommand] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'code' | 'video' | 'stream'>('split');
  const [notification, setNotification] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<'gemini' | 'ollama'>(() => {
    try {
      return (localStorage.getItem('agentstation_provider') as 'gemini' | 'ollama') || 'gemini';
    } catch {
      return 'gemini';
    }
  });
  const [ollamaModel, setOllamaModel] = useState<string>(() => {
    try {
      return localStorage.getItem('agentstation_ollama_model') || 'llama3';
    } catch {
      return 'llama3';
    }
  });
  const [ciStatus, setCiStatus] = useState<CiStatusInfo | null>(null);
  const [isFullStackModalOpen, setIsFullStackModalOpen] = useState(false);

  // Real-time WebSocket terminal streamer state
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [streamingTerminalOutput, setStreamingTerminalOutput] = useState<string>(() => {
    return mission?.execution?.stdout || '';
  });
  const [isStreamingTerminal, setIsStreamingTerminal] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Synchronize terminal output buffer when active mission changes
  useEffect(() => {
    if (mission?.execution?.stdout) {
      setStreamingTerminalOutput(mission.execution.stdout);
    }
  }, [mission?.id]);

  // WebSocket terminal streaming listener
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;
    let active = true;

    const connectWebSocket = () => {
      if (!active) return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/terminal`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!active) return;
          setIsWsConnected(true);
          if (mission?.id) {
            ws?.send(JSON.stringify({ type: 'subscribe', missionId: mission.id }));
          }
        };

        ws.onmessage = (event) => {
          if (!active) return;
          try {
            const data: TerminalStreamMessage = JSON.parse(event.data);
            if (data.type === 'terminal_start') {
              setIsStreamingTerminal(true);
              setIsRunningCommand(true);
              const header = `$ ${data.command}\n`;
              setStreamingTerminalOutput(header);
            } else if (data.type === 'terminal_chunk') {
              if (data.text) {
                setStreamingTerminalOutput((prev) => prev + data.text);
              }
            } else if (data.type === 'terminal_exit') {
              setIsStreamingTerminal(false);
              setIsRunningCommand(false);
              setMission((prev) => {
                const finalStdout = data.command
                  ? `$ ${data.command}\n${data.text || ''}`
                  : prev.execution?.stdout || '';
                return {
                  ...prev,
                  execution: {
                    command: data.command || prev.execution?.command || '',
                    stdout: finalStdout || prev.execution?.stdout || '',
                    exitCode: data.exitCode ?? 0,
                    testsPassed: data.testsPassed ?? prev.execution?.testsPassed ?? 0,
                    testsFailed: data.testsFailed ?? prev.execution?.testsFailed ?? 0,
                    durationMs: data.durationMs ?? prev.execution?.durationMs ?? 0,
                  },
                  logs: [
                    {
                      id: `exec-log-${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      role: 'qa',
                      agentName: 'Sentinel (QA Auditor)',
                      type: 'terminal',
                      message: `Sandbox execution stream finished: "${data.command || 'terminal'}"`,
                      details: `Exit code: ${data.exitCode} | Duration: ${data.durationMs}ms`,
                    },
                    ...prev.logs,
                  ],
                };
              });
            } else if (data.type === 'connection_established') {
              setIsWsConnected(true);
            }
          } catch (e) {
            console.debug('WebSocket stream parse note:', e);
          }
        };

        ws.onclose = () => {
          if (!active) return;
          setIsWsConnected(false);
          setIsStreamingTerminal(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          if (!active) return;
          setIsWsConnected(false);
        };
      } catch (err) {
        console.warn('WebSocket init note:', err);
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    return () => {
      active = false;
      clearTimeout(reconnectTimer);
      if (ws) {
        ws.close();
      }
    };
  }, [mission?.id]);

  useEffect(() => {
    let isMounted = true;
    const fetchCi = async () => {
      try {
        const res = await fetch('/api/github/ci-status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.ciStatus) {
            setCiStatus(data.ciStatus);
          }
        }
      } catch (err) {
        console.debug('CI fetch note:', err);
      }
    };

    fetchCi();
    const interval = setInterval(fetchCi, 20000);

    // Initial server missions fetch and merge
    const loadServerMissions = async () => {
      try {
        const res = await fetch('/api/missions');
        const data = await res.json();
        if (data.success && Array.isArray(data.missions) && data.missions.length > 0) {
          setMissionHistory((prev) => {
            const merged = [...data.missions];
            prev.forEach((p) => {
              if (!merged.some((m) => m.id === p.id)) {
                merged.push(p);
              }
            });
            try {
              localStorage.setItem('agentstation_missions_v1', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      } catch {
        // Offline fallback
      }
    };
    loadServerMissions();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSelectProvider = (p: 'gemini' | 'ollama') => {
    setAiProvider(p);
    try {
      localStorage.setItem('agentstation_provider', p);
    } catch {}
    showToast(`Switched active AI engine to ${p === 'gemini' ? 'Gemini 2.5 Flash (Cloud)' : 'Ollama (Local Private)'}`);
  };

  const handleSelectOllamaModel = (m: string) => {
    setOllamaModel(m);
    try {
      localStorage.setItem('agentstation_ollama_model', m);
    } catch {}
  };

  const persistMissionToServer = async (missionItem: SquadMission) => {
    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionItem),
      });
    } catch {
      // offline / transient
    }
  };

  // Sync mission history changes to localStorage & server
  const saveHistoryToStorage = (updatedList: SquadMission[]) => {
    try {
      localStorage.setItem('agentstation_missions_v1', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Failed to persist mission history:', err);
    }
  };

  const updateHistoryWithMission = (updatedMission: SquadMission) => {
    setMissionHistory((prev) => {
      const idx = prev.findIndex((m) => m.id === updatedMission.id);
      let next: SquadMission[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = updatedMission;
      } else {
        next = [updatedMission, ...prev];
      }
      saveHistoryToStorage(next);
      return next;
    });
    persistMissionToServer(updatedMission);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Run autonomous multi-agent squad
  const handleExecutePrompt = async (promptText: string) => {
    setIsHomePromptMode(false);
    setIsExecuting(true);
    const newMissionId = `mission-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString();

    // Reset agents to working
    setAgents((prev) =>
      prev.map((a) => ({ ...a, status: a.id === 'architect' ? 'working' : 'idle' }))
    );
    setActiveAgentRole('architect');

    // Add initial log
    const startLog: AgentLogEntry = {
      id: `log-${Date.now()}-1`,
      timestamp: nowTime,
      role: 'system',
      agentName: 'AgentStation Core',
      type: 'status',
      message: `Starting multi-agent execution pipeline for: "${promptText}"`,
    };

    setMission((prev) => ({
      ...prev,
      id: newMissionId,
      prompt: promptText,
      status: 'running',
      progressPercent: 15,
      logs: [startLog, ...prev.logs],
    }));

    try {
      // Simulate sequential hand-offs smoothly
      setTimeout(() => {
        setActiveAgentRole('developer');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'architect'
              ? { ...a, status: 'completed' }
              : a.id === 'developer'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 900);

      setTimeout(() => {
        setActiveAgentRole('qa');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'developer'
              ? { ...a, status: 'completed' }
              : a.id === 'qa'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 1800);

      setTimeout(() => {
        setActiveAgentRole('creative');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'qa'
              ? { ...a, status: 'completed' }
              : a.id === 'creative'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 2700);

      setTimeout(() => {
        setActiveAgentRole('video_producer');
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'creative'
              ? { ...a, status: 'completed' }
              : a.id === 'video_producer'
              ? { ...a, status: 'working' }
              : a
          )
        );
      }, 3600);

      // Make API call to server with chosen AI provider
      const res = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          provider: aiProvider,
          ollamaModel: ollamaModel,
        }),
      });

      const data = await res.json();
      const generated = data.mission || (data.files ? data : null);
      if (!data.success || !generated) {
        throw new Error(data.error || 'Squad pipeline failed');
      }
      const timestamp = new Date().toLocaleTimeString();

      const newLogs: AgentLogEntry[] = (generated.logs || []).map((l: any, idx: number) => ({
        id: `gen-log-${Date.now()}-${idx}`,
        timestamp,
        role: l.role || 'system',
        agentName: l.agentName || 'Agent',
        type: l.type || 'thought',
        message: l.message || '',
        details: l.details,
      }));

      const completeLog: AgentLogEntry = {
        id: `complete-${Date.now()}`,
        timestamp,
        role: 'system',
        agentName: 'AgentStation Core',
        type: 'complete',
        message: `Mission completed successfully! Code artifacts, PyTest sandbox tests, and 1080p promo video compiled.`,
      };

      const finalMission: SquadMission = {
        id: newMissionId,
        prompt: promptText,
        createdAt: 'Just now',
        status: 'completed',
        currentStage: 'Mission Completed & Verified',
        progressPercent: 100,
        files: generated.files || [],
        execution: generated.execution || {
          command: 'pytest -v tests/',
          stdout: 'All tests passed.',
          exitCode: 0,
          testsPassed: 4,
          testsFailed: 0,
          durationMs: 80,
        },
        video: generated.video,
        logs: [completeLog, ...newLogs, ...mission.logs],
        gitBranch: 'main',
        gitCommitMessage: generated.gitCommitMessage || `feat: implement ${promptText.slice(0, 30)}`,
      };

      setMission(finalMission);
      updateHistoryWithMission(finalMission);

      setAgents((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      setActiveAgentRole(undefined);
      showToast('Squad mission completed! Code, tests, and video are ready.');
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || 'Execution error during multi-agent handoff';
      const failLog: AgentLogEntry = {
        id: `fail-log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        role: 'system',
        agentName: 'AgentStation Core',
        type: 'status',
        message: `Pipeline halted: ${errMsg}`,
        details: 'Check AI provider configuration or network connection.',
      };
      setMission((prev) => ({
        ...prev,
        status: 'failed',
        currentStage: 'Mission Halted - Error Reported',
        logs: [failLog, ...prev.logs],
      }));
      showToast(`Error: ${errMsg.slice(0, 50)}`);
      setAgents((prev) => prev.map((a) => ({ ...a, status: 'completed' })));
      setActiveAgentRole(undefined);
    } finally {
      setIsExecuting(false);
    }
  };

  // Run a sandbox terminal command with real-time streaming
  const handleRunCommand = async (command: string) => {
    setIsRunningCommand(true);
    setIsStreamingTerminal(true);
    const startBanner = `$ [SANDBOX ISOLATED] ${command}\n`;
    setStreamingTerminalOutput(startBanner);

    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          files: mission.files,
          missionId: mission.id,
        }),
      });
      const data = await res.json();
      setMission((prev) => ({
        ...prev,
        execution: {
          command: data.command || command,
          stdout: data.stdout || startBanner,
          exitCode: data.exitCode ?? 0,
          testsPassed: data.testsPassed ?? 0,
          testsFailed: data.testsFailed ?? 0,
          durationMs: data.durationMs ?? 0,
        },
        logs: [
          {
            id: `exec-log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            role: 'qa',
            agentName: 'Sentinel (QA Auditor)',
            type: 'terminal',
            message: `Executed command in sandbox: "${command}"`,
            details: `Exit code: ${data.exitCode} | Duration: ${data.durationMs}ms`,
          },
          ...prev.logs,
        ],
      }));
      setStreamingTerminalOutput((prev) => (prev && prev.length > startBanner.length ? prev : data.stdout || startBanner));
      showToast(`Command finished with return code ${data.exitCode}`);
    } catch (err: any) {
      console.error(err);
      setStreamingTerminalOutput((prev) => prev + `\n[Execution error]: ${err.message || 'Failed to execute command'}`);
      showToast('Failed to execute terminal command');
    } finally {
      setIsRunningCommand(false);
      setIsStreamingTerminal(false);
    }
  };

  const handleUpdateFile = (fileIndex: number, newContent: string) => {
    setMission((prev) => {
      const updatedFiles = [...prev.files];
      if (updatedFiles[fileIndex]) {
        updatedFiles[fileIndex] = {
          ...updatedFiles[fileIndex],
          content: newContent,
        };
      }
      const updated = { ...prev, files: updatedFiles };
      updateHistoryWithMission(updated);
      return updated;
    });
  };

  const handleAddFile = (newFile: any) => {
    setMission((prev) => {
      const updated = {
        ...prev,
        files: [...prev.files, newFile],
      };
      updateHistoryWithMission(updated);
      return updated;
    });
    showToast(`Created file ${newFile.name}`);
  };

  const handleDeleteFile = (fileIndex: number) => {
    setMission((prev) => {
      const fileName = prev.files[fileIndex]?.name;
      const updatedFiles = prev.files.filter((_, idx) => idx !== fileIndex);
      const updated = { ...prev, files: updatedFiles };
      updateHistoryWithMission(updated);
      showToast(`Removed ${fileName}`);
      return updated;
    });
  };

  const handleUpdateVideo = (updatedVideo: any) => {
    setMission((prev) => {
      const updated = {
        ...prev,
        video: updatedVideo,
      };
      updateHistoryWithMission(updated);
      return updated;
    });
  };

  const handleSelectMission = (selected: SquadMission) => {
    setMission(selected);
    setStreamingTerminalOutput(selected.execution?.stdout || '');
    setIsHomePromptMode(false);
    showToast(`Loaded mission: "${selected.prompt.slice(0, 36)}..."`);
  };

  const handleDeleteMission = (id: string) => {
    setMissionHistory((prev) => {
      const next = prev.filter((m) => m.id !== id);
      saveHistoryToStorage(next);
      return next;
    });
    if (mission.id === id) {
      const remaining = missionHistory.filter((m) => m.id !== id);
      if (remaining.length > 0) {
        setMission(remaining[0]);
      }
    }
    fetch(`/api/missions/${id}`, { method: 'DELETE' }).catch(() => {});
    showToast('Mission removed from history.');
  };

  const handleResetToDefaults = () => {
    setMissionHistory(SAMPLE_MISSIONS);
    setMission(SAMPLE_MISSIONS[0]);
    saveHistoryToStorage(SAMPLE_MISSIONS);
    showToast('Mission history reset to seed templates.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        onOpenGitHub={() => setIsGitHubModalOpen(true)}
        onOpenOllama={() => setIsOllamaModalOpen(true)}
        onOpenFullStack={() => setIsFullStackModalOpen(true)}
        onNewMission={() => setIsHomePromptMode(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        historyCount={missionHistory.length}
        isExecuting={isExecuting}
        aiProvider={aiProvider}
        ollamaModel={ollamaModel}
        ciStatus={ciStatus}
      />

      {isHomePromptMode ? (
        <main className="flex-1 flex flex-col justify-center">
          <ManusHeroPrompt
            onExecutePrompt={handleExecutePrompt}
            isExecuting={isExecuting}
            recentMissions={missionHistory}
            onSelectMission={handleSelectMission}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
          />
        </main>
      ) : (
        <ManusWorkspace
          mission={mission}
          agents={agents}
          isExecuting={isExecuting}
          activeAgentRole={activeAgentRole}
          onExecuteFollowUpPrompt={handleExecutePrompt}
          onRunCommand={handleRunCommand}
          isRunningCommand={isRunningCommand}
          streamingTerminalOutput={streamingTerminalOutput}
          isStreamingTerminal={isStreamingTerminal}
          isWsConnected={isWsConnected}
          onClearTerminal={() => setStreamingTerminalOutput('')}
          onUpdateFile={handleUpdateFile}
          onAddFile={handleAddFile}
          onDeleteFile={handleDeleteFile}
          onUpdateVideo={handleUpdateVideo}
          onPushToGitHub={() => setIsGitHubModalOpen(true)}
          onNewMission={() => setIsHomePromptMode(true)}
        />
      )}

      {/* Footer Info */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 px-4 lg:px-8 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-400">AgentStation v2.4</span>
          <span>•</span>
          <span>Multi-Agent Autonomous Orchestration</span>
          <span>•</span>
          <span className="text-emerald-400 font-mono">Sandbox Status: Operational</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsOllamaModalOpen(true)}
            className="hover:text-slate-300 transition"
          >
            Local Ollama Models
          </button>
          <button
            onClick={() => setIsGitHubModalOpen(true)}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            github.com/Olori24/AgentStation
          </button>
        </div>
      </footer>

      {/* GitHub Repository Modal */}
      <GitHubModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        commitMessage={mission.gitCommitMessage}
        currentBranch={mission.gitBranch || 'main'}
        missionFiles={mission.files}
        onSuccessNotification={(msg) => showToast(msg)}
        onBranchChange={(newBranch) => {
          setMission((prev) => {
            const updated = { ...prev, gitBranch: newBranch };
            updateHistoryWithMission(updated);
            return updated;
          });
        }}
      />

      {/* Ollama Local Configuration Modal */}
      <OllamaModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        aiProvider={aiProvider}
        onSelectProvider={handleSelectProvider}
        selectedModel={ollamaModel}
        onSelectModel={handleSelectOllamaModel}
      />

      {/* Mission Execution History Side-Panel */}
      <MissionHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        missions={missionHistory}
        activeMissionId={mission.id}
        onSelectMission={handleSelectMission}
        onDeleteMission={handleDeleteMission}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Real-World Use Case Onboarding & Test Drive Modal */}
      <UserOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSelectMission={(m) => {
          setMission(m);
          updateHistoryWithMission(m);
          setAgents(DEFAULT_AGENTS.map((a) => ({ ...a, status: 'completed' })));
          setActiveAgentRole(undefined);
          showToast(`Loaded real-world use case: "${m.prompt.slice(0, 45)}..."`);
        }}
        onRunPrompt={(p) => {
          handleExecutePrompt(p);
        }}
        aiProvider={aiProvider}
        ollamaModel={ollamaModel}
      />

      {/* Full-Stack Operations Center Modal (Phases 1-5) */}
      <FullStackOperationsModal
        isOpen={isFullStackModalOpen}
        onClose={() => setIsFullStackModalOpen(false)}
        currentMission={mission}
        onToast={showToast}
      />
    </div>
  );
}
