import React, { useState } from 'react';
import { X, Cpu, CheckCircle2, AlertCircle, RefreshCw, Terminal, Copy, Check } from 'lucide-react';

interface OllamaModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiProvider?: 'gemini' | 'ollama';
  onSelectProvider?: (provider: 'gemini' | 'ollama') => void;
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export const OllamaModal: React.FC<OllamaModalProps> = ({
  isOpen,
  onClose,
  aiProvider = 'gemini',
  onSelectProvider,
  selectedModel = 'llama3',
  onSelectModel,
}) => {
  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ checked: boolean; online: boolean; models?: any[]; message?: string }>({
    checked: false,
    online: false,
  });
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>(selectedModel);

  if (!isOpen) return null;

  const testConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/ollama/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: endpoint }),
      });
      const data = await res.json();
      setStatus({
        checked: true,
        online: data.online,
        models: data.models,
        message: data.reason || (data.online ? 'Connected to local Ollama daemon' : 'Unreachable'),
      });
    } catch (err: any) {
      setStatus({
        checked: true,
        online: false,
        message: err.message || 'Failed to ping',
      });
    } finally {
      setChecking(false);
    }
  };

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Local Ollama Configuration</h2>
              <p className="text-xs text-slate-400">
                Run models completely locally with 0 API costs and privacy
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Active Provider Selector */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">Active Agent Engine:</label>
              <span className="text-[10px] text-slate-400">Controls backend synthesis route</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSelectProvider?.('gemini')}
                className={`p-3 rounded-lg border text-left transition ${
                  aiProvider === 'gemini'
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Gemini 2.5 Flash</span>
                  {aiProvider === 'gemini' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">High-speed cloud cluster orchestrator</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectProvider?.('ollama')}
                className={`p-3 rounded-lg border text-left transition ${
                  aiProvider === 'ollama'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>Ollama Local</span>
                  {aiProvider === 'ollama' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Offline, private on localhost:11434</div>
              </button>
            </div>
          </div>

          {/* Endpoint Ping Bar */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-slate-300 font-semibold block">
              Ollama Host Endpoint:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:11434"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-purple-500 text-xs"
              />
              <button
                onClick={testConnection}
                disabled={checking}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {checking ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Ping</span>
              </button>
            </div>

            {/* Model input for Ollama */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-[11px] text-slate-400 block mb-1">
                Target Ollama Model Name:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeModel}
                  onChange={(e) => {
                    setActiveModel(e.target.value);
                    onSelectModel?.(e.target.value);
                  }}
                  placeholder="llama3, qwen2.5-coder:14b, deepseek-coder"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-purple-500 text-xs"
                />
              </div>
            </div>

            {status.checked && (
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 font-mono text-xs ${
                  status.online
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                {status.online ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{status.message}</span>
              </div>
            )}
          </div>

          {/* Recommended Models */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-200">Recommended Local Agent Models:</h3>
            <div className="space-y-2 font-mono text-[11px]">
              {[
                {
                  role: 'Engineering & Tools',
                  cmd: 'ollama pull qwen2.5-coder:14b',
                  desc: 'Elite code syntax and tool calling',
                },
                {
                  role: 'Creative & Video Scripting',
                  cmd: 'ollama pull llama3.3:70b',
                  desc: 'High-reasoning storytelling and hooks',
                },
                {
                  role: 'QA & Security Auditing',
                  cmd: 'ollama pull deepseek-r1:14b',
                  desc: 'Chain-of-thought verification and edge cases',
                },
              ].map((item) => (
                <div
                  key={item.cmd}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-slate-400 font-sans text-xs font-semibold">{item.role}</div>
                    <div className="text-purple-300">{item.cmd}</div>
                    <div className="text-slate-500 text-[10px]">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => copyCommand(item.cmd)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {copiedCmd === item.cmd ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
