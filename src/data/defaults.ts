import { AgentProfile, SquadMission, GitHubRepoMeta } from '../types';

export const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'architect',
    name: 'Atlas',
    roleTitle: 'Lead Software Architect',
    badge: 'Spec & System Design',
    specialty: 'Microservices, Data Schemas, Clean Architecture',
    model: 'Gemini 2.5 Flash / Qwen-2.5-Coder',
    status: 'completed',
    color: '#3b82f6', // blue
  },
  {
    id: 'developer',
    name: 'Cypher',
    roleTitle: 'Senior Full-Stack Engineer',
    badge: 'Code Generation',
    specialty: 'Python, TypeScript, FastAPI, Docker, Async I/O',
    model: 'Gemini 2.5 Flash / Qwen-2.5-Coder:14b',
    status: 'completed',
    color: '#10b981', // emerald
  },
  {
    id: 'qa',
    name: 'Sentinel',
    roleTitle: 'DevOps & QA Auditor',
    badge: 'Execution & Verification',
    specialty: 'Sandbox Runner, PyTest, Vulnerability Auditing',
    model: 'Gemini 2.5 Flash / DeepSeek-R1',
    status: 'completed',
    color: '#f59e0b', // amber
  },
  {
    id: 'creative',
    name: 'Vesper',
    roleTitle: 'Creative Director & Copywriter',
    badge: 'Marketing & Angles',
    specialty: 'Hook Generation, Video Storyboarding, Audience Resonance',
    model: 'Gemini 2.5 Flash / Llama-3.3:70b',
    status: 'completed',
    color: '#ec4899', // pink
  },
  {
    id: 'video_producer',
    name: 'Nova',
    roleTitle: 'Motion & Video Producer',
    badge: 'Video Compilation',
    specialty: 'Kinetic Canvas Animation, Audio Timing, MP4/WebM Export',
    model: 'AgentStation Video Engine 2.0',
    status: 'completed',
    color: '#8b5cf6', // purple
  },
];

export const GITHUB_REPO_INFO: GitHubRepoMeta = {
  owner: 'Olori24',
  repo: 'AgentStation-Factory',
  cloneUrl: 'https://github.com/Olori24/AgentStation-Factory.git',
  webUrl: 'https://github.com/Olori24/AgentStation-Factory',
  defaultBranch: 'main',
  recommendedWorkflow: `name: AgentStation CI/CD Sandbox

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Dependencies
        run: |
          python -m pip install --upgrade pip
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest flake8

      - name: Run QA Test Suite
        run: |
          pytest -v --maxfail=1 --disable-warnings

      - name: Verify Docker Container Build
        run: |
          docker build -t agent-station-sandbox:latest .
`,
  dockerCompose: `version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: agent_ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama

  agent_station:
    build: .
    container_name: agent_station_app
    ports:
      - "3000:3000"
    environment:
      - OLLAMA_HOST=http://ollama:11434
      - NODE_ENV=production
    depends_on:
      - ollama
    volumes:
      - ./workspace:/app/workspace

volumes:
  ollama_models:
`,
  dockerfile: `FROM python:3.11-slim

# Install system utilities & media processing engine
RUN apt-get update && apt-get install -y ffmpeg curl git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency manifests
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source files
COPY . .

EXPOSE 3000

CMD ["python", "app.py"]
`,
};

