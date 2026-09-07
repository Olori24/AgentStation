import crypto from 'crypto';
import { EventEmitter } from 'events';
import { db, JobRecord } from './db';
import { streaming } from './streaming';

export type JobType = 'mission_synthesis' | 'sandbox_test' | 'video_render' | 'github_sync';

export interface JobOptions {
  maxAttempts?: number;
  priority?: number;
  missionId?: string;
}

export interface EnqueuedJob<T = any> {
  id: string;
  type: JobType;
  missionId?: string;
  payload: T;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  attempt: number;
  maxAttempts: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: any;
  error?: string;
}

type JobWorkerHandler<T = any, R = any> = (job: EnqueuedJob<T>, updateProgress: (pct: number, msg?: string) => void) => Promise<R>;

class BackgroundJobQueue extends EventEmitter {
  private queue: EnqueuedJob[] = [];
  private workers: Map<JobType, JobWorkerHandler> = new Map();
  private isProcessing = false;
  private concurrency = 2;
  private activeCount = 0;

  constructor() {
    super();
    // Process queue tick every second
    setInterval(() => this.tick(), 1000);
  }

  public registerWorker<T, R>(type: JobType, handler: JobWorkerHandler<T, R>) {
    this.workers.set(type, handler);
  }

  public enqueue<T>(type: JobType, payload: T, options?: JobOptions): EnqueuedJob<T> {
    const job: EnqueuedJob<T> = {
      id: `job-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      type,
      missionId: options?.missionId,
      payload,
      status: 'waiting',
      progress: 0,
      attempt: 0,
      maxAttempts: options?.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(job);
    this.syncDb(job);
    streaming.streamJobProgress(job.id, 0, 'waiting', `Job enqueued (${type})`);

    // Trigger tick immediately
    setImmediate(() => this.tick());
    return job;
  }

  public getJob(id: string): EnqueuedJob | undefined {
    return this.queue.find((j) => j.id === id);
  }

  public getAllJobs(limit = 50): EnqueuedJob[] {
    return this.queue.slice(-limit).reverse();
  }

  public getStats() {
    const waiting = this.queue.filter((j) => j.status === 'waiting').length;
    const active = this.queue.filter((j) => j.status === 'active').length;
    const completed = this.queue.filter((j) => j.status === 'completed').length;
    const failed = this.queue.filter((j) => j.status === 'failed').length;
    return {
      total: this.queue.length,
      waiting,
      active,
      completed,
      failed,
      concurrency: this.concurrency,
    };
  }

  private async tick() {
    if (this.activeCount >= this.concurrency) return;

    const nextJob = this.queue.find((j) => j.status === 'waiting');
    if (!nextJob) return;

    const worker = this.workers.get(nextJob.type);
    if (!worker) {
      nextJob.status = 'failed';
      nextJob.error = `No worker registered for job type: ${nextJob.type}`;
      this.syncDb(nextJob);
      return;
    }

    this.activeCount++;
    nextJob.status = 'active';
    nextJob.attempt++;
    nextJob.startedAt = new Date().toISOString();
    this.syncDb(nextJob);
    streaming.streamJobProgress(nextJob.id, 5, 'active', `Job processing started (attempt ${nextJob.attempt})`);

    const updateProgress = (pct: number, msg?: string) => {
      nextJob.progress = Math.min(100, Math.max(0, pct));
      this.syncDb(nextJob);
      streaming.streamJobProgress(nextJob.id, nextJob.progress, 'active', msg);
    };

    try {
      const result = await worker(nextJob, updateProgress);
      nextJob.status = 'completed';
      nextJob.progress = 100;
      nextJob.result = result;
      nextJob.finishedAt = new Date().toISOString();
      this.syncDb(nextJob);
      streaming.streamJobProgress(nextJob.id, 100, 'completed', 'Job completed successfully');
      this.emit('completed', nextJob);
    } catch (err: any) {
      if (nextJob.attempt < nextJob.maxAttempts) {
        nextJob.status = 'waiting';
        nextJob.error = `Attempt ${nextJob.attempt} failed: ${err.message}. Retrying...`;
        streaming.streamJobProgress(nextJob.id, nextJob.progress, 'waiting', nextJob.error);
      } else {
        nextJob.status = 'failed';
        nextJob.error = err.message || 'Unknown error occurred during job execution';
        nextJob.finishedAt = new Date().toISOString();
        streaming.streamJobProgress(nextJob.id, nextJob.progress, 'failed', nextJob.error);
      }
      this.syncDb(nextJob);
      this.emit('failed', nextJob);
    } finally {
      this.activeCount--;
      setImmediate(() => this.tick());
    }
  }

  private syncDb(job: EnqueuedJob) {
    db.upsertJob({
      id: job.id,
      type: job.type,
      missionId: job.missionId,
      status: job.status,
      progress: job.progress,
      attempt: job.attempt,
      maxAttempts: job.maxAttempts,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      finishedAt: job.finishedAt,
    });
  }
}

export const jobQueue = new BackgroundJobQueue();
