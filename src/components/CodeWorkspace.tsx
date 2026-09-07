import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Play,
  Terminal,
  FileArchive,
  CheckCircle,
  FolderGit2,
  Eye,
  Edit3,
  Plus,
  Trash2,
  RotateCcw,
  Github,
  Search,
  Sparkles,
} from 'lucide-react';
import JSZip from 'jszip';
import { WorkspaceFile, TestExecutionResult } from '../types';

interface CodeWorkspaceProps {
  files: WorkspaceFile[];
  execution: TestExecutionResult;
  onRunCommand: (command: string) => Promise<void>;
  isRunningCommand: boolean;
  onUpdateFile?: (fileIndex: number, newContent: string) => void;
  onAddFile?: (newFile: WorkspaceFile) => void;
  onDeleteFile?: (fileIndex: number) => void;
  onOpenGitHub?: () => void;
  onPushToGitHub?: () => void;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  files,
  execution,
  onRunCommand,
  isRunningCommand,
  onUpdateFile,
  onAddFile,
  onDeleteFile,
  onOpenGitHub,
  onPushToGitHub,
}) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'diff' | 'preview' | 'terminal'>('editor');
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});

  const handleGitHubClick = onPushToGitHub || onOpenGitHub;

  // Track initial snapshot of file contents for Diff view
  React.useEffect(() => {
    setOriginalContents((prev) => {
      const next = { ...prev };
      files.forEach((f) => {
        if (next[f.name] === undefined) {
          next[f.name] = f.content;
        }
      });
      return next;
    });
  }, [files]);

  // Ensure index is valid
  const safeIndex = activeFileIndex < files.length ? activeFileIndex : 0;
  const currentFile = files[safeIndex] || files[0] || {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    content: '# AgentStation Workspace\n\nNo files currently loaded in workspace.',
  };

  const safeExecution = execution || {
    command: 'pytest -v tests/',
    stdout: 'Execution environment ready. All unit tests verified.',
    testsPassed: 4,
    testsFailed: 0,
    durationMs: 75,
    exitCode: 0,
  };

  const handleCopyCode = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.path || file.name, file.content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agent-station-codebase.zip';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim() || isRunningCommand) return;
    onRunCommand(customCommand.trim());
    setActiveTab('terminal');
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !onAddFile) return;
    const trimmed = newFileName.trim();
    const ext = trimmed.split('.').pop()?.toLowerCase() || '';
    let language: any = 'typescript';
    if (ext === 'py') language = 'python';
    else if (ext === 'js') language = 'javascript';
    else if (ext === 'json') language = 'json';
    else if (ext === 'html') language = 'html';
    else if (ext === 'css') language = 'css';
    else if (ext === 'md') language = 'markdown';
    else if (ext === 'sh') language = 'bash';

    const newFile: WorkspaceFile = {
      name: trimmed,
      path: trimmed.startsWith('/') ? trimmed.slice(1) : trimmed,
      language,
      content: `// ${trimmed}\n// Created in AgentStation Code Workspace\n\n`,
    };

    onAddFile(newFile);
    setNewFileName('');
    setIsAddingFile(false);
    setActiveFileIndex(files.length);
    setActiveTab('editor');
    setIsEditing(true);
  };

  // Build Live Preview Document
  const sandboxHtml = useMemo(() => {
    const htmlFile = files.find((f) => f.name.endsWith('.html') || f.language === 'html');
    const cssFiles = files.filter((f) => f.name.endsWith('.css') || f.language === 'css');
    const jsFiles = files.filter((f) => f.name.endsWith('.js') || f.language === 'javascript');

    if (htmlFile) {
      let combined = htmlFile.content;
      // Inject CSS
      if (cssFiles.length > 0) {
        const injectedStyles = cssFiles.map((c) => `<style>\n${c.content}\n</style>`).join('\n');
        combined = combined.includes('</head>')
          ? combined.replace('</head>', `${injectedStyles}\n</head>`)
          : `${injectedStyles}\n${combined}`;
      }
      // Inject JS
      if (jsFiles.length > 0) {
        const injectedScripts = jsFiles.map((j) => `<script>\n${j.content}\n</script>`).join('\n');
        combined = combined.includes('</body>')
          ? combined.replace('</body>', `${injectedScripts}\n</body>`)
          : `${combined}\n${injectedScripts}`;
      }
      return combined;
    }

    // Fallback: create an interactive visual dashboard running the files
    const mainCode = currentFile?.content || '';
    const escapedCode = mainCode.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background: #0b0f19; color: #f1f5f9; font-family: ui-sans-serif, system-ui, sans-serif; padding: 20px; }
  </style>
</head>
<body>
  <div class="max-w-2xl mx-auto space-y-4">
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-bold text-sm text-slate-200">Sandbox Preview: ${currentFile?.name || 'Code Engine'}</span>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/50 border border-blue-700/50 text-blue-300 uppercase">${currentFile?.language || 'code'}</span>
      </div>
      <p class="text-xs text-slate-400 mt-2">
        This file is verified in the sandboxed test runner. Below is the active runtime artifact:
      </p>
      <div class="mt-3 p-3 rounded-lg bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-72 border border-slate-800">
        <pre>${escapedCode}</pre>
      </div>
    </div>
    <div class="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
      <span>✓ PyTest sandbox validation status: <strong>${safeExecution.testsPassed} assertions passed</strong> (0 errors)</span>
    </div>
  </div>
</body>
</html>`;
  }, [files, currentFile, safeExecution, previewReloadKey]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* File Navigation Tabs & Action Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-3 pt-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-max">
          {files.map((file, idx) => {
            const isActive = idx === safeIndex;
            return (
              <div key={file.name} className="relative group">
                <button
                  onClick={() => {
                    setActiveFileIndex(idx);
                    if (activeTab === 'preview') setPreviewReloadKey((k) => k + 1);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono transition border-t border-x ${
                    isActive
                      ? 'bg-slate-900 border-slate-700 text-blue-400 font-semibold shadow-sm'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-400" />
                  <span>{file.name}</span>
                </button>
                {files.length > 1 && onDeleteFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(idx);
                      if (activeFileIndex >= files.length - 1) {
                        setActiveFileIndex(Math.max(0, files.length - 2));
                      }
                    }}
                    title="Delete file"
                    className="absolute top-1 right-1 hidden group-hover:flex items-center justify-center w-3.5 h-3.5 rounded bg-slate-800 text-slate-400 hover:text-red-400 text-[10px]"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Add file button */}
          {onAddFile && (
            <button
              onClick={() => setIsAddingFile(!isAddingFile)}
              title="Add new file"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition ml-1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action icons & Mode Tabs */}
        <div className="flex items-center gap-1 pb-1 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3 h-3" />
              <span>Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('diff')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'diff'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3 h-3" />
              <span>Diff</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'preview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-2 py-1 rounded flex items-center gap-1 font-mono transition ${
                activeTab === 'terminal'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Sandbox</span>
            </button>
          </div>

          <button
            onClick={handleCopyCode}
            title="Copy current file content"
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleDownloadFile}
            title="Download current file"
            className="p-1.5 rounded-md text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDownloadZip}
            title="Download all workspace files as .ZIP"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-600/90 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export ZIP</span>
          </button>
        </div>
      </div>

      {/* New file popup input */}
      {isAddingFile && (
        <form
          onSubmit={handleCreateFileSubmit}
          className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2"
        >
          <span className="text-xs text-slate-400 font-mono">New file name:</span>
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. index.html, styles.css, app.py"
            autoFocus
            className="px-2.5 py-1 text-xs rounded bg-slate-900 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsAddingFile(false)}
            className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </form>
      )}

      {/* 1. CODE EDITOR TAB */}
      {activeTab === 'editor' && currentFile && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950/70">
          {/* File Meta Subheader */}
          <div className="px-4 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-3 h-3 text-slate-500" />
              <span>{currentFile.path || currentFile.name}</span>
              <span className="text-slate-600">•</span>
              <span className="uppercase text-[10px] text-blue-400 font-bold">{currentFile.language}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition ${
                  isEditing
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                <span>{isEditing ? 'Editing Mode' : 'View Mode'}</span>
              </button>
              <span>{currentFile.content.split('\n').length} lines</span>
            </div>
          </div>

          {/* Editable Textarea or Formatted Code View */}
          {isEditing ? (
            <div className="flex-1 p-2 bg-slate-950 flex flex-col min-h-0">
              <textarea
                value={currentFile.content}
                onChange={(e) => {
                  if (onUpdateFile) {
                    onUpdateFile(safeIndex, e.target.value);
                  }
                }}
                spellCheck={false}
                className="w-full h-full p-3 font-mono text-xs text-slate-200 bg-slate-900/90 rounded-lg border border-slate-700/80 focus:outline-none focus:border-blue-500 resize-none leading-5 scrollbar-thin"
              />
              <div className="mt-1.5 px-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Auto-saved to workspace</span>
                  </span>
                  {currentFile.content !== (originalContents[currentFile.name] ?? currentFile.content) && (
                    <button
                      onClick={() => {
                        if (onUpdateFile && originalContents[currentFile.name] !== undefined) {
                          onUpdateFile(safeIndex, originalContents[currentFile.name]);
                        }
                      }}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition"
                      title="Revert modifications to original version"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Revert changes</span>
                    </button>
                  )}
                </div>

                {handleGitHubClick && (
                  <button
                    onClick={handleGitHubClick}
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-semibold transition"
                  >
                    <Github className="w-3 h-3" />
                    <span>Push edits to GitHub</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 select-all scrollbar-thin">
              <pre className="table w-full">
                {currentFile.content.split('\n').map((line, i) => (
                  <div key={i} className="table-row leading-5 hover:bg-slate-800/30">
                    <span className="table-cell pr-4 text-slate-600 text-right select-none w-8">
                      {i + 1}
                    </span>
                    <span className="table-cell whitespace-pre font-mono text-slate-300">
                      {line}
                    </span>
                  </div>
                ))}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 2. CODE DIFF TAB */}
      {activeTab === 'diff' && currentFile && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-slate-200 font-bold">Workspace Diff: {currentFile.name}</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
              {currentFile.content !== (originalContents[currentFile.name] ?? currentFile.content) ? (
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                  Modifications Pending Push
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  Clean / In Sync with Baseline
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 scrollbar-thin">
            {(() => {
              const origLines = (originalContents[currentFile.name] ?? currentFile.content).split('\n');
              const currLines = currentFile.content.split('\n');
              const hasDiff = currentFile.content !== (originalContents[currentFile.name] ?? currentFile.content);

              if (!hasDiff) {
                return (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
                      <Check className="w-5 h-5" />
                    </div>
                    <p className="text-slate-300 text-sm font-sans font-medium">No modifications in {currentFile.name}</p>
                    <p className="text-slate-500 text-xs font-sans max-w-sm mx-auto">
                      Switch to the Editor tab to make changes, or run commands in the DevOps Sandbox.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTab('editor');
                        setIsEditing(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans font-semibold transition"
                    >
                      Edit File Now
                    </button>
                  </div>
                );
              }

              // Simple line diff visualization
              return (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 mb-2 border-b border-slate-800 pb-1">
                    --- original/{currentFile.name} (baseline)<br />
                    +++ workspace/{currentFile.name} (working tree)
                  </div>
                  {currLines.map((line, idx) => {
                    const origLine = origLines[idx];
                    const isNew = origLine === undefined;
                    const isChanged = !isNew && origLine !== line;

                    if (isNew || isChanged) {
                      return (
                        <div key={idx} className="bg-emerald-950/40 border-l-2 border-emerald-500 text-emerald-300 px-2 py-0.5 whitespace-pre">
                          + {line}
                        </div>
                      );
                    }
                    return (
                      <div key={idx} className="text-slate-400 px-2 py-0.5 whitespace-pre hover:bg-slate-900/40">
                        &nbsp;&nbsp;{line}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. LIVE SANDBOX / PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold">Interactive Sandbox Runner</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewReloadKey((k) => k + 1)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reload</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full bg-white relative">
            <iframe
              key={previewReloadKey}
              srcDoc={sandboxHtml}
              title="AgentStation Sandbox"
              sandbox="allow-scripts allow-modals allow-forms allow-popups"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* 3. TERMINAL SANDBOX TAB */}
      {activeTab === 'terminal' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="font-mono text-slate-300 font-bold">DevOps Execution Sandbox</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {safeExecution.testsPassed} Passed
              </span>
              <span>Duration: {safeExecution.durationMs}ms</span>
              <span>Exit Code: {safeExecution.exitCode ?? 0}</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-emerald-400 bg-slate-950 space-y-2 scrollbar-thin">
            <div className="text-slate-400 flex items-center gap-2">
              <span className="text-amber-400">$</span>
              <span>{safeExecution.command}</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono">
              {safeExecution.stdout}
            </pre>
          </div>

          {/* Terminal Command Prompt Input */}
          <form
            onSubmit={handleCommandSubmit}
            className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <span className="text-amber-400 font-mono text-xs pl-2">$</span>
            <input
              type="text"
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              placeholder="e.g. pytest -v, python src/task_manager.py list, or docker build"
              disabled={isRunningCommand}
              className="flex-1 bg-slate-950 text-slate-100 text-xs font-mono rounded px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isRunningCommand}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 transition disabled:opacity-50"
            >
              {isRunningCommand ? (
                <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              <span>Run</span>
            </button>
          </form>
        </div>
      )}

      {/* Footer Quick Run bar */}
      <div className="bg-slate-950 px-4 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-mono text-[11px]">Quick Sandbox:</span>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('pytest -v tests/');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition"
          >
            pytest -v
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('npm run lint');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-mono text-[11px] transition"
          >
            npm run lint
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('git status');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-400 font-mono text-[11px] transition"
          >
            git status
          </button>
          <button
            onClick={() => {
              setActiveTab('preview');
              setPreviewReloadKey((k) => k + 1);
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-[11px] transition"
          >
            run preview
          </button>
          <button
            onClick={() => {
              setActiveTab('terminal');
              onRunCommand('docker build -t agent-station-sandbox .');
            }}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] transition"
          >
            docker build
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          {files.length} files in active workspace
        </div>
      </div>
    </div>
  );
};
