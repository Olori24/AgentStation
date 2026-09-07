import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'engineer' | 'reviewer';
  avatar: string;
  organizationId: string;
  createdAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  tier: 'enterprise' | 'pro' | 'starter';
  quotaRemaining: number;
  createdAt: string;
}

export interface DbMissionRecord {
  id: string;
  userId: string;
  organizationId: string;
  title: string;
  prompt: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  targetRepo: string;
  branch: string;
  filesCount: number;
  durationMs: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceFileRecord {
  id: string;
  missionId: string;
  path: string;
  language: string;
  content: string;
  sizeBytes: number;
  updatedAt: string;
}

export interface AgentLogRecord {
  id: string;
  missionId: string;
  agentName: string;
  stepType: string;
  status: 'info' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  payload?: any;
  createdAt: string;
}

export interface JobRecord {
  id: string;
  type: 'mission_synthesis' | 'sandbox_test' | 'video_render' | 'github_sync';
  missionId?: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number; // 0 - 100
  attempt: number;
  maxAttempts: number;
  result?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface DatabaseSchema {
  version: number;
  users: UserRecord[];
  organizations: OrganizationRecord[];
  missions: DbMissionRecord[];
  files: WorkspaceFileRecord[];
  logs: AgentLogRecord[];
  jobs: JobRecord[];
  systemMetrics: {
    totalMissionsSynthesized: number;
    totalSandboxExecutions: number;
    totalGitCommits: number;
    totalVideosRendered: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'agentstation_relational_db.json');

const DEFAULT_ORG: OrganizationRecord = {
  id: 'org-station-01',
  name: 'AgentStation Core Engineering',
  slug: 'agentstation-core',
  tier: 'enterprise',
  quotaRemaining: 98500,
  createdAt: new Date().toISOString(),
};

const DEFAULT_USERS: UserRecord[] = [
  {
    id: 'user-bolaji-01',
    email: 'bakande11@gmail.com',
    name: 'Bolaji Akande',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    organizationId: DEFAULT_ORG.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-cypher-dev',
    email: 'cypher.dev@agentstation.io',
    name: 'Cypher (Senior Engineer)',
    role: 'engineer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    organizationId: DEFAULT_ORG.id,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-sentinel-qa',
    email: 'sentinel.qa@agentstation.io',
    name: 'Sentinel (Lead QA Reviewer)',
    role: 'reviewer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    organizationId: DEFAULT_ORG.id,
    createdAt: new Date().toISOString(),
  },
];

class RelationalDatabase {
  private data: DatabaseSchema = {
    version: 1,
    users: DEFAULT_USERS,
    organizations: [DEFAULT_ORG],
    missions: [],
    files: [],
    logs: [],
    jobs: [],
    systemMetrics: {
      totalMissionsSynthesized: 0,
      totalSandboxExecutions: 0,
      totalGitCommits: 0,
      totalVideosRendered: 0,
    },
  };
  private isLoaded = false;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          users: parsed.users?.length ? parsed.users : DEFAULT_USERS,
          organizations: parsed.organizations?.length ? parsed.organizations : [DEFAULT_ORG],
        };
      } else {
        this.saveImmediately();
      }
      this.isLoaded = true;
    } catch (err: any) {
      console.warn('[DB] Failed to load database file, using in-memory defaults:', err.message);
      this.isLoaded = true;
    }
  }

  public saveImmediately() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err: any) {
      console.error('[DB] Write failed:', err.message);
    }
  }

  public scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      this.saveImmediately();
    }, 500);
  }

  // --- Users & Orgs ---
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getOrganizations(): OrganizationRecord[] {
    return this.data.organizations;
  }

  // --- Missions ---
  public getMissions(limit = 100): DbMissionRecord[] {
    return this.data.missions.slice(0, limit);
  }

  public getMissionById(id: string): DbMissionRecord | undefined {
    return this.data.missions.find((m) => m.id === id);
  }

  public upsertMission(mission: DbMissionRecord): DbMissionRecord {
    const idx = this.data.missions.findIndex((m) => m.id === mission.id);
    if (idx >= 0) {
      this.data.missions[idx] = { ...this.data.missions[idx], ...mission, updatedAt: new Date().toISOString() };
    } else {
      this.data.missions.unshift(mission);
      this.data.systemMetrics.totalMissionsSynthesized++;
    }
    this.scheduleSave();
    return mission;
  }

  public deleteMission(id: string): boolean {
    const prevLen = this.data.missions.length;
    this.data.missions = this.data.missions.filter((m) => m.id !== id);
    this.data.files = this.data.files.filter((f) => f.missionId !== id);
    this.data.logs = this.data.logs.filter((l) => l.missionId !== id);
    this.scheduleSave();
    return this.data.missions.length < prevLen;
  }

  // --- Workspace Files ---
  public getFilesByMission(missionId: string): WorkspaceFileRecord[] {
    return this.data.files.filter((f) => f.missionId === missionId);
  }

  public saveFilesForMission(missionId: string, files: Array<{ path: string; language: string; content: string }>) {
    this.data.files = this.data.files.filter((f) => f.missionId !== missionId);
    for (const file of files) {
      this.data.files.push({
        id: `file-${crypto.randomBytes(4).toString('hex')}`,
        missionId,
        path: file.path,
        language: file.language,
        content: file.content,
        sizeBytes: Buffer.byteLength(file.content, 'utf8'),
        updatedAt: new Date().toISOString(),
      });
    }
    this.scheduleSave();
  }

  // --- Agent Logs ---
  public getLogsByMission(missionId: string): AgentLogRecord[] {
    return this.data.logs.filter((l) => l.missionId === missionId);
  }

  public addLog(log: Omit<AgentLogRecord, 'id' | 'createdAt'>): AgentLogRecord {
    const record: AgentLogRecord = {
      ...log,
      id: `log-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt: new Date().toISOString(),
    };
    this.data.logs.push(record);
    if (this.data.logs.length > 1000) {
      this.data.logs.splice(0, this.data.logs.length - 1000);
    }
    this.scheduleSave();
    return record;
  }

  // --- Jobs ---
  public getJobs(limit = 50): JobRecord[] {
    return this.data.jobs.slice(0, limit);
  }

  public getJobById(id: string): JobRecord | undefined {
    return this.data.jobs.find((j) => j.id === id);
  }

  public upsertJob(job: JobRecord): JobRecord {
    const idx = this.data.jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      this.data.jobs[idx] = job;
    } else {
      this.data.jobs.unshift(job);
    }
    if (this.data.jobs.length > 200) {
      this.data.jobs.pop();
    }
    this.scheduleSave();
    return job;
  }

  public incrementMetric(key: keyof DatabaseSchema['systemMetrics']) {
    if (this.data.systemMetrics[key] !== undefined) {
      this.data.systemMetrics[key]++;
      this.scheduleSave();
    }
  }

  public getMetrics() {
    return {
      ...this.data.systemMetrics,
      totalUsers: this.data.users.length,
      totalMissions: this.data.missions.length,
      totalFiles: this.data.files.length,
      totalLogs: this.data.logs.length,
      totalJobs: this.data.jobs.length,
    };
  }

  public getSnapshot(): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.data));
  }
}

export const db = new RelationalDatabase();
