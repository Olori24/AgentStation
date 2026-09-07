import React, { useState, useEffect } from 'react';
import {
  Server,
  Users,
  Database,
  Radio,
  Layers,
  Box,
  Archive,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  RefreshCw,
  X,
  Copy,
  Check,
  ShieldCheck,
  Terminal,
  Activity,
  Cpu,
} from 'lucide-react';
import { FullStackUser, FullStackJob, FullStackArtifact, SquadMission } from '../types';

interface FullStackOperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMission?: SquadMission | null;
  onToast?: (msg: string) => void;
}

export const FullStackOperationsModal: React.FC<FullStackOperationsModalProps> = ({
  isOpen,
  onClose,
  currentMission,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'auth_db' | 'streaming' | 'queue' | 'sandbox' | 'artifacts'>('auth_db');
  const [currentUser, setCurrentUser] = useState<FullStackUser | null>(null);
  const [allUsers, setAllUsers] = useState<FullStackUser[]>([]);
  const [dbMetrics, setDbMetrics] = useState<any>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [sseEvents, setSseEvents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<FullStackJob[]>([]);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [artifacts, setArtifacts] = useState<FullStackArtifact[]>([]);
  const [sandboxCmd, setSandboxCmd] = useState('python3 tests/test_mission_sandbox.py');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [isBundling, setIsBundling] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. Fetch initial Auth & Database state
  const loadAuthAndDb = async () => {
    try {
      const [meRes, usersRes, dbRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/auth/users'),
        fetch('/api/db/metrics'),
      ]);
      const meData = await meRes.json();
      const usersData = await usersRes.json();
      const dbData = await dbRes.json();

      if (meData.success) setCurrentUser(meData.user);
      if (usersData.success) setAllUsers(usersData.users);
      if (dbData.success) setDbMetrics(dbData.metrics);
    } catch {
      // transient
    }
  };

  // 2. Fetch Jobs
  const loadJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setQueueStats(data.stats);
      }
    } catch {
      // transient
    }
  };

  // 3. Fetch Artifacts
  const loadArtifacts = async () => {
    try {
      const res = await fetch('/api/artifacts');
      const data = await res.json();
      if (data.success) {
        setArtifacts(data.artifacts || []);
      }
    } catch {
      // transient
    }
  };

  // 4. Connect to Real-time SSE Stream
  useEffect(() => {
    if (!isOpen) return;

    loadAuthAndDb();
    loadJobs();
    loadArtifacts();

    const es = new EventSource('/api/stream/events');
    es.onopen = () => {
      setSseConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setSseEvents((prev) => [parsed, ...prev.slice(0, 40)]);
        if (parsed.type === 'queue_progress') {
          loadJobs();
        }
      } catch {}
    };

    es.onerror = () => {
      setSseConnected(false);
    };

    const interval = setInterval(() => {
      if (activeTab === 'queue') loadJobs();
      if (activeTab === 'artifacts') loadArtifacts();
    }, 4000);

    return () => {
      es.close();
      clearInterval(interval);
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Handle Switch User (Multi-Tenant RBAC)
  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        onToast?.(data.message || `Switched user to ${data.user.name}`);
        loadAuthAndDb();
      }
    } catch (err: any) {
      onToast?.(`Switch failed: ${err.message}`);
    }
  };

  // Enqueue Job
  const handleEnqueueJob = async (type: string) => {
    try {
      const res = await fetch('/api/jobs/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          missionId: currentMission?.id,
          payload: {
            title: currentMission?.prompt || 'Autonomous Mission Task',
            command: sandboxCmd,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        onToast?.(`Job enqueued: ${type} (${data.jobId})`);
        loadJobs();
      }
    } catch (err: any) {
      onToast?.(`Enqueue error: ${err.message}`);
    }
  };

  // Run Sandbox Command
  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setSandboxOutput(null);
    try {
      const res = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: sandboxCmd,
          timeoutMs: 25000,
          missionId: currentMission?.id,
          files: currentMission?.files || [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSandboxOutput(data.execution);
        onToast?.(`Sandbox command finished with exit code ${data.execution.exitCode}`);
      } else {
        onToast?.(`Sandbox error: ${data.error}`);
      }
    } catch (err: any) {
      onToast?.(`Sandbox execution failure: ${err.message}`);
    } finally {
      setSandboxRunning(false);
    }
  };

  // Generate Mission Artifact Bundle
  const handleGenerateBundle = async () => {
    setIsBundling(true);
    try {
      const res = await fetch('/api/artifacts/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: currentMission?.id || 'mission-primary',
          missionTitle: currentMission?.prompt?.slice(0, 40) || 'AgentStation Project',
          files: currentMission?.files || [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        onToast?.(`Artifact bundle created: ${data.artifact.name}`);
        loadArtifacts();
      }
    } catch (err: any) {
      onToast?.(`Bundle compilation failed: ${err.message}`);
    } finally {
      setIsBundling(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Full-Stack Operations Center</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  ALL 5 PHASES ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Relational Database • RBAC Sessions • SSE Telemetry • BullMQ Worker Pool • Isolated Sandbox • Cloud Artifacts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('auth_db')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'auth_db'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>1. Database & RBAC Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('streaming')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'streaming'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Real-Time SSE Stream</span>
            {sseConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'queue'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Background Job Queue</span>
            {queueStats && queueStats.active > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {queueStats.active} Active
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-purple-400" />
            <span>4. Isolated Sandbox Runner</span>
          </button>

          <button
            onClick={() => setActiveTab('artifacts')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'artifacts'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-indigo-400" />
            <span>5. Cloud Artifacts & Bundler</span>
            {artifacts.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                {artifacts.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: AUTH & RELATIONAL DATABASE */}
          {activeTab === 'auth_db' && (
            <div className="space-y-5">
              {/* Active Profile Card & Multi-Tenant Switcher */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt="Avatar"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{currentUser?.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            currentUser?.role === 'admin'
                              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                              : currentUser?.role === 'engineer'
                              ? 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
                              : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {currentUser?.role} Role
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{currentUser?.email}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Organization / Team</div>
                    <div className="text-xs font-semibold text-white">AgentStation Core Engineering (Enterprise)</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulate / Switch Multi-Tenant Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {allUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u.id)}
                        className={`p-2.5 rounded-lg border text-left transition flex items-center gap-2.5 ${
                          currentUser?.id === u.id
                            ? 'bg-blue-950/40 border-blue-500/60 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                        <div className="truncate">
                          <div className="text-xs font-bold truncate">{u.name}</div>
                          <div className="text-[10px] font-mono text-slate-400 uppercase">{u.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Relational Database Metrics & Tables */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Relational Database Engine (Tables & Records)
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                    WAL Sync Active
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Total Missions</div>
                    <div className="text-lg font-bold text-white font-mono">{dbMetrics?.totalMissions ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Workspace Files</div>
                    <div className="text-lg font-bold text-white font-mono">{dbMetrics?.totalFiles ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Sandbox Runs</div>
                    <div className="text-lg font-bold text-white font-mono">{dbMetrics?.totalSandboxExecutions ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Videos Rendered</div>
                    <div className="text-lg font-bold text-white font-mono">{dbMetrics?.totalVideosRendered ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STREAMING (SSE) */}
          {activeTab === 'streaming' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Live Server-Sent Events (SSE) Telemetry Stream
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}
                    />
                    <span className="text-xs font-mono text-slate-300">
                      {sseConnected ? 'CONNECTED TO /api/stream/events' : 'DISCONNECTED'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time broadcast stream delivering agent thought tokens, terminal execution outputs, and queue progression without polling.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await fetch('/api/stream/test-emit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          agent: 'Atlas',
                          thought: 'Telemetry ping verified: full-stack event stream active.',
                        }),
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    Emit Telemetry Ping
                  </button>
                  <button
                    onClick={() => setSseEvents([])}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    Clear Stream Feed
                  </button>
                </div>
              </div>

              {/* Live Events Stream Terminal */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs max-h-72 overflow-y-auto">
                {sseEvents.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    Listening for telemetry events... Click "Emit Telemetry Ping" or run a sandbox task to observe live emissions.
                  </div>
                ) : (
                  sseEvents.map((evt, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">[{evt.type}]</span>
                      <span className="text-slate-400 shrink-0">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      <span className="text-slate-200 break-all">{JSON.stringify(evt.data)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BACKGROUND JOB QUEUE (BULLMQ-STYLE) */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Asynchronous Worker Pool & Job Queue
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-mono">
                    Concurrency: {queueStats?.concurrency || 2} Workers
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Active</div>
                    <div className="text-base font-bold text-amber-400 font-mono">{queueStats?.active || 0}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Waiting</div>
                    <div className="text-base font-bold text-slate-300 font-mono">{queueStats?.waiting || 0}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Completed</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">{queueStats?.completed || 0}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase">Failed</div>
                    <div className="text-base font-bold text-rose-400 font-mono">{queueStats?.failed || 0}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleEnqueueJob('mission_synthesis')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                  >
                    + Enqueue Synthesis Job
                  </button>
                  <button
                    onClick={() => handleEnqueueJob('sandbox_test')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
                  >
                    + Enqueue Sandbox Job
                  </button>
                  <button
                    onClick={() => handleEnqueueJob('video_render')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition"
                  >
                    + Enqueue Video Job
                  </button>
                  <button
                    onClick={() => handleEnqueueJob('github_sync')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                  >
                    + Enqueue Git Sync Job
                  </button>
                </div>
              </div>

              {/* Jobs Stream List */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-h-72 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Active & Recent Jobs</span>
                  <button
                    onClick={loadJobs}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {jobs.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No background jobs in queue. Enqueue one above to test asynchronous processing.
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div key={job.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-white font-bold">{job.id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                            {job.type}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            job.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : job.status === 'active'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : job.status === 'failed'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {job.status} ({job.progress}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'completed'
                              ? 'bg-emerald-500'
                              : job.status === 'failed'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>

                      {job.error && <div className="text-[11px] text-rose-400 font-mono">{job.error}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ISOLATED SANDBOX RUNNER */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Isolated Sandbox Execution Layer
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                      <ShieldCheck className="w-3 h-3 inline mr-1" />
                      Secrets Scrubbed
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[10px] font-mono">
                      Timeout: 25s Cap
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Executes code in ephemeral isolated workspaces without risk to the host container. Automatically scrubs secrets, monitors timeouts, and streams output line-by-line.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={sandboxCmd}
                    onChange={(e) => setSandboxCmd(e.target.value)}
                    placeholder="Enter command to run (e.g. python -m pytest tests/ -v)"
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300"
                  />
                  <button
                    onClick={handleRunSandbox}
                    disabled={sandboxRunning}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold transition shrink-0"
                  >
                    {sandboxRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{sandboxRunning ? 'Running in Sandbox...' : 'Run in Sandbox'}</span>
                  </button>
                </div>
              </div>

              {/* Sandbox Execution Result */}
              {sandboxOutput && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <span>Command: {sandboxOutput.command}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">{sandboxOutput.durationMs}ms</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sandboxOutput.exitCode === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        Exit Code: {sandboxOutput.exitCode}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900 text-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap">
                    {sandboxOutput.stdout || sandboxOutput.stderr || 'Command produced no output.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ARTIFACTS & SERVER BUNDLER */}
          {activeTab === 'artifacts' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Cloud Artifact Registry & Project Bundler
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono">
                    Server ZIP Bundler Active
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Compresses and generates downloadable zip archives and video manifests with SHA-256 integrity verification hashes.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-300">
                    Target Mission: <span className="text-white font-semibold">{currentMission?.prompt?.slice(0, 50) || 'Current Workspace'}</span>
                  </div>
                  <button
                    onClick={handleGenerateBundle}
                    disabled={isBundling}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition"
                  >
                    {isBundling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                    <span>{isBundling ? 'Compiling Bundle...' : 'Compile Project Bundle (.zip)'}</span>
                  </button>
                </div>
              </div>

              {/* Artifacts Table */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-2">Available Artifacts</div>
                {artifacts.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No artifacts generated yet. Click "Compile Project Bundle (.zip)" to generate a downloadable package.
                  </div>
                ) : (
                  artifacts.map((art) => (
                    <div
                      key={art.id}
                      className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">{art.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono">
                            {(art.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          SHA256: {art.sha256}
                        </div>
                      </div>

                      <a
                        href={art.downloadUrl}
                        download
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span>AgentStation Multi-Agent Full-Stack Platform Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Operations Center
          </button>
        </div>
      </div>
    </div>
  );
};
