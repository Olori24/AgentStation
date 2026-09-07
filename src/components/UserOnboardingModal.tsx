import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Play,
  CheckCircle2,
  Terminal,
  Shield,
  Video,
  Layers,
  Cpu,
  Github,
  ArrowRight,
  ExternalLink,
  Code2,
  Workflow,
  Lock,
  Activity,
  CreditCard,
  ListTodo
} from 'lucide-react';
import { SquadMission } from '../types';
import { SAMPLE_MISSIONS } from '../data/sampleMissions';
import { GITHUB_REPO_INFO } from '../data/defaults';
import { AgentStationLogo } from './AgentStationLogo';

interface UserOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMission: (mission: SquadMission) => void;
  onRunPrompt: (promptText: string) => void;
  aiProvider: 'gemini' | 'ollama';
  ollamaModel: string;
}

export const UserOnboardingModal: React.FC<UserOnboardingModalProps> = ({
  isOpen,
  onClose,
  onSelectMission,
  onRunPrompt,
  aiProvider,
  ollamaModel,
}) => {
  const [activeTab, setActiveTab] = useState<'usecases' | 'architecture' | 'devops'>('usecases');

  if (!isOpen) return null;

  const realUseCases = [
    {
      id: 'uc-1',
      missionId: 'mission-001',
      title: 'Autonomous CLI Task Engine & Live Web GUI',
      badge: 'Productivity & Core Engine',
      icon: ListTodo,
      accentColor: '#3b82f6',
      description:
        'Full-featured task management engine with JSON persistence, clean CLI dispatch table, interactive web GUI, and 100% PyTest assertion coverage.',
      prompt: 'Build an autonomous CLI Task Manager with JSON persistence, unit tests, and a high-impact launch promo video',
      deliverables: ['task_manager.py', 'test_task_manager.py', 'public/index.html', 'Dockerfile', 'Promo Video'],
      pyTestResults: '3/3 Tests Passed (0.08s)',
    },
    {
      id: 'uc-2',
      missionId: 'mission-002',
      title: 'Real-Time WebSocket Telemetry HUD',
      badge: 'Observability & High-Throughput',
      icon: Activity,
      accentColor: '#10b981',
      description:
        'Streaming telemetry ingest server with a 60 FPS HTML5 Canvas visualizer, low-overhead event loop, hardware metric monitors, and cyber dark theme.',
      prompt: 'Build a Real-Time WebSocket Telemetry Dashboard with HTML5 Canvas visualizer and dark cyber theme',
      deliverables: ['telemetry_server.py', 'test_telemetry.py', 'public/index.html', 'Kinetic Cyber Video'],
      pyTestResults: '2/2 Tests Passed (0.08s)',
    },
    {
      id: 'uc-3',
      missionId: 'mission-003',
      title: 'Cryptographic AES-256 File Vault',
      badge: 'Security & Zero-Knowledge',
      icon: Lock,
      accentColor: '#ec4899',
      description:
        'Zero-knowledge environment secret vault with PBKDF2 (100,000 rounds) key derivation, HMAC SHA-256 tamper defense, and cryptanalysis audit suite.',
      prompt: 'Build a secure cryptographic AES-256 File Vault with PBKDF2 key derivation and compliance report',
      deliverables: ['vault.py', 'test_vault.py', 'public/index.html', 'Compliance Video'],
      pyTestResults: '2/2 Tests Passed (0.09s)',
    },
    {
      id: 'uc-4',
      missionId: 'mission-004',
      title: 'Stripe Webhook & Payment Idempotency Engine',
      badge: 'Fintech & Resilient APIs',
      icon: CreditCard,
      accentColor: '#8b5cf6',
      description:
        'Enterprise payment webhook handler featuring cryptographic signature verification, distributed idempotency deduplication ledger, and replay attack defense.',
      prompt: 'Build a production Stripe Webhook & Payment Idempotency Microservice with Deduplication Ledger, PyTest assertions, and launch video',
      deliverables: ['payment_webhook.py', 'test_payment_webhook.py', 'public/index.html', 'Fintech Promo'],
      pyTestResults: '2/2 Tests Passed (0.08s)',
    },
  ];

  const handleInstantTestDrive = (missionId: string) => {
    const found = SAMPLE_MISSIONS.find((m) => m.id === missionId) || SAMPLE_MISSIONS[0];
    if (found) {
      onSelectMission(found);
      onClose();
    }
  };

  const handleRunLiveAI = (promptText: string) => {
    onRunPrompt(promptText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <AgentStationLogo
              size="md"
              showText={false}
              isLive={true}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Agent<span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Station</span>
                  <span className="text-slate-400 font-normal"> // Quickstart & Test Drive</span>
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-mono">
                  Autonomous 5-Agent Squad
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Test real-world engineering workflows end-to-end: architecture, code, sandbox tests, kinetic video, and GitHub sync.
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
        <div className="px-5 sm:px-6 pt-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('usecases')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === 'usecases'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Real-World Use Cases</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">4</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === 'architecture'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>5-Agent Squad Workflow</span>
          </button>

          <button
            onClick={() => setActiveTab('devops')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 ${
              activeTab === 'devops'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>DevOps, CI/CD & GitHub</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin">
          {activeTab === 'usecases' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">How to test real use cases:</span> Click{' '}
                  <strong className="text-emerald-300">"Test Drive (Instant)"</strong> to explore pre-verified working code, live interactive Web GUI, unit tests, and video promo immediately. Or click{' '}
                  <strong className="text-blue-300">"Run with AI Squad"</strong> to watch the 5 agents orchestrate code live from scratch!
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {realUseCases.map((uc) => {
                  const Icon = uc.icon;
                  return (
                    <div
                      key={uc.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-900 border border-slate-800 text-slate-400">
                            {uc.badge}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {uc.pyTestResults}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${uc.accentColor}18`, color: uc.accentColor }}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white">{uc.title}</h3>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {uc.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-400">
                          {uc.deliverables.map((d, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleInstantTestDrive(uc.missionId)}
                          className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Test Drive (Instant)</span>
                        </button>

                        <button
                          onClick={() => handleRunLiveAI(uc.prompt)}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
                          title="Generate fresh code with current AI model"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                          <span>Live AI</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span>The 5-Agent Specialized Handoff Pipeline</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unlike single-shot chatbots, AgentStation decouples architecture, programming, quality assurance, marketing positioning, and media compilation into 5 distinct agents with strict responsibility contracts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-blue-400">1. Atlas</div>
                    <div className="text-[11px] text-slate-300 font-semibold">Lead Architect</div>
                    <div className="text-[10px] text-slate-500">Designs contracts, data schemas, and folder structures.</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-emerald-400">2. Cypher</div>
                    <div className="text-[11px] text-slate-300 font-semibold">Senior Engineer</div>
                    <div className="text-[10px] text-slate-500">Writes complete production code across all files.</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-amber-400">3. Sentinel</div>
                    <div className="text-[11px] text-slate-300 font-semibold">DevOps & QA</div>
                    <div className="text-[10px] text-slate-500">Executes PyTest assertion harness in sandboxed container.</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-pink-400">4. Vesper</div>
                    <div className="text-[11px] text-slate-300 font-semibold">Creative Director</div>
                    <div className="text-[10px] text-slate-500">Synthesizes value propositions, hooks, and video script.</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                    <div className="font-bold text-purple-400">5. Nova</div>
                    <div className="text-[11px] text-slate-300 font-semibold">Motion Producer</div>
                    <div className="text-[10px] text-slate-500">Renders kinetic typography video with voiceover timing.</div>
                  </div>
                </div>
              </div>

              {/* Active Engine Info */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Current Intelligence Engine</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {aiProvider === 'gemini' ? 'Google Gemini 2.5/3.8 Flash (Cloud AI)' : `Local Offline Ollama (${ollamaModel})`}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
                  Autonomous Multi-Turn Synthesis
                </span>
              </div>
            </div>
          )}

          {activeTab === 'devops' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Github className="w-4 h-4 text-slate-300" />
                    <span>Target GitHub Repository</span>
                  </h3>
                  <a
                    href={GITHUB_REPO_INFO.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono"
                  >
                    <span>{GITHUB_REPO_INFO.owner}/{GITHUB_REPO_INFO.repo}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Every mission produced in AgentStation can be committed, pushed, or opened as a Pull Request directly to GitHub with zero command-line friction.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-mono text-[11px]">Git Branch</div>
                    <div className="font-bold text-emerald-400 font-mono">main (default)</div>
                    <div className="text-[10px] text-slate-500">Atomic branch switching supported</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-mono text-[11px]">CI/CD Actions</div>
                    <div className="font-bold text-blue-400 font-mono">ci.yml Included</div>
                    <div className="text-[10px] text-slate-500">Automated PyTest + container verification</div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-mono text-[11px]">Containerization</div>
                    <div className="font-bold text-amber-400 font-mono">Dockerfile + Compose</div>
                    <div className="text-[10px] text-slate-500">Self-contained reproducible runtime</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            Ready for real user testing • 4 production templates loaded
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              <span>Explore Active Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
