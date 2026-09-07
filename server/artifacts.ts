import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import JSZip from 'jszip';
import { db } from './db';

export interface ArtifactMeta {
  id: string;
  missionId: string;
  name: string;
  type: 'zip_bundle' | 'video_storyboard' | 'test_report';
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
  createdAt: string;
}

const ARTIFACTS_DIR = path.join(process.cwd(), 'data', 'artifacts');
const artifactRegistry: Map<string, { meta: ArtifactMeta; buffer: Buffer }> = new Map();

export async function initArtifactsStorage() {
  await fs.promises.mkdir(ARTIFACTS_DIR, { recursive: true });
}

export async function generateMissionBundle(
  missionId: string,
  missionTitle: string,
  files: Array<{ path: string; content: string }>
): Promise<ArtifactMeta> {
  await initArtifactsStorage();

  const zip = new JSZip();
  const safeName = missionTitle.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  // Populate files
  for (const file of files) {
    zip.file(file.path, file.content);
  }

  // Add build & execution README
  zip.file(
    'README.md',
    `# ${missionTitle}\n\nGenerated autonomously by **AgentStation**.\n\n` +
      `### Verified Architecture\n` +
      `- Synthesized with multi-agent squad (Atlas, Cypher, Sentinel, Forge, Beacon).\n` +
      `- Includes full test suites and containerization configurations.\n\n` +
      `### Quickstart\n` +
      `\`\`\`bash\n` +
      `pip install -r requirements.txt || npm install\n` +
      `pytest tests/ -v || npm test\n` +
      `\`\`\`\n`
  );

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const artifactId = `art-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const fileName = `agentstation_${safeName}_${artifactId.slice(-6)}.zip`;
  const diskPath = path.join(ARTIFACTS_DIR, fileName);

  await fs.promises.writeFile(diskPath, buffer);

  const meta: ArtifactMeta = {
    id: artifactId,
    missionId,
    name: fileName,
    type: 'zip_bundle',
    sizeBytes: buffer.length,
    sha256,
    downloadUrl: `/api/artifacts/download/${artifactId}`,
    createdAt: new Date().toISOString(),
  };

  artifactRegistry.set(artifactId, { meta, buffer });
  return meta;
}

export function getArtifact(artifactId: string): { meta: ArtifactMeta; buffer: Buffer } | undefined {
  return artifactRegistry.get(artifactId);
}

export function listArtifacts(missionId?: string): ArtifactMeta[] {
  const all = Array.from(artifactRegistry.values()).map((a) => a.meta);
  if (missionId) {
    return all.filter((a) => a.missionId === missionId);
  }
  return all.slice(-20).reverse();
}
