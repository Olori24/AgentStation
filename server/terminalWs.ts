import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { executeSandboxedCommand, SandboxExecutionResult } from './sandbox';
import { streaming } from './streaming';
import { db } from './db';

export interface TerminalWsMessage {
  type:
    | 'connection_established'
    | 'terminal_start'
    | 'terminal_chunk'
    | 'terminal_exit'
    | 'terminal_error'
    | 'pong';
  command?: string;
  text?: string;
  stream?: 'stdout' | 'stderr';
  exitCode?: number;
  durationMs?: number;
  testsPassed?: number;
  testsFailed?: number;
  missionId?: string;
  timestamp?: string;
  activeClients?: number;
}

class TerminalWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private clientMissionMap: Map<WebSocket, string> = new Map();

  public init(httpServer: http.Server) {
    if (this.wss) return;

    this.wss = new WebSocketServer({ noServer: true });

    httpServer.on('upgrade', (request, socket, head) => {
      try {
        const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
        if (url.pathname === '/ws/terminal' || url.pathname === '/ws') {
          this.wss?.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit('connection', ws, request);
          });
        }
      } catch (err) {
        // Socket upgrade error
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      this.clients.add(ws);

      // Send initial handshake confirmation
      const welcome: TerminalWsMessage = {
        type: 'connection_established',
        text: 'Connected to AgentStation Real-Time Terminal WebSocket Streamer.',
        activeClients: this.clients.size,
        timestamp: new Date().toISOString(),
      };
      this.sendSafe(ws, welcome);

      ws.on('message', async (data) => {
        try {
          const rawStr = data.toString();
          const parsed = JSON.parse(rawStr);

          if (parsed.type === 'ping') {
            this.sendSafe(ws, { type: 'pong', timestamp: new Date().toISOString() });
          } else if (parsed.type === 'subscribe') {
            if (parsed.missionId) {
              this.clientMissionMap.set(ws, parsed.missionId);
            }
          } else if (parsed.type === 'execute') {
            // Execute command requested directly via WebSocket
            const { command, missionId, files, timeoutMs } = parsed;
            if (command) {
              await this.runAndStreamCommand(command, { missionId, files, timeoutMs });
            }
          }
        } catch (err: any) {
          this.sendSafe(ws, {
            type: 'terminal_error',
            text: `WebSocket message parse error: ${err.message}`,
            timestamp: new Date().toISOString(),
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        this.clientMissionMap.delete(ws);
      });

      ws.on('error', () => {
        this.clients.delete(ws);
        this.clientMissionMap.delete(ws);
      });
    });

    // Heartbeat to keep connections through reverse proxies alive
    setInterval(() => {
      this.broadcast({
        type: 'pong',
        timestamp: new Date().toISOString(),
        activeClients: this.clients.size,
      });
    }, 20000);
  }

  private sendSafe(ws: WebSocket, msg: TerminalWsMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(msg));
      } catch {
        // connection closed
      }
    }
  }

  public broadcast(msg: TerminalWsMessage, channelMissionId?: string) {
    const payload = JSON.stringify(msg);
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        // If channel specified and client has a specific mission subscription
        if (channelMissionId) {
          const subscribed = this.clientMissionMap.get(ws);
          if (subscribed && subscribed !== channelMissionId) {
            continue;
          }
        }
        try {
          ws.send(payload);
        } catch {
          // ignore closed socket
        }
      }
    }
  }

  public broadcastTerminalStart(command: string, missionId?: string) {
    const msg: TerminalWsMessage = {
      type: 'terminal_start',
      command,
      missionId,
      timestamp: new Date().toISOString(),
    };
    this.broadcast(msg, missionId);
    if (missionId) {
      streaming.streamTerminalLine(missionId, `$ [SANDBOX ISOLATED] ${command}\n`, 'stdout');
    }
  }

  public broadcastTerminalChunk(
    chunk: string,
    stream: 'stdout' | 'stderr' = 'stdout',
    missionId?: string
  ) {
    const msg: TerminalWsMessage = {
      type: 'terminal_chunk',
      text: chunk,
      stream,
      missionId,
      timestamp: new Date().toISOString(),
    };
    this.broadcast(msg, missionId);
    if (missionId) {
      streaming.streamTerminalLine(missionId, chunk, stream);
    }
  }

  public broadcastTerminalExit(
    exitCode: number,
    durationMs: number,
    command: string,
    missionId?: string,
    testsPassed = 0,
    testsFailed = 0
  ) {
    const msg: TerminalWsMessage = {
      type: 'terminal_exit',
      exitCode,
      durationMs,
      command,
      missionId,
      testsPassed,
      testsFailed,
      timestamp: new Date().toISOString(),
    };
    this.broadcast(msg, missionId);
  }

  /**
   * Run command in isolated sandbox and stream output live via WebSocket
   */
  public async runAndStreamCommand(
    command: string,
    options: {
      missionId?: string;
      files?: Array<{ path: string; name?: string; content: string }>;
      timeoutMs?: number;
    } = {}
  ): Promise<SandboxExecutionResult & { testsPassed: number; testsFailed: number }> {
    const cleanCmd = (command || '').trim();
    this.broadcastTerminalStart(cleanCmd, options.missionId);

    // Initial status chunk
    this.broadcastTerminalChunk(
      `[DevOps Sandbox]: Initializing isolated environment...\n[DevOps Sandbox]: Spawning '$ ${cleanCmd}'\n`,
      'stdout',
      options.missionId
    );

    const result = await executeSandboxedCommand(cleanCmd, {
      missionId: options.missionId,
      files: options.files?.map((f) => ({
        path: f.path || f.name || 'file.txt',
        content: f.content,
      })),
      timeoutMs: options.timeoutMs || 30000,
      onChunk: (text, stream) => {
        this.broadcastTerminalChunk(text, stream, options.missionId);
      },
    });

    // Parse test results from stdout/stderr for display
    let testsPassed = 0;
    let testsFailed = 0;

    const fullOutput = result.stdout + '\n' + result.stderr;
    const passedMatch = fullOutput.match(/(\d+)\s+passed/i);
    const failedMatch = fullOutput.match(/(\d+)\s+failed/i);

    if (passedMatch) {
      testsPassed = parseInt(passedMatch[1], 10);
    } else if (result.exitCode === 0) {
      testsPassed = 1;
    }

    if (failedMatch) {
      testsFailed = parseInt(failedMatch[1], 10);
    } else if (result.exitCode !== 0) {
      testsFailed = 1;
    }

    // Stream exit summary chunk
    const exitSummary = `\n[DevOps Sandbox]: Process finished with exit code ${result.exitCode} (${result.durationMs}ms)\n`;
    this.broadcastTerminalChunk(
      exitSummary,
      result.exitCode === 0 ? 'stdout' : 'stderr',
      options.missionId
    );

    this.broadcastTerminalExit(
      result.exitCode,
      result.durationMs,
      cleanCmd,
      options.missionId,
      testsPassed,
      testsFailed
    );

    db.incrementMetric('totalSandboxExecutions');

    return {
      ...result,
      testsPassed,
      testsFailed,
    };
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const terminalWs = new TerminalWebSocketService();
