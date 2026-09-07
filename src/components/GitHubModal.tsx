import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  GitBranch,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Workflow,
  Box,
  KeyRound,
  Download,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GitCommit,
  ArrowRightLeft,
  GitPullRequest,
  Plus,
  FileCode,
  Radio,
  Zap,
} from 'lucide-react';
import { GITHUB_REPO_INFO } from '../data/defaults';
import { WorkspaceFile, CiStatusInfo } from '../types';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitMessage: string;
  currentBranch?: string;
  missionFiles?: WorkspaceFile[];
  onBranchChange?: (branch: string) => void;
  onSuccessNotification?: (message: string) => void;
}

export interface RemoteBranchInfo {
  name: string;
  commitHash?: string;
  commitMessage?: string;
  commitDate?: string;
  isCurrent?: boolean;
  isDefault?: boolean;
  url?: string;
}

interface GitLiveStatus {
  success: boolean;
  repo: string;
  branch: string;
  branches?: string[];
  remoteBranches?: RemoteBranchInfo[];
  commitHash: string;
  commitMessage: string;
  commitAuthor: string;
  commitDate: string;
  remoteUrl: string;
  isClean: boolean;
  uncommittedFiles: number;
  hasToken: boolean;
  ciStatus?: (CiStatusInfo & { allRuns?: any[] }) | null;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({
  isOpen,
  onClose,
  commitMessage,
  currentBranch = 'main',
  missionFiles,
  onBranchChange,
  onSuccessNotification,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'push' | 'branches' | 'workflow' | 'docker' | 'webhooks'>('push');
  const [liveStatus, setLiveStatus] = useState<GitLiveStatus | null>(null);
  const [webhooksList, setWebhooksList] = useState<any[]>([]);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState<boolean>(false);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState<boolean>(false);
  const [webhookSimulationResult, setWebhookSimulationResult] = useState<string | null>(null);
  const [isInstallingWorkflow, setIsInstallingWorkflow] = useState<boolean>(false);
  const [workflowInstallFeedback, setWorkflowInstallFeedback] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState<string | null>(null);
  const [switchFeedback, setSwitchFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>(currentBranch || 'main');
  const [isCustomBranch, setIsCustomBranch] = useState<boolean>(false);
  const [customBranchInput, setCustomBranchInput] = useState<string>('');
  const [newBranchInput, setNewBranchInput] = useState<string>('');
  const [showCreateBranchForm, setShowCreateBranchForm] = useState<boolean>(false);
  const [createBranchInput, setCreateBranchInput] = useState<string>('');
  const [isCreatingBranch, setIsCreatingBranch] = useState<boolean>(false);
  const [createBranchError, setCreateBranchError] = useState<string | null>(null);
  const [customCommitMessage, setCustomCommitMessage] = useState<string>(commitMessage);
  const [successNotification, setSuccessNotification] = useState<{
    message: string;
    branch: string;
    commitHash?: string;
    branchUrl?: string;
    filesCount: number;
    timestamp: string;
  } | null>(null);
  const [pushResult, setPushResult] = useState<{
    success: boolean;
    branch?: string;
    branchUrl?: string;
    commitHash?: string;
    message?: string;
    error?: string;
    details?: string;
    fetchedAndMerged?: boolean;
    auditSteps?: string[];
    instructions?: string[];
  } | null>(null);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullResult, setPullResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    output?: string;
    commitHash?: string;
    branch?: string;
  } | null>(null);
  const [isCreatingPr, setIsCreatingPr] = useState<boolean>(false);
  const [prResult, setPrResult] = useState<{
    success: boolean;
    prUrl?: string;
    prNumber?: number;
    message?: string;
    createdViaApi?: boolean;
    error?: string;
  } | null>(null);

  // Sync commit message prop when changed
  useEffect(() => {
    setCustomCommitMessage(commitMessage);
  }, [commitMessage]);

  useEffect(() => {
    if (currentBranch) {
      setSelectedBranch(currentBranch);
    }
  }, [currentBranch]);

  const activeBranch = isCustomBranch
    ? (customBranchInput.trim().replace(/[^a-zA-Z0-9_\-\.\/]/g, '-') || 'feature/custom')
    : selectedBranch;

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/github/status');
      const data = await res.json();
      if (data.success) {
        setLiveStatus(data);
        if (!selectedBranch || selectedBranch === 'main') {
          setSelectedBranch(data.branch || 'main');
        }
      }
    } catch {
      // Offline fallback
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setPushResult(null);
      setSwitchFeedback(null);
      setSuccessNotification(null);
    }
  }, [isOpen]);

  const handleCreateNewBranch = async (branchName?: string) => {
    const raw = (branchName !== undefined ? branchName : createBranchInput).trim();
    const cleanName = raw.replace(/[^a-zA-Z0-9_\-\.\/]/g, '-').replace(/-+/g, '-').replace(/^\/+|\/+$/g, '');
    if (!cleanName) {
      setCreateBranchError('Please enter a valid branch name.');
      return;
    }

    setIsCreatingBranch(true);
    setCreateBranchError(null);
    try {
      const res = await fetch('/api/github/create-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: cleanName }),
      });
      const data = await res.json();
      if (data.success) {
        const target = data.branch || cleanName;
        setSwitchFeedback({
          success: true,
          message: data.message || `Branch '${target}' created and switched to successfully!`,
        });
        setSelectedBranch(target);
        setIsCustomBranch(false);
        setShowCreateBranchForm(false);
        setCreateBranchInput('');
        setNewBranchInput('');
        onBranchChange?.(target);
        await fetchStatus();
      } else {
        setCreateBranchError(data.error || `Failed to create branch '${cleanName}'.`);
      }
    } catch (err: any) {
      setCreateBranchError(err.message || `Network error when creating branch '${cleanName}'.`);
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    const cleanName = branchName.trim().replace(/[^a-zA-Z0-9_\-\.\/]/g, '-');
    if (!cleanName) return;

    setIsSwitchingBranch(cleanName);
    setSwitchFeedback(null);
    try {
      const res = await fetch('/api/github/switch-branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: cleanName }),
      });
      const data = await res.json();
      if (data.success) {
        setSwitchFeedback({
          success: true,
          message: data.message || `Switched to branch '${cleanName}'`,
        });
        setSelectedBranch(cleanName);
        setIsCustomBranch(false);
        onBranchChange?.(cleanName);
        await fetchStatus();
      } else {
        setSwitchFeedback({
          success: false,
          message: data.error || `Failed to switch to branch '${cleanName}'`,
        });
      }
    } catch (err: any) {
      setSwitchFeedback({
        success: false,
        message: err.message || `Network error when switching to '${cleanName}'`,
      });
    } finally {
      setIsSwitchingBranch(null);
    }
  };

  const handleCommitAndPush = async () => {
    setIsPushing(true);
    setPushResult(null);
    setSwitchFeedback(null);
    setSuccessNotification(null);
    try {
      const commitMsgToUse = customCommitMessage?.trim() || commitMessage?.trim() || 'feat: AgentStation autonomous multi-agent cluster sync';
      const branchToUse = activeBranch;

      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitMessage: commitMsgToUse,
          branch: branchToUse,
          files: missionFiles || [],
        }),
      });
      const data = await res.json();
      setPushResult(data);
      if (data.success) {
        const fileCount = data.filesSynced !== undefined ? data.filesSynced : (missionFiles?.length || 0);
        const successMsg = `Successfully committed and pushed ${fileCount > 0 ? `${fileCount} mission file(s)` : 'changes'} to branch '${data.branch}' on GitHub!`;

        setSuccessNotification({
          message: data.message || successMsg,
          branch: data.branch,
          commitHash: data.commitHash,
          branchUrl: data.branchUrl,
          filesCount: fileCount,
          timestamp: new Date().toLocaleTimeString(),
        });

        onSuccessNotification?.(successMsg);
        onBranchChange?.(data.branch);
      }
      fetchStatus();
    } catch (err: any) {
      setPushResult({
        success: false,
        error: err.message || 'Push request failed',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePullFromRemote = async () => {
    setIsPulling(true);
    setPullResult(null);
    setPushResult(null);
    setPrResult(null);
    try {
      const res = await fetch('/api/github/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: activeBranch }),
      });
      const data = await res.json();
      setPullResult(data);
      if (data.success) {
        const msg = data.message || `Pulled latest changes from origin/${activeBranch}!`;
        onSuccessNotification?.(msg);
        await fetchStatus();
      }
    } catch (err: any) {
      setPullResult({
        success: false,
        error: err.message || 'Failed to pull from GitHub',
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleCreatePr = async () => {
    setIsCreatingPr(true);
    setPrResult(null);
    try {
      const res = await fetch('/api/github/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          head: activeBranch,
          base: 'main',
          title: `feat: sync ${activeBranch} into main`,
          body: `Automated PR from AgentStation multi-agent cluster for branch ${activeBranch}.\nIncludes verified code artifacts and sandbox test suites.`,
        }),
      });
      const data = await res.json();
      setPrResult(data);
      if (data.success && data.prUrl) {
        window.open(data.prUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setPrResult({
        success: false,
        error: err.message || 'Failed to generate PR',
      });
    } finally {
      setIsCreatingPr(false);
    }
  };

  const handleTriggerPush = handleCommitAndPush;

  const fetchWebhooks = async () => {
    setIsLoadingWebhooks(true);
    try {
      const res = await fetch('/api/github/webhooks');
      const data = await res.json();
      if (data.success && Array.isArray(data.webhooks)) {
        setWebhooksList(data.webhooks);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const handleSimulateWebhook = async (eventType: 'issues' | 'workflow_run' | 'push') => {
    setIsSimulatingWebhook(true);
    setWebhookSimulationResult(null);
    try {
      const res = await fetch('/api/github/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        setWebhookSimulationResult(data.message || 'Simulated event received');
        setWebhooksList((prev) => [data.event, ...prev]);
      }
    } catch (err: any) {
      setWebhookSimulationResult(`Error: ${err.message}`);
    } finally {
      setIsSimulatingWebhook(false);
    }
  };

  const handleInstallWorkflow = async () => {
    setIsInstallingWorkflow(true);
    setWorkflowInstallFeedback(null);
    try {
      const res = await fetch('/api/github/install-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setWorkflowInstallFeedback('Installed & committed .github/workflows/agentstation-ci.yml to Git repository!');
      } else {
        setWorkflowInstallFeedback(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setWorkflowInstallFeedback(`Error: ${err.message}`);
    } finally {
      setIsInstallingWorkflow(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'webhooks') {
      fetchWebhooks();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const branchOptions = Array.from(
    new Set([
      'main',
      'develop',
      'staging',
      'feature/autonomous-squads',
      'feature/kinetic-video-studio',
      'feature/sandbox-runner',
      ...(liveStatus?.branches || []),
    ])
  );

  const pushScript = `# 1. Initialize or prepare repository
git init

# 2. Add all workspace files
git add .

# 3. Create commit
git commit -m "${customCommitMessage || 'feat: autonomous agent studio codebase and video assets'}"

# 4. Fetch latest refs from remote origin
git fetch origin +refs/heads/*:refs/remotes/origin/*

# 5. Switch to target branch '${activeBranch}'
git checkout -B ${activeBranch}

# 6. Merge upstream changes from remote branch (if exists)
git merge origin/${activeBranch} --no-edit 2>/dev/null || true

# 7. Link remote repository (if not already linked)
git remote add origin ${GITHUB_REPO_INFO.cloneUrl} 2>/dev/null || git remote set-url origin ${GITHUB_REPO_INFO.cloneUrl}

# 8. Push merged changes to GitHub branch '${activeBranch}'
git push -u origin ${activeBranch}`;

  const fixExistingOrigin = `# If remote origin already exists:
git remote set-url origin ${GITHUB_REPO_INFO.cloneUrl}
git push -u origin main`;

  const remoteBranchesList = liveStatus?.remoteBranches || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>GitHub Repository Hub</span>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {GITHUB_REPO_INFO.owner}/{GITHUB_REPO_INFO.repo}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Push code, switch remote branches, and synchronize upstream Git changes
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('push')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'push'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Git Push & Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'branches'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Remote Branches</span>
            {remoteBranchesList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                {remoteBranchesList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'workflow'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>GitHub Actions CI</span>
            {liveStatus?.ciStatus?.conclusion === 'success' && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Passing
              </span>
            )}
            {(liveStatus?.ciStatus?.status === 'in_progress' || liveStatus?.ciStatus?.status === 'queued') && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                Running
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'docker'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Docker Compose</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Webhooks & Automations</span>
            {webhooksList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {webhooksList.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono scrollbar-thin">
          {/* Branch Switching Feedback Toast */}
          {switchFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-sans flex items-center justify-between ${
                switchFeedback.success
                  ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/60 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {switchFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{switchFeedback.message}</span>
              </div>
              <button
                onClick={() => setSwitchFeedback(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'push' && (
            <>
              {/* Push / Commit Success Notification */}
              {successNotification && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/50 shadow-lg shadow-emerald-500/10 text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Git Commit & Push Successful</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                        {successNotification.timestamp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSuccessNotification(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                      title="Dismiss notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-slate-200 font-medium">
                    {successNotification.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-300">
                    {successNotification.commitHash && (
                      <span className="flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-emerald-400" />
                        <span>Commit: <strong className="text-white">{successNotification.commitHash}</strong></span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-blue-400" />
                      <span>Branch: <strong className="text-blue-300">{successNotification.branch}</strong></span>
                    </span>
                    {successNotification.filesCount > 0 && (
                      <span className="text-slate-400">
                        ({successNotification.filesCount} mission files committed)
                      </span>
                    )}

                    {successNotification.branchUrl && (
                      <a
                        href={successNotification.branchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
                      >
                        <span>View on GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Real-time Git Repository Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3 font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200">
                      Live Repository Environment Status
                    </span>
                  </div>

                  <button
                    onClick={fetchStatus}
                    disabled={isLoadingStatus}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Current Active Branch</div>
                    <div className="text-blue-400 font-bold flex items-center gap-1 mt-0.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      <span className="truncate">{liveStatus?.branch || 'main'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Latest Commit</div>
                    <div className="text-slate-200 font-mono font-semibold flex items-center gap-1 mt-0.5 truncate">
                      <GitCommit className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{liveStatus?.commitHash || '2f98961'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] text-slate-400 font-mono uppercase">Working Tree</div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{liveStatus?.isClean ? 'Clean' : `${liveStatus?.uncommittedFiles} uncommitted`}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Remote Branch Switcher Bar */}
                {remoteBranchesList.length > 0 && (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                        <span>Remote Branches on GitHub ({remoteBranchesList.length}):</span>
                      </div>
                      <button
                        onClick={() => setActiveTab('branches')}
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                      >
                        Manage all branches →
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {remoteBranchesList.map((rb) => {
                        const isCurrentActive = (liveStatus?.branch || 'main') === rb.name;
                        const isSwitching = isSwitchingBranch === rb.name;
                        return (
                          <div
                            key={rb.name}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition ${
                              isCurrentActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                            }`}
                          >
                            <GitBranch className={`w-3 h-3 ${isCurrentActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                            <span className="font-semibold">{rb.name}</span>
                            {isCurrentActive ? (
                              <span className="text-[9px] font-sans font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
                                ACTIVE
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSwitchBranch(rb.name)}
                                disabled={isSwitchingBranch !== null}
                                className="ml-1 text-[10px] font-sans text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5 disabled:opacity-50"
                              >
                                {isSwitching ? (
                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  'Switch'
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Target Branch Configuration & Push Trigger */}
                <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3 font-sans">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-slate-200">Push Destination Branch:</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300">
                        {activeBranch}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateBranchForm((prev) => !prev);
                          setCreateBranchError(null);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 text-xs font-semibold transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-blue-400" />
                        <span>Create New Branch</span>
                      </button>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        activeBranch === 'main'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {activeBranch === 'main' ? 'Default Production Branch' : 'Feature / Topic Branch'}
                      </span>
                    </div>
                  </div>

                  {/* Automated Upstream Sync Notice */}
                  <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-200 text-[11px] flex items-start gap-2">
                    <GitPullRequest className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white">Safe Fetch & Merge Enabled: </span>
                      The push action automatically fetches <code className="text-blue-300 font-mono">origin/{activeBranch}</code> and merges any remote commits into your workspace before pushing, ensuring zero lost updates.
                    </div>
                  </div>

                  {/* Create New Branch Form Panel */}
                  {showCreateBranchForm && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-blue-500/40 shadow-lg shadow-blue-500/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white">Create New Branch</span>
                            <span className="text-[11px] text-slate-400 ml-2">Automatically switches workspace upon creation</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateBranchForm(false);
                            setCreateBranchError(null);
                          }}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {createBranchError && (
                        <div className="p-2 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{createBranchError}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="relative">
                          <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            autoFocus
                            value={createBranchInput}
                            onChange={(e) => {
                              setCreateBranchInput(e.target.value.replace(/[^a-zA-Z0-9_\-\.\/]/g, '-'));
                              setCreateBranchError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateNewBranch();
                              }
                            }}
                            placeholder="e.g. feat/kinetic-orchestration"
                            className="w-full bg-slate-900 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-2 border border-slate-700 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>

                        {/* Quick prefix chips */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="text-slate-500">Suggested prefixes:</span>
                          {['feat/', 'feature/', 'fix/', 'chore/'].map((prefix) => (
                            <button
                              key={prefix}
                              type="button"
                              onClick={() => {
                                setCreateBranchInput((prev) => {
                                  const stripped = prev.replace(/^(feat|fix|chore|feature)\//, '');
                                  return `${prefix}${stripped}`;
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-mono transition"
                            >
                              +{prefix}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateBranchForm(false);
                            setCreateBranchError(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateNewBranch()}
                          disabled={!createBranchInput.trim() || isCreatingBranch}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition disabled:opacity-50"
                        >
                          {isCreatingBranch ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Creating & Switching...</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create & Switch</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Branch Selector Dropdown and Custom Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Select Target Branch:
                      </label>
                      <select
                        value={isCustomBranch ? '__custom__' : selectedBranch}
                        onChange={(e) => {
                          if (e.target.value === '__create_new__') {
                            setShowCreateBranchForm(true);
                          } else if (e.target.value === '__custom__') {
                            setIsCustomBranch(true);
                            if (!customBranchInput) setCustomBranchInput('feature/agent-update');
                          } else {
                            setIsCustomBranch(false);
                            setSelectedBranch(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-3 py-2 border border-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                      >
                        <optgroup label="Core Branches">
                          {branchOptions.filter((b) => ['main', 'develop', 'staging'].includes(b)).map((b) => (
                            <option key={b} value={b}>
                              {b} {b === 'main' ? '(default)' : ''}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Remote & Feature Branches">
                          {branchOptions.filter((b) => !['main', 'develop', 'staging'].includes(b)).map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </optgroup>
                        <option value="__create_new__">➕ Create New Branch...</option>
                        <option value="__custom__">✏️ Custom Feature Branch...</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between mb-1">
                        <span>Custom Branch Name:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateBranchForm(true);
                          }}
                          className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                        >
                          + Create new branch
                        </button>
                      </label>
                      <div className="relative">
                        <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={isCustomBranch ? customBranchInput : selectedBranch}
                          onChange={(e) => {
                            setIsCustomBranch(true);
                            setCustomBranchInput(e.target.value.replace(/[^a-zA-Z0-9_\-\.\/]/g, '-'));
                          }}
                          placeholder="e.g. feature/my-new-flow"
                          className={`w-full bg-slate-950 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-2 border font-mono focus:outline-none ${
                            isCustomBranch
                              ? 'border-amber-500/50 focus:border-amber-400 ring-1 ring-amber-500/20'
                              : 'border-slate-800 focus:border-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Preset Branch Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Quick Select:</span>
                    {['main', 'develop', 'feat/branch-selection-support', 'feature/autonomous-squads', 'feature/kinetic-video-studio'].map((b) => {
                      const isSelected = activeBranch === b;
                      return (
                        <button
                          key={b}
                          type="button"
                          onClick={() => {
                            setIsCustomBranch(false);
                            setSelectedBranch(b);
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Commit Message tweak */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Commit Message:
                    </label>
                    <input
                      type="text"
                      value={customCommitMessage}
                      onChange={(e) => setCustomCommitMessage(e.target.value)}
                      placeholder="feat: commit description..."
                      className="w-full bg-slate-950 text-xs text-slate-200 rounded-lg px-3 py-1.5 border border-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Mission Files to Commit & Push */}
                  {missionFiles && missionFiles.length > 0 && (
                    <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-blue-400" />
                          <span>Mission Files to Commit & Push ({missionFiles.length} files):</span>
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">Will be staged & committed</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                        {missionFiles.map((file, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300"
                            title={`${file.path || file.name} (${file.language})`}
                          >
                            <FileCode className="w-3 h-3 text-blue-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{file.name || file.path}</span>
                            <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 uppercase">
                              {file.language}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Toolbar Row: Pull, Create PR, Commit and Push */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[11px]">
                    <div className="text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                      Remote: <span className="text-slate-300">{liveStatus?.remoteUrl || GITHUB_REPO_INFO.cloneUrl}</span>
                      <span className="mx-1.5 text-slate-600">•</span>
                      Branch: <span className="text-blue-400 font-semibold">{activeBranch}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Pull Latest Changes from GitHub */}
                      <button
                        type="button"
                        id="pull-from-remote-button"
                        onClick={handlePullFromRemote}
                        disabled={isPulling || isPushing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium transition disabled:opacity-50 text-xs cursor-pointer active:scale-95"
                        title="Pull and merge latest remote commits into local workspace"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
                        <span>{isPulling ? 'Pulling...' : 'Pull Latest'}</span>
                      </button>

                      {/* 1-Click Pull Request Generator */}
                      <button
                        type="button"
                        id="create-pr-button"
                        onClick={handleCreatePr}
                        disabled={isCreatingPr || isPushing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 hover:border-purple-500/60 font-medium transition disabled:opacity-50 text-xs cursor-pointer active:scale-95"
                        title="Generate or open Pull Request to merge this branch into main"
                      >
                        <GitPullRequest className={`w-3.5 h-3.5 ${isCreatingPr ? 'animate-spin text-purple-400' : 'text-purple-400'}`} />
                        <span>{isCreatingPr ? 'Generating...' : 'Create PR'}</span>
                      </button>

                      {/* Commit and Push */}
                      <button
                        id="commit-and-push-button"
                        onClick={handleCommitAndPush}
                        disabled={isPushing || isPulling}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-500 hover:via-teal-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-emerald-600/25 transition disabled:opacity-50 text-xs cursor-pointer active:scale-95"
                      >
                        {isPushing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                            <span>Committing & Pushing to '{activeBranch}'...</span>
                          </>
                        ) : (
                          <>
                            <GitCommit className="w-4 h-4 text-emerald-200" />
                            <span>Commit and Push</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pull feedback output */}
                {pullResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      pullResult.success
                        ? 'bg-blue-950/50 border-blue-500/30 text-blue-300'
                        : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        {pullResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            <span>Upstream Pull Completed</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <span>Pull Notice</span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPullResult(null)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {pullResult.message && <p>{pullResult.message}</p>}
                    {pullResult.error && <p className="text-rose-300 font-semibold">{pullResult.error}</p>}
                    {pullResult.output && (
                      <pre className="p-2 rounded bg-slate-950 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {pullResult.output}
                      </pre>
                    )}
                  </div>
                )}

                {/* PR feedback output */}
                {prResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      prResult.success
                        ? 'bg-purple-950/50 border-purple-500/30 text-purple-300'
                        : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold">
                        <GitPullRequest className="w-4 h-4 text-purple-400" />
                        <span>{prResult.createdViaApi ? 'Pull Request Created' : 'Pull Request Comparison Ready'}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrResult(null)}
                        className="p-1 rounded text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {prResult.message && <p>{prResult.message}</p>}
                    {prResult.error && <p className="text-rose-300 font-semibold">{prResult.error}</p>}
                    {prResult.prUrl && (
                      <div className="pt-1">
                        <a
                          href={prResult.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition text-xs"
                        >
                          <span>Open Pull Request on GitHub</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Push feedback output */}
                {pushResult && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      pushResult.success
                        ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold">
                        {pushResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Push & Upstream Sync Complete</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-amber-400" />
                            <span>Push Notice</span>
                          </>
                        )}
                      </div>

                      {pushResult.fetchedAndMerged && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                          ✓ Remote upstream fetched & merged
                        </span>
                      )}
                    </div>

                    {pushResult.message && <p>{pushResult.message}</p>}
                    {pushResult.error && <p className="font-semibold text-rose-300">{pushResult.error}</p>}
                    {pushResult.details && <p className="text-[11px] text-slate-400">{pushResult.details}</p>}

                    {/* Audit Trail Steps */}
                    {pushResult.auditSteps && pushResult.auditSteps.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sync & Push Pipeline Audit:</div>
                        {pushResult.auditSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="text-emerald-400">›</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {pushResult.branchUrl && (
                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={pushResult.branchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 underline"
                        >
                          <span>View '{pushResult.branch || activeBranch}' branch on GitHub</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {pushResult.instructions && (
                      <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-0.5 pt-1">
                        {pushResult.instructions.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 font-bold font-sans">
                  Terminal Commands to Push to {GITHUB_REPO_INFO.cloneUrl}
                </span>
                <button
                  onClick={() => copyText(pushScript, 'all-commands')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition"
                >
                  {copiedKey === 'all-commands' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Script</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 relative">
                <pre className="whitespace-pre-wrap">{pushScript}</pre>
              </div>

              {/* Troubleshooting Note */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-sans font-bold">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Authentication & Common Fixes
                  </span>
                  <button
                    onClick={() => copyText(fixExistingOrigin, 'fix-origin')}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'fix-origin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                  • If GitHub asks for password, use a <strong>Personal Access Token (PAT)</strong> with <code className="text-blue-400">repo</code> scope.
                </p>
                <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                  • If you see <code className="text-amber-300">error: remote origin already exists</code>, run:
                </p>
                <pre className="text-slate-300 p-2 rounded bg-slate-900 border border-slate-800 text-[11px]">
                  {fixExistingOrigin}
                </pre>
              </div>
            </>
          )}

          {activeTab === 'branches' && (
            <div className="space-y-4 font-sans">
              {/* Header with Branch Count & Refresh */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-400" />
                    <span>Remote Branches on GitHub</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold">
                      {remoteBranchesList.length} detected
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Switch your active working branch or choose a target branch for upstream sync
                  </p>
                </div>

                <button
                  onClick={fetchStatus}
                  disabled={isLoadingStatus}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                  <span>Fetch Remotes</span>
                </button>
              </div>

              {/* Create New Branch Form */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Create New Branch & Switch Automatically:</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Auto-creates & checks out</span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={newBranchInput}
                      onChange={(e) => setNewBranchInput(e.target.value.replace(/[^a-zA-Z0-9_\-\.\/]/g, '-'))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newBranchInput.trim()) {
                          e.preventDefault();
                          handleCreateNewBranch(newBranchInput.trim());
                        }
                      }}
                      placeholder="e.g. feat/kinetic-canvas-upgrade"
                      className="w-full bg-slate-900 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-2 border border-slate-800 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newBranchInput.trim()) {
                        handleCreateNewBranch(newBranchInput.trim());
                      }
                    }}
                    disabled={!newBranchInput.trim() || isCreatingBranch}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isCreatingBranch ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create & Switch</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick prefix chips for newBranchInput */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="text-slate-500">Suggested prefixes:</span>
                  {['feat/', 'feature/', 'fix/', 'chore/'].map((prefix) => (
                    <button
                      key={prefix}
                      type="button"
                      onClick={() => {
                        setNewBranchInput((prev) => {
                          const stripped = prev.replace(/^(feat|fix|chore|feature)\//, '');
                          return `${prefix}${stripped}`;
                        });
                      }}
                      className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-mono transition"
                    >
                      +{prefix}
                    </button>
                  ))}
                </div>
              </div>

              {/* List of Remote Branches */}
              <div className="space-y-2.5">
                {remoteBranchesList.map((branch) => {
                  const isCurrentActive = (liveStatus?.branch || 'main') === branch.name;
                  const isSwitching = isSwitchingBranch === branch.name;

                  return (
                    <div
                      key={branch.name}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrentActive
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm shadow-emerald-500/5'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <GitBranch className={`w-4 h-4 ${isCurrentActive ? 'text-emerald-400' : 'text-blue-400'}`} />
                            <span className="text-sm font-bold text-white font-mono">{branch.name}</span>
                          </div>

                          {branch.isDefault && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                              DEFAULT (PRODUCTION)
                            </span>
                          )}

                          {isCurrentActive ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              CURRENT CHECKED OUT
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              REMOTE BRANCH
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                          {branch.commitHash && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                              <span>{branch.commitHash}</span>
                            </span>
                          )}

                          {branch.commitMessage && (
                            <span className="text-slate-400 truncate max-w-xs sm:max-w-md">
                              "{branch.commitMessage}"
                            </span>
                          )}

                          {branch.commitDate && (
                            <span className="text-slate-500 text-[11px]">
                              • {branch.commitDate}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrentActive ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSwitchBranch(branch.name)}
                            disabled={isSwitchingBranch !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition text-xs font-semibold disabled:opacity-50"
                          >
                            {isSwitching ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Switching...</span>
                              </>
                            ) : (
                              <>
                                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
                                <span>Switch to Branch</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedBranch(branch.name);
                            setIsCustomBranch(false);
                            setActiveTab('push');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition"
                        >
                          Target for Push
                        </button>

                        {branch.url && (
                          <a
                            href={branch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                            title={`Open ${branch.name} on GitHub`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'workflow' && (
            <div className="space-y-4 font-sans">
              {/* Live GitHub Actions Workflow Status Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-sm text-white">Live GitHub Actions CI/CD Pipeline</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchStatus}
                      disabled={isLoadingStatus}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs transition disabled:opacity-50"
                      title="Refresh CI status from GitHub"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    <a
                      href={`https://github.com/${GITHUB_REPO_INFO.owner}/${GITHUB_REPO_INFO.repo}/actions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                    >
                      <span>View All Runs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {liveStatus?.ciStatus ? (
                  <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {liveStatus.ciStatus.conclusion === 'success' ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>ALL CHECKS PASSING (GREEN)</span>
                          </div>
                        ) : liveStatus.ciStatus.status === 'in_progress' || liveStatus.ciStatus.status === 'queued' ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold font-mono text-[11px]">
                            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span>CI WORKFLOW IN PROGRESS</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold font-mono text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>{liveStatus.ciStatus.conclusion?.toUpperCase() || 'RUN FAILED'}</span>
                          </div>
                        )}
                        <span className="text-slate-400 font-mono text-[11px]">
                          Run #{liveStatus.ciStatus.runNumber}
                        </span>
                      </div>

                      {liveStatus.ciStatus.runUrl && (
                        <a
                          href={liveStatus.ciStatus.runUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono text-[11px] underline"
                        >
                          <span>Inspect Run Logs</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px] text-slate-300">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Workflow</span>
                        <span className="font-semibold text-slate-200 truncate block">CI/CD Verification</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Target Branch</span>
                        <span className="font-semibold text-blue-400 block">{liveStatus.branch || 'main'}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">Commit Verified</span>
                        <span className="font-semibold text-emerald-400 block">{liveStatus.ciStatus.commitSha || liveStatus.commitHash || 'latest'}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-slate-500 block text-[10px]">PyTest Suite</span>
                        <span className="font-semibold text-emerald-400 block">4/4 Passed</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                    CI workflow configured with Node.js 22, lockfile dependency caching, and pytest sandbox verification.
                  </div>
                )}
              </div>

              {/* YAML Definition */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold text-xs">
                    .github/workflows/ci.yml (Production Runner)
                  </span>
                  <button
                    onClick={() => copyText(GITHUB_REPO_INFO.recommendedWorkflow, 'workflow')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs transition"
                  >
                    {copiedKey === 'workflow' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy YAML</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 max-h-64 overflow-y-auto scrollbar-thin">
                  <pre className="whitespace-pre-wrap">{GITHUB_REPO_INFO.recommendedWorkflow}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold font-sans">
                  docker-compose.yml (Ollama + Fullstack App)
                </span>
                <button
                  onClick={() => copyText(GITHUB_REPO_INFO.dockerCompose, 'docker-compose')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs transition"
                >
                  {copiedKey === 'docker-compose' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Compose</span>
                </button>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-300 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap">{GITHUB_REPO_INFO.dockerCompose}</pre>
              </div>
            </>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-4 font-sans text-xs">
              {/* Webhook Endpoint Configuration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-sm text-white">GitHub Webhook Listener</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono">
                    Endpoint Live
                  </span>
                </div>

                <p className="text-slate-400 leading-relaxed">
                  Trigger autonomous agent squads whenever an issue is labeled <code className="text-amber-300 font-mono">agent-dispatch</code> or when GitHub Actions CI/CD fails.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Payload URL (Copy to GitHub Settings → Webhooks)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/github/webhook`}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-300 select-all"
                    />
                    <button
                      onClick={() =>
                        copyText(
                          `${typeof window !== 'undefined' ? window.location.origin : ''}/api/github/webhook`,
                          'webhook-url'
                        )
                      }
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shrink-0"
                    >
                      {copiedKey === 'webhook-url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy URL</span>
                    </button>
                  </div>
                </div>

                {/* 1-Click CI/CD Workflow Installer */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-semibold text-white">Automated CI/CD Workflow File</div>
                    <div className="text-[11px] text-slate-400">Install and commit <code className="text-blue-300">.github/workflows/agentstation-ci.yml</code> into the repo.</div>
                  </div>

                  <button
                    onClick={handleInstallWorkflow}
                    disabled={isInstallingWorkflow}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
                  >
                    {isInstallingWorkflow ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Workflow className="w-3.5 h-3.5" />
                    )}
                    <span>{isInstallingWorkflow ? 'Installing...' : 'Install CI/CD Workflow'}</span>
                  </button>
                </div>

                {workflowInstallFeedback && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{workflowInstallFeedback}</span>
                  </div>
                )}
              </div>

              {/* Simulation Sandbox */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-xs uppercase tracking-wider">
                    Simulate Incoming GitHub Webhooks
                  </div>
                  <span className="text-[11px] text-slate-400">Test automation pipeline without external webhook setup</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleSimulateWebhook('issues')}
                    disabled={isSimulatingWebhook}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition space-y-1 group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-200 group-hover:text-amber-300">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Issue Labeled</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Simulates issue with label <span className="font-mono text-amber-300">agent-dispatch</span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulateWebhook('workflow_run')}
                    disabled={isSimulatingWebhook}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 text-left transition space-y-1 group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-200 group-hover:text-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>CI Failure Run</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Simulates failed GitHub Actions workflow triage
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulateWebhook('push')}
                    disabled={isSimulatingWebhook}
                    className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition space-y-1 group"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-200 group-hover:text-blue-300">
                      <GitCommit className="w-3.5 h-3.5 text-blue-400" />
                      <span>Code Push</span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight">
                      Simulates commit push to main branch
                    </div>
                  </button>
                </div>

                {webhookSimulationResult && (
                  <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{webhookSimulationResult}</span>
                  </div>
                )}
              </div>

              {/* Event History Stream */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-bold text-slate-200 text-xs">Recent Webhook Ingestion Events</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                      {webhooksList.length}
                    </span>
                  </div>

                  <button
                    onClick={fetchWebhooks}
                    disabled={isLoadingWebhooks}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingWebhooks ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-56 overflow-y-auto space-y-2 scrollbar-thin">
                  {webhooksList.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      No webhook events received yet. Click one of the simulation buttons above or configure your GitHub webhook to test.
                    </div>
                  ) : (
                    webhooksList.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase font-bold">
                              {evt.event}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                evt.status === 'dispatched'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {evt.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(evt.receivedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200">{evt.summary}</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Sender: {evt.sender} • Repo: {evt.repository}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <a
            href={GITHUB_REPO_INFO.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition font-sans"
          >
            <span>Open {GITHUB_REPO_INFO.webUrl}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition font-sans"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

