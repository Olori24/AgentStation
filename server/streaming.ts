import { Request, Response } from 'express';
import { EventEmitter } from 'events';

export interface SseEventMessage {
  type: 'agent_thought' | 'agent_action' | 'terminal_chunk' | 'queue_progress' | 'mission_status' | 'heartbeat';
  channel?: string;
  data: any;
  timestamp: string;
}

class StreamingEngine extends EventEmitter {
  private clients: Map<string, Response> = new Map();

  constructor() {
    super();
    // Heartbeat every 15s to keep connections alive through proxies
    setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        data: { activeClients: this.clients.size },
        timestamp: new Date().toISOString(),
      });
    }, 15000);
  }

  public registerClient(clientId: string, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    this.clients.set(clientId, res);

    // Send initial handshake
    this.sendToClient(res, {
      type: 'agent_thought',
      data: {
        agent: 'Atlas',
        thought: 'Telemetry channel connected. Real-time multi-agent streaming active.',
        clientId,
      },
      timestamp: new Date().toISOString(),
    });

    res.on('close', () => {
      this.clients.delete(clientId);
    });
  }

  public sendToClient(res: Response, event: SseEventMessage) {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch {
      // client disconnected
    }
  }

  public broadcast(event: SseEventMessage, channelFilter?: string) {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const [, res] of this.clients.entries()) {
      try {
        res.write(payload);
      } catch {
        // failed write
      }
    }
    this.emit('broadcast', event);
  }

  public streamAgentThought(missionId: string, agent: string, thought: string, isChunk = false) {
    this.broadcast({
      type: 'agent_thought',
      channel: missionId,
      data: { missionId, agent, thought, isChunk },
      timestamp: new Date().toISOString(),
    });
  }

  public streamTerminalLine(missionId: string, line: string, streamType: 'stdout' | 'stderr' = 'stdout') {
    this.broadcast({
      type: 'terminal_chunk',
      channel: missionId,
      data: { missionId, line, streamType },
      timestamp: new Date().toISOString(),
    });
  }

  public streamJobProgress(jobId: string, progress: number, status: string, message?: string) {
    this.broadcast({
      type: 'queue_progress',
      data: { jobId, progress, status, message },
      timestamp: new Date().toISOString(),
    });
  }

  public getConnectedClientCount(): number {
    return this.clients.size;
  }
}

export const streaming = new StreamingEngine();
