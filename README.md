# AgentStation

> **Autonomous Fullstack Multi-Agent Cluster Orchestrator with Real-Time Sandbox Execution, Interactive Code Workspace & Kinetic Video Studio**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8e24aa.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ⚡ Overview

**AgentStation** is an autonomous multi-agent engineering platform that orchestrates specialized AI agents to plan, architect, implement, test, and package production-ready software. It combines cluster orchestration with an interactive multi-file code editor, a sandboxed in-browser execution runner, a kinetic product launch video studio, and an execution history archive.

---

## 🤖 The Multi-Agent Squad

AgentStation employs five specialized agents working in tandem:

| Agent | Role | Focus Area |
|---|---|---|
| **Chief Architect** | System Design & Decomposition | Tech stack selection, API contracts, modular folder architecture, milestone breakdown |
| **Frontend Specialist** | UI/UX & Responsive Views | React 19, Tailwind CSS v4, component hierarchies, accessibility & interaction design |
| **Backend Engineer** | APIs & Data Layer | Express routing, REST endpoints, database schema design, authentication & security |
| **QA Engineer** | Testing & Validation | Edge case verification, unit & integration test suites, PyTest sandbox assertions |
| **DevOps Lead** | Deployment & Infrastructure | Docker containerization, CI/CD GitHub workflows, cloud readiness & Git sync |

---

## 🚀 Key Features

### 1. Autonomous Cluster Orchestration
- **Dual Engine Execution**: Powered by Google Gemini with graceful fallback chains (`gemini-flash-latest` → `gemini-3.1-flash-lite` → `gemini-3.8-flash`) plus local Ollama LLM support (`deepseek-r1`, `llama3`, `codellama`, etc.).
- **Real-Time Activity Stream**: Live visual timeline tracking agent deliberations, code generation, terminal test phases, and milestone completions.
- **Auto-Synthesized Storyboards**: Automatically generates marketing hooks, narrative audio scripts, and multi-scene kinetic storyboards for every codebase.

### 2. Live Interactive Code Workspace
- **Multi-File Explorer & Editor**: Full-featured in-app code editor supporting TypeScript, JavaScript, Python, CSS, HTML, Markdown, and JSON.
- **Dynamic File Management**: Create new workspace files, edit existing artifacts with live dirty state detection, and remove files seamlessly.
- **In-Browser Sandbox Runner**: Execute client code safely in an isolated iframe with captured console output and reload triggers.
- **PyTest Sandbox Terminal**: Visualized test runner displaying command logs, assertion passes/fails, and execution duration.
- **Instant Export**: Download entire generated codebases as `.zip` archives with a single click.

### 3. Kinetic Video Studio
- **HTML5 Canvas 60 FPS Engine**: Generates high-impact promotional and launch videos directly from codebase specs.
- **Aspect Ratio Switching**: Switch between **16:9 Landscape** (YouTube, Desktop) and **9:16 Portrait** (Shorts, TikTok, Reels, Mobile).
- **Built-In Audio Synthesizer**: Web Audio API rhythm and beat track generator with selectable moods (`cyberpunk`, `electronic`, `ambient-clean`, `synthwave`, `downtempo`).
- **Voiceover Narration**: Integrated Web Speech API narration reciting generated product hooks and feature walkthroughs.
- **Interactive Storyboard Customizer**: Reorder, edit headings, add bullets, and adjust scene durations with real-time canvas preview.

### 4. Mission History Archive & State Restoration
- **Slide-Over History Panel**: Searchable archive of all past mission runs with instant keyword and status filtering.
- **Artifact Inspector**: Inspect file manifests, PyTest pass rates, video scene breakdowns, and Git commits before loading.
- **1-Click State Restoration**: Switch workspaces effortlessly, restoring previous code files, logs, and video timelines.
- **JSON Manifest Export**: Download complete mission packages as structured JSON definitions for backup and sharing.
- **Pre-Seeded Blueprints**: Ready-to-explore missions including Autonomous Task Engine, Real-Time Telemetry Pulse, and AES-256 Crypto Vault.

### 5. Git & GitHub Hub
- **Repository Synchronization**: Real-time sync with `Olori24/AgentStation-Factory` and `Olori24/AgentStation`.
- **Commit and Push**: Dedicated **Commit and Push** button that writes all mission workspace files, stages changes, commits with custom or auto-generated messages, merges upstream changes, and pushes directly to GitHub with live audit steps and success notifications.
- **Create New Branch**: In-modal branch creator with branch naming sanitization, quick prefix chips (`feat/`, `fix/`, `chore/`, `release/`), automatic working tree protection (stash/pop), and instantaneous workspace checkout.
- **Remote Branch Switcher**: Live remote branch inspector showing active branch status, latest commit metadata, and one-click branch switching.
- **Commit Inspection**: Displays current branch, latest commit hash, author info, uncommitted file status, and direct GitHub links.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm`, `pnpm`, or `bun`

### Installation

```bash
# Clone the repository
git clone https://github.com/Olori24/AgentStation-Factory.git
cd AgentStation-Factory

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Optional: Google Gemini API key for cloud LLM reasoning
GEMINI_API_KEY="your_gemini_api_key_here"

# Optional: GitHub Personal Access Token (repo scope) for 1-click push
GITHUB_TOKEN="your_github_token_here"

# Server Port (default 3000)
PORT=3000
```

### Running Locally

```bash
# Start development server with hot reload
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Building for Production

```bash
# Compile client assets and bundle server
npm run build

# Start production server
npm run start
```

---

## 📁 Project Structure

```
├── .env.example                 # Environment variables template
├── index.html                   # Application entry HTML
├── package.json                 # Scripts and dependencies
├── server.ts                    # Express backend API & Vite SSR middleware
├── vite.config.ts               # Vite build configuration
├── tsconfig.json                # TypeScript compiler settings
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Main application container & state engine
    ├── types.ts                 # Core TypeScript interfaces & enums
    ├── data/
    │   ├── defaults.ts          # Preset agents, starter mission & GitHub repo info
    │   └── sampleMissions.ts    # Seeded mission archive with executable code & storyboards
    └── components/
        ├── Header.tsx           # Top navigation, cluster status & history button
        ├── SquadBar.tsx         # Agent squad status & active roles
        ├── PromptStation.tsx    # Mission input & template selector
        ├── AgentActivityStream.tsx # Real-time agent log & thought stream
        ├── CodeWorkspace.tsx    # Multi-file code editor, sandbox runner & zip export
        ├── VideoStudio.tsx      # Kinetic canvas 60 FPS renderer & audio sequencer
        ├── MissionHistoryPanel.tsx # Execution history archive & state restore slide-over
        ├── GitHubModal.tsx      # Git push hub & repository status
        └── OllamaModal.tsx      # Local LLM configuration modal
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