export const INITIAL_MISSION: SquadMission = {
  id: 'mission-001',
  prompt: 'Build an autonomous CLI Task Manager with JSON persistence and a high-impact launch promo video',
  createdAt: 'Just now',
  status: 'completed',
  currentStage: 'Mission Completed & Verified',
  progressPercent: 100,
  gitBranch: 'main',
  gitCommitMessage: 'feat(agents): implement task manager suite, test harness, and launch video assets',
  files: [
    {
      name: 'index.html',
      path: 'public/index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AgentStation Task Engine Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-4 sm:p-6 font-sans antialiased min-h-screen">
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <h1 class="text-lg font-bold text-white font-mono">AgentStation // TaskEngine v2.4</h1>
        </div>
        <p class="text-xs text-slate-400 mt-0.5">Interactive Sandbox Execution • Autonomous 5-Agent Architecture</p>
      </div>
      <div class="text-right">
        <span class="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
          ✓ PyTest 100% Passed
        </span>
      </div>
    </div>

    <!-- Add Task Card -->
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Create Autonomous Task</h2>
      <div class="flex flex-col sm:flex-row gap-2">
        <input
          id="taskTitle"
          type="text"
          placeholder="e.g. Deploy container cluster or run security scan..."
          class="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
        />
        <select
          id="taskPriority"
          class="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-slate-300 font-mono focus:outline-none"
        >
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium" selected>Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onclick="handleAddTask()"
          class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white transition flex items-center justify-center gap-1 shrink-0 font-mono"
        >
          + Add Task
        </button>
      </div>
    </div>

    <!-- Active Tasks List -->
    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Tasks Store (JSON State)</h2>
        <span id="taskCount" class="text-xs text-slate-500 font-mono">0 tasks</span>
      </div>
      <div id="tasksList" class="space-y-2">
        <!-- Dynamically populated -->
      </div>
    </div>

    <!-- CLI Dispatch Hint -->
    <div class="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
      <div class="text-amber-400 font-semibold">Equivalent CLI Terminal Command:</div>
      <div class="text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 select-all">
        $ python src/task_manager.py add "Deploy AgentStation to Cloud" high
      </div>
    </div>
  </div>

  <script>
    let defaultTasks = [
      { id: 1, title: 'Initialize multi-agent cluster pipeline', priority: 'urgent', status: 'completed', created_at: new Date().toISOString() },
      { id: 2, title: 'Verify automated PyTest test harness', priority: 'high', status: 'completed', created_at: new Date().toISOString() },
      { id: 3, title: 'Compile 16s promotional video with Nova motion producer', priority: 'medium', status: 'pending', created_at: new Date().toISOString() },
      { id: 4, title: 'Push production artifacts to github.com/Olori24/AgentStation', priority: 'urgent', status: 'pending', created_at: new Date().toISOString() }
    ];

    let tasks = JSON.parse(localStorage.getItem('agentstation_tasks') || JSON.stringify(defaultTasks));

    function saveTasks() {
      localStorage.setItem('agentstation_tasks', JSON.stringify(tasks));
      renderTasks();
    }

    function toggleTask(id) {
      tasks = tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t);
      saveTasks();
    }

    function deleteTask(id) {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
    }

    function handleAddTask() {
      const input = document.getElementById('taskTitle');
      const prio = document.getElementById('taskPriority').value;
      const title = input.value.trim();
      if (!title) return;
      const newTask = {
        id: tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
        title,
        priority: prio,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      tasks.push(newTask);
      input.value = '';
      saveTasks();
    }

    function renderTasks() {
      const listEl = document.getElementById('tasksList');
      const countEl = document.getElementById('taskCount');
      countEl.innerText = \`\${tasks.length} total (\${tasks.filter(t => t.status === 'completed').length} completed)\`;

      if (tasks.length === 0) {
        listEl.innerHTML = '<div class="py-8 text-center text-xs text-slate-500 font-mono">No tasks yet. Create one above!</div>';
        return;
      }

      listEl.innerHTML = tasks.map(t => {
        const isDone = t.status === 'completed';
        const prioColors = {
          urgent: 'bg-rose-950 text-rose-300 border-rose-800',
          high: 'bg-amber-950 text-amber-300 border-amber-800',
          medium: 'bg-blue-950 text-blue-300 border-blue-800',
          low: 'bg-slate-800 text-slate-400 border-slate-700'
        };
        const badgeColor = prioColors[t.priority] || prioColors.medium;

        return \`
          <div class="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition">
            <div class="flex items-center gap-3">
              <button onclick="toggleTask(\${t.id})" class="w-5 h-5 rounded flex items-center justify-center border \${isDone ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 hover:border-slate-400 text-transparent'}">
                ✓
              </button>
              <div>
                <span class="text-sm font-medium \${isDone ? 'line-through text-slate-500' : 'text-slate-200'}">\${t.title}</span>
                <div class="text-[11px] text-slate-500 font-mono mt-0.5">ID #\${t.id} • \${new Date(t.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono border uppercase font-bold \${badgeColor}">\${t.priority}</span>
              <button onclick="deleteTask(\${t.id})" class="text-slate-500 hover:text-rose-400 text-xs px-2 py-1 transition font-mono">✕</button>
            </div>
          </div>
        \`;
      }).join('');
    }

    renderTasks();
  </script>
</body>
</html>`,
    },
    {
      name: 'task_manager.py',
      path: 'src/task_manager.py',
      language: 'python',
      content: `#!/usr/bin/env python3
"""
AgentStation Autonomous Task Engine
Built collaboratively by Lead Engineer (Cypher) and QA Auditor (Sentinel).
"""
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

STORAGE_FILE = Path("tasks_store.json")

class TaskEngine:
    def __init__(self, filepath: Path = STORAGE_FILE):
        self.filepath = filepath
        self._ensure_storage()

    def _ensure_storage(self) -> None:
        if not self.filepath.exists():
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump([], f)

    def load_tasks(self) -> List[Dict]:
        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def save_tasks(self, tasks: List[Dict]) -> None:
        with open(self.filepath, "w", encoding="utf-8") as f:
            json.dump(tasks, f, indent=2)

    def add_task(self, title: str, priority: str = "medium") -> Dict:
        tasks = self.load_tasks()
        new_task = {
            "id": len(tasks) + 1,
            "title": title,
            "priority": priority.lower(),
            "status": "pending",
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        tasks.append(new_task)
        self.save_tasks(tasks)
        return new_task

    def list_tasks(self, filter_status: Optional[str] = None) -> List[Dict]:
        tasks = self.load_tasks()
        if filter_status:
            return [t for t in tasks if t.get("status") == filter_status]
        return tasks

    def complete_task(self, task_id: int) -> bool:
        tasks = self.load_tasks()
        for t in tasks:
            if t.get("id") == task_id:
                t["status"] = "completed"
                t["completed_at"] = datetime.utcnow().isoformat() + "Z"
                self.save_tasks(tasks)
                return True
        return False

def main():
    engine = TaskEngine()
    if len(sys.argv) < 2:
        print("AgentStation Task Engine v2.4")
        print("Commands: add <title> [priority] | list | done <id>")
        return

    cmd = sys.argv[1].lower()
    if cmd == "add" and len(sys.argv) >= 3:
        prio = sys.argv[3] if len(sys.argv) > 3 else "medium"
        t = engine.add_task(sys.argv[2], prio)
        print(f"✓ Added task #{t['id']}: '{t['title']}' [{t['priority'].upper()}]")
    elif cmd == "list":
        tasks = engine.list_tasks()
        print(f"Total tasks: {len(tasks)}")
        for t in tasks:
            st = "✓" if t["status"] == "completed" else "○"
            print(f"[{st}] #{t['id']} - {t['title']} ({t['priority']})")
    elif cmd == "done" and len(sys.argv) >= 3:
        tid = int(sys.argv[2])
        if engine.complete_task(tid):
            print(f"✓ Task #{tid} marked as done.")
        else:
            print(f"✗ Task #{tid} not found.")

if __name__ == "__main__":
    main()
`,
    },
    {
      name: 'test_task_manager.py',
      path: 'tests/test_task_manager.py',
      language: 'python',
      content: `"""
Sentinel QA Test Suite for TaskEngine
100% automated verification with PyTest
"""
import pytest
from pathlib import Path
from task_manager import TaskEngine

@pytest.fixture
def temp_engine(tmp_path):
    test_file = tmp_path / "test_tasks.json"
    return TaskEngine(test_file)

def test_initial_state(temp_engine):
    assert temp_engine.load_tasks() == []

def test_add_task(temp_engine):
    t1 = temp_engine.add_task("Deploy AgentStation to Cloud", "high")
    assert t1["id"] == 1
    assert t1["title"] == "Deploy AgentStation to Cloud"
    assert t1["status"] == "pending"
    assert len(temp_engine.load_tasks()) == 1

def test_complete_task(temp_engine):
    temp_engine.add_task("Review pull request #42", "urgent")
    success = temp_engine.complete_task(1)
    assert success is True
    tasks = temp_engine.list_tasks(filter_status="completed")
    assert len(tasks) == 1
    assert tasks[0]["id"] == 1
`,
    },
    {
      name: 'requirements.txt',
      path: 'requirements.txt',
      language: 'python',
      content: `pytest>=7.4.0
pydantic>=2.5.0
fastapi>=0.109.0
uvicorn>=0.27.0
websockets>=12.0
ollama>=0.2.0
pillow>=10.2.0
`,
    },
    {
      name: 'Dockerfile',
      path: 'Dockerfile',
      language: 'dockerfile',
      content: `FROM python:3.11-slim
WORKDIR /workspace
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "src/task_manager.py", "list"]
`,
    },
    {
      name: 'README.md',
      path: 'README.md',
      language: 'markdown',
      content: `# AgentStation Task Engine

> Autonomous task management CLI and backend engine designed by **AgentStation Squad**.

## Repository
- **Remote:** \`https://github.com/Olori24/AgentStation.git\`
- **Branch:** \`main\`

## Quickstart
\`\`\`bash
# Install dependencies
pip install -r requirements.txt

# Run CLI
python src/task_manager.py add "Launch multi-agent cluster" high
python src/task_manager.py list

# Run Test Suite
pytest tests/
\`\`\`
`,
    },
  ],
  execution: {
    command: 'pytest -v tests/test_task_manager.py',
    stdout: `============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-7.4.4
rootdir: /workspace
collected 3 items

tests/test_task_manager.py::test_initial_state PASSED                    [ 33%]
tests/test_task_manager.py::test_add_task PASSED                         [ 66%]
tests/test_task_manager.py::test_complete_task PASSED                    [100%]

============================== 3 passed in 0.08s ===============================
[DevOps Sandbox]: All assertions verified. Zero memory leaks detected.
[Security Audit]: No dangerous system calls found. Code is clean.`,
    exitCode: 0,
    testsPassed: 3,
    testsFailed: 0,
    durationMs: 84,
  },
  video: {
    title: 'TASK ENGINE 2.0',
    hook: 'STOP MANUAL JUGGLING. LET AUTONOMOUS AGENTS ENGINEER YOUR CODE.',
    subtitle: 'Zero-config CLI with persistent storage, full test coverage, and automated DevOps deployment.',
    totalDurationSec: 16,
    soundtrackMood: 'energetic-tech',
    audioScript: 'Introducing Task Engine 2.0, architected and built in seconds by autonomous AI agents. Features robust JSON storage, instant CLI workflows, and verified automated testing. Push directly to github.com/Olori24/AgentStation now.',
    scenes: [
      {
        id: 'scene-1',
        sceneIndex: 0,
        durationSec: 4,
        badge: 'THE BOTTLENECK',
        heading: 'MANUAL WORKFLOWS ARE SLOWING YOU DOWN',
        subheading: 'Stop writing boilerplate by hand. Autonomous multi-agent squads build, test, and package in seconds.',
        bulletPoints: [
          'Hours wasted on boilerplate and setup',
          'Disjointed planning vs execution',
          'Missing tests and manual QA cycles',
        ],
        accentColor: '#3b82f6',
      },
      {
        id: 'scene-2',
        sceneIndex: 1,
        durationSec: 4,
        badge: 'ENGINEERING AGENTS',
        heading: 'AUTONOMOUS SQUAD ARCHITECTURE',
        subheading: 'Specialized roles: Architect breaks down specs, Developer crafts clean code, QA executes tests.',
        codePreview: 'def add_task(title, priority):\n    tasks.append({"id": n, "status": "active"})\n    save_tasks(tasks)',
        bulletPoints: [
          'Lead Architect: Deep system schemas',
          'Senior Dev: Production-grade logic',
          'QA Sentinel: Automated sandbox verification',
        ],
        accentColor: '#10b981',
      },
      {
        id: 'scene-3',
        sceneIndex: 2,
        durationSec: 4,
        badge: 'VERIFIED & TESTED',
        heading: '100% TEST COVERAGE & DOCKER READY',
        subheading: 'Every file is sandboxed and verified before release with zero breaking changes.',
        bulletPoints: [
          '3 of 3 PyTest assertions passed in 0.08s',
          'Containerized with lightweight Dockerfile',
          'Git-ready commit logs & branch isolation',
        ],
        accentColor: '#f59e0b',
      },
      {
        id: 'scene-4',
        sceneIndex: 3,
        durationSec: 4,
        badge: 'DEPLOY NOW',
        heading: 'SYNC TO GITHUB IN 1-CLICK',
        subheading: 'Code, test suite, and launch video ready at github.com/Olori24/AgentStation',
        bulletPoints: [
          'git remote add origin https://github.com/Olori24/AgentStation.git',
          'Automated GitHub Actions CI/CD pipeline included',
          'Full local Ollama & cloud multi-model support',
        ],
        accentColor: '#8b5cf6',
        callToAction: 'github.com/Olori24/AgentStation',
      },
    ],
  },
  logs: [
    {
      id: 'log-1',
      timestamp: '15:30:10',
      role: 'system',
      agentName: 'AgentStation Core',
      type: 'status',
      message: 'Mission initialized with prompt: "Build an autonomous CLI Task Manager with JSON persistence and a high-impact launch promo video"',
    },
    {
      id: 'log-2',
      timestamp: '15:30:11',
      role: 'architect',
      agentName: 'Atlas (Lead Architect)',
      type: 'thought',
      message: 'Analyzing requirements: JSON persistence, modular CLI arguments, priority tagging, and deterministic data contracts.',
    },
    {
      id: 'log-3',
      timestamp: '15:30:12',
      role: 'architect',
      agentName: 'Atlas (Lead Architect)',
      type: 'code_gen',
      message: 'Defined system structure: task_manager.py (Core Engine), test_task_manager.py (PyTest suite), Dockerfile, and requirements.txt.',
    },
    {
      id: 'log-4',
      timestamp: '15:30:13',
      role: 'developer',
      agentName: 'Cypher (Senior Dev)',
      type: 'thought',
      message: 'Implementing TaskEngine class with safe error handling, ISO timestamps, and CLI dispatch table.',
    },
    {
      id: 'log-5',
      timestamp: '15:30:14',
      role: 'developer',
      agentName: 'Cypher (Senior Dev)',
      type: 'code_gen',
      message: 'Generated task_manager.py (102 lines) & requirements.txt.',
      details: 'Wrote to virtual workspace storage.',
    },
    {
      id: 'log-6',
      timestamp: '15:30:15',
      role: 'qa',
      agentName: 'Sentinel (QA Auditor)',
      type: 'terminal',
      message: 'Running sandbox command: pytest -v tests/test_task_manager.py',
      details: 'All 3 tests passed in 0.08s. Return code: 0.',
    },
    {
      id: 'log-7',
      timestamp: '15:30:16',
      role: 'creative',
      agentName: 'Vesper (Creative Director)',
      type: 'thought',
      message: 'Synthesizing value proposition: Focus on eliminating manual boilerplate and delivering verified automation.',
    },
    {
      id: 'log-8',
      timestamp: '15:30:17',
      role: 'creative',
      agentName: 'Vesper (Creative Director)',
      type: 'video',
      message: 'Authored 4-scene video storyboard with kinetic typography, high-contrast palette, and call to action.',
    },
    {
      id: 'log-9',
      timestamp: '15:30:18',
      role: 'video_producer',
      agentName: 'Nova (Motion Producer)',
      type: 'video',
      message: 'Compiled 16-second promotional video with dynamic canvas rendering and audio narration track.',
    },
    {
      id: 'log-10',
      timestamp: '15:30:19',
      role: 'system',
      agentName: 'AgentStation Core',
      type: 'complete',
      message: 'Squad Mission accomplished. Code artifacts, test execution logs, and marketing video are ready.',
    },
  ],
};

export const PROMPT_PRESETS = [
  {
    id: 'preset-1',
    label: 'CLI Task Engine + Launch Promo',
    badge: 'Popular',
    prompt: 'Build an autonomous CLI Task Manager with JSON persistence, unit tests, and a high-impact launch promo video',
  },
  {
    id: 'preset-2',
    label: 'REST API & Auth + Explainer Reel',
    badge: 'Fullstack',
    prompt: 'Build a production-ready REST API with JWT authentication, SQLite/JSON storage, Dockerfile, test harness, and an explainer marketing video',
  },
  {
    id: 'preset-3',
    label: 'Server Health Monitor & Discord Bot',
    badge: 'DevOps',
    prompt: 'Build a Python server health monitor that checks CPU, RAM, and disk metrics with webhook alerting, unit tests, and a promotional video',
  },
  {
    id: 'preset-4',
    label: 'AES File Vault & Product Showcase',
    badge: 'Security',
    prompt: 'Build a secure cryptographic file encryption utility with password derivation, automated integrity tests, and a showcase promo video',
  },
  {
    id: 'preset-5',
    label: 'Stripe Webhook & Idempotency',
    badge: 'Fintech',
    prompt: 'Build a production Stripe Webhook & Payment Idempotency Microservice with Deduplication Ledger, PyTest assertions, and launch video',
  },
];
