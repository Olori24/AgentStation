import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import crypto from 'crypto';
import { streaming } from './streaming';
import { db } from './db';

export interface SandboxExecutionOptions {
  timeoutMs?: number;
  missionId?: string;
  env?: Record<string, string>;
  cwd?: string;
  files?: Array<{ path: string; content: string }>;
  onChunk?: (text: string, stream: 'stdout' | 'stderr') => void;
}

export interface SandboxExecutionResult {
  sandboxId: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  isolatedPath: string;
}

const BASE_SANDBOX_DIR = path.join(process.cwd(), 'data', 'sandboxes');

export async function executeSandboxedCommand(
  command: string,
  options: SandboxExecutionOptions = {}
): Promise<SandboxExecutionResult> {
  const sandboxId = `sbx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const sandboxPath = path.join(BASE_SANDBOX_DIR, sandboxId);
  const timeoutMs = options.timeoutMs || 30000; // 30s cap
  const startTime = Date.now();

  try {
    await fs.promises.mkdir(sandboxPath, { recursive: true });

    // Mount workspace files if provided
    if (options.files && options.files.length > 0) {
      for (const file of options.files) {
        const fullFilePath = path.join(sandboxPath, file.path);
        await fs.promises.mkdir(path.dirname(fullFilePath), { recursive: true });
        await fs.promises.writeFile(fullFilePath, file.content, 'utf8');
      }
    } else {
      // Default workspace symlink or copy
      const defaultWorkspace = path.join(process.cwd(), 'workspace');
      if (fs.existsSync(defaultWorkspace)) {
        // Copy files
        try {
          await fs.promises.cp(defaultWorkspace, sandboxPath, { recursive: true });
        } catch {}
      }
    }

    // Ensure tests directory is available in sandbox for unit testing suites
    const projectTests = path.join(process.cwd(), 'tests');
    const sandboxTests = path.join(sandboxPath, 'tests');
    if (fs.existsSync(projectTests) && !fs.existsSync(sandboxTests)) {
      try {
        await fs.promises.cp(projectTests, sandboxTests, { recursive: true });
      } catch {}
    }

    // Scrubbed environment variables (strip sensitive platform keys)
    const scrubbedEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PATH: process.env.PATH,
      NODE_ENV: 'test',
      CI: 'true',
      PYTHONUNBUFFERED: '1',
      // Block host tokens from sandbox process
      GEMINI_API_KEY: 'PROTECTED_SANDBOX_STUB',
      GITHUB_TOKEN: 'PROTECTED_SANDBOX_STUB',
      ENCRYPTION_KEY: 'PROTECTED_SANDBOX_STUB',
      ...(options.env || {}),
    };

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      // Notify streaming
      if (options.missionId) {
        streaming.streamTerminalLine(options.missionId, `$ [SANDBOX ISOLATED] ${command}\n`, 'stdout');
      }

      const child = spawn('bash', ['-c', command], {
        cwd: sandboxPath,
        env: scrubbedEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
        const timeoutMsg = `\n[SANDBOX TIMEOUT] Command exceeded ${timeoutMs / 1000}s execution limit. Killed.`;
        stderr += timeoutMsg;
        options.onChunk?.(timeoutMsg, 'stderr');
        if (options.missionId) {
          streaming.streamTerminalLine(options.missionId, timeoutMsg, 'stderr');
        }
      }, timeoutMs);

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        options.onChunk?.(text, 'stdout');
        if (options.missionId) {
          streaming.streamTerminalLine(options.missionId, text, 'stdout');
        }
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        options.onChunk?.(text, 'stderr');
        if (options.missionId) {
          streaming.streamTerminalLine(options.missionId, text, 'stderr');
        }
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        db.incrementMetric('totalSandboxExecutions');

        // Cleanup temporary sandbox dir after 5 minutes asynchronously
        setTimeout(() => {
          fs.promises.rm(sandboxPath, { recursive: true, force: true }).catch(() => {});
        }, 300000);

        resolve({
          sandboxId,
          command,
          exitCode: code ?? (timedOut ? 124 : 1),
          stdout,
          stderr,
          durationMs,
          timedOut,
          isolatedPath: sandboxPath,
        });
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          sandboxId,
          command,
          exitCode: 1,
          stdout,
          stderr: `Process error: ${err.message}`,
          durationMs: Date.now() - startTime,
          timedOut: false,
          isolatedPath: sandboxPath,
        });
      });
    });
  } catch (err: any) {
    return {
      sandboxId,
      command,
      exitCode: 1,
      stdout: '',
      stderr: `Sandbox initialization failure: ${err.message}`,
      durationMs: Date.now() - startTime,
      timedOut: false,
      isolatedPath: sandboxPath,
    };
  }
}
