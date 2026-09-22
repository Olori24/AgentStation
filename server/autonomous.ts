import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import { executeSandboxedCommand } from "./sandbox";
import { db } from "./db";
import { streaming } from "./streaming";

export interface AutonomousMissionInput {
  missionId: string;
  prompt: string;
  provider?: "gemini" | "ollama";
  ollamaUrl?: string;
  ollamaModel?: string;
  maxRepairCycles?: number;
}

const MODELS = ["gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

function log(missionId: string, agent: string, message: string, payload?: any) {
  streaming.streamAgentThought(missionId, agent, message);
  db.addLog({ missionId, agentName: agent, stepType: "agent", status: "info", message, payload });
}

function filesOf(value: any) {
  if (!Array.isArray(value)) return [];
  return value.filter(f => f && typeof f.path === "string" && typeof f.content === "string")
    .map(f => ({ name: String(f.name || f.path.split("/").pop() || "file"), path: f.path.replace(/^\/+/, "").replace(/\.\.\//g, ""), language: String(f.language || "text"), content: f.content }));
}

async function gemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const ai = new GoogleGenAI({ apiKey: key });
  let last: any;
  for (const model of MODELS) {
    try {
      const r = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { responseMimeType: "application/json" },
      });
      const raw = (r.text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
      return JSON.parse(raw);
    } catch (e) { last = e; }
  }
  throw last || new Error("All Gemini models failed.");
}

async function ollama(prompt: string, base: string, model: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const r = await fetch(base.replace(/\/$/, "") + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, format: "json", stream: false }),
      signal: controller.signal,
    });
    if (!r.ok) throw new Error("Ollama HTTP " + r.status);
    const d: any = await r.json();
    return JSON.parse(String(d.response || "{}"));
  } finally { clearTimeout(timer); }
}

async function ask(input: AutonomousMissionInput, prompt: string) {
  return input.provider === "ollama"
    ? ollama(prompt, input.ollamaUrl || "http://localhost:11434", input.ollamaModel || "llama3")
    : gemini(prompt);
}

function counts(output: string, exitCode: number) {
  return {
    passed: Number(output.match(/(\d+)\s+passed/i)?.[1] || 0),
    failed: Number(output.match(/(\d+)\s+failed/i)?.[1] || (exitCode === 0 ? 0 : 1)),
  };
}

export async function executeAutonomousMission(input: AutonomousMissionInput) {
  const { missionId, prompt } = input;
  const logs: any[] = [];
  const record = (agent: string, message: string, payload?: any) => {
    logs.push({ id: crypto.randomUUID(), agentName: agent, role: agent.toLowerCase(), type: "agent", message, payload, timestamp: new Date().toISOString() });
    log(missionId, agent, message, payload);
  };

  record("Atlas", "Planning the mission and defining objective verification gates.");
  const blueprint = await ask(input, `You are Atlas, principal architect.
Mission: ${prompt}
Return JSON only with missionTitle, goal, stack, plan, testCommand, acceptanceCriteria, securityConstraints.
testCommand MUST be a safe local command using pytest, npm, node, or python only. Never claim execution occurred.`);

  record("Cypher", "Implementing the approved architecture as complete runnable source.");
  const implementation = await ask(input, `You are Cypher, senior full-stack engineer.
Mission: ${prompt}
Architecture: ${JSON.stringify(blueprint)}
Return JSON only: {"gitCommitMessage":"...","files":[{"name":"...","path":"...","language":"...","content":"complete runnable file"}]}
Include real tests. No pseudocode, fake test output, fake metrics, credentials, or secrets. Paths must be relative.`);

  let files = filesOf(implementation.files);
  if (!files.length) throw new Error("No valid source files were returned by the developer agent.");

  let execution: any = null;
  let passed = false;
  let repairCycles = 0;
  const maxCycles = Math.max(0, Math.min(3, input.maxRepairCycles ?? 2));

  for (let cycle = 0; cycle <= maxCycles; cycle++) {
    const command = String(blueprint.testCommand || "pytest -q tests").trim();
    record("Sentinel", cycle ? `Re-running real tests after repair cycle ${cycle}.` : `Running real verification: ${command}`);
    execution = await executeSandboxedCommand(command, {
      missionId,
      files: files.map(f => ({ path: f.path, content: f.content })),
      timeoutMs: 45000,
    });

    const c = counts(execution.stdout + "\\n" + execution.stderr, execution.exitCode);
    execution.testsPassed = c.passed;
    execution.testsFailed = c.failed;
    passed = execution.exitCode === 0;

    record("Sentinel", passed
      ? `Verification passed with exit code 0; ${c.passed} test(s) reported.`
      : `Verification failed with exit code ${execution.exitCode}; entering repair workflow.`,
      { stdout: execution.stdout.slice(-5000), stderr: execution.stderr.slice(-5000) });

    if (passed || cycle === maxCycles) break;

    repairCycles++;
    record("Reviewer", `Diagnosing the failure and requesting targeted repair ${repairCycles}/${maxCycles}.`);
    const repair = await ask(input, `You are Sentinel, senior QA/reviewer.
Mission: ${prompt}
Architecture: ${JSON.stringify(blueprint)}
Files: ${JSON.stringify(files)}
Command: ${command}
Exit code: ${execution.exitCode}
STDOUT: ${execution.stdout.slice(-7000)}
STDERR: ${execution.stderr.slice(-7000)}
Return JSON only: {"diagnosis":"root cause","files":[{"path":"...","language":"...","content":"complete corrected file"}]}
Only return files that need replacement/addition. Do not claim success unless the execution evidence proves it.`);

    const repairs = filesOf(repair.files);
    if (!repairs.length) throw new Error("Repair agent returned no concrete file changes.");
    const merged = new Map(files.map(f => [f.path, f]));
    repairs.forEach(f => merged.set(f.path, f));
    files = [...merged.values()];
    record("Cypher", `Applied ${repairs.length} targeted repair file(s).`, { diagnosis: repair.diagnosis });
  }

  record("Forge", passed
    ? "Mission verified; preserving source, test evidence and execution metadata."
    : "Mission did not pass the verification gate; preserving the actual failure evidence.");

  return {
    missionTitle: String(blueprint.missionTitle || "Autonomous Mission"),
    gitCommitMessage: String(implementation.gitCommitMessage || "feat: autonomous mission"),
    plan: Array.isArray(blueprint.plan) ? blueprint.plan.map(String) : [],
    files,
    execution,
    logs,
    status: passed ? "completed" : "failed",
    verification: {
      executed: true,
      passed,
      repairCycles,
      testsPassed: execution?.testsPassed || 0,
      testsFailed: execution?.testsFailed || 0,
    },
  };
}
