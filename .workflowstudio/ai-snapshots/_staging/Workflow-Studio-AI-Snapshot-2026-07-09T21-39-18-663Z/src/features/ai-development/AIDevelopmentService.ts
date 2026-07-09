export type WorkspaceAnalysis = {
  projectName: string;
  rootPath: string;
  projectType: string;
  buildCommand?: string;
  testCommand?: string;
  devCommand?: string;
  packageManager: string;
  documentationPaths: string[];
  currentMilestone?: string;
  health: {
    score: number;
    warnings: string[];
    successes: string[];
  };
};

export type GitStatus = {
  isRepository: boolean;
  branch: string;
  status: "clean" | "dirty" | "not-repository";
  changedFiles: string[];
  summary: string;
};

export type AISnapshotRecord = {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
  rootPath: string;
  includedRoots: string[];
  excludedPatterns: string[];
  sizeBytes?: number;
};

export type AISnapshotResult = {
  ok: boolean;
  message: string;
  snapshot?: AISnapshotRecord;
};

type WorkflowStudioBridge = {
  workspace?: {
    scan?: (rootPath?: string) => Promise<WorkspaceAnalysis>;
    gitStatus?: (rootPath?: string) => Promise<GitStatus>;
    createAISnapshot?: (rootPath?: string) => Promise<AISnapshotResult>;
    listAISnapshots?: (rootPath?: string) => Promise<AISnapshotRecord[]>;
    openAISnapshotFolder?: (rootPath?: string) => Promise<{ ok: boolean; message: string }>;
  };
};

function bridge() {
  return (window as unknown as { workflowStudio?: WorkflowStudioBridge }).workflowStudio;
}

export async function scanWorkspace(rootPath?: string) {
  return bridge()?.workspace?.scan?.(rootPath) ?? null;
}

export async function getGitStatus(rootPath?: string) {
  return bridge()?.workspace?.gitStatus?.(rootPath) ?? null;
}

export async function createAISnapshot(rootPath?: string): Promise<AISnapshotResult> {
  const createSnapshot = bridge()?.workspace?.createAISnapshot;

  if (!createSnapshot) {
    return {
      ok: false,
      message: "AI snapshot backend is not available. Restart Workflow Studio after installing the package.",
    };
  }

  return createSnapshot(rootPath);
}

export async function listAISnapshots(rootPath?: string): Promise<AISnapshotRecord[]> {
  return bridge()?.workspace?.listAISnapshots?.(rootPath) ?? [];
}

export async function openAISnapshotFolder(rootPath?: string) {
  return (
    bridge()?.workspace?.openAISnapshotFolder?.(rootPath) ??
    Promise.resolve({ ok: false, message: "Snapshot folder backend is not available." })
  );
}

export function buildContinuationPrompt(
  analysis: WorkspaceAnalysis | null,
  gitStatus: GitStatus | null,
) {
  const generatedAt = new Date().toLocaleString();
  const projectName = analysis?.projectName ?? "Selected workspace";
  const rootPath = analysis?.rootPath ?? "Unknown";
  const projectType = analysis?.projectType ?? "unknown";
  const buildCommand = analysis?.buildCommand ?? "Not detected";
  const devCommand = analysis?.devCommand ?? "Not detected";
  const testCommand = analysis?.testCommand ?? "Not detected";
  const healthScore = analysis?.health.score ?? 0;
  const warnings = analysis?.health.warnings ?? [];
  const successes = analysis?.health.successes ?? [];

  return `${projectName} — Continue Development

Generated: ${generatedAt}

We are continuing development of ${projectName}.

Current workspace:
- Root: ${rootPath}
- Project type: ${projectType}
- Package manager: ${analysis?.packageManager ?? "unknown"}
- Build command: ${buildCommand}
- Dev command: ${devCommand}
- Test command: ${testCommand}
- Health score: ${healthScore}%

Git status:
- Repository: ${gitStatus?.isRepository ? "Yes" : "No"}
- Branch: ${gitStatus?.branch ?? "Unknown"}
- Status: ${gitStatus?.summary ?? "Not checked"}

Documentation paths:
${(analysis?.documentationPaths?.length ? analysis.documentationPaths : ["Not detected"])
  .map((item) => `- ${item}`)
  .join("\n")}

Detected strengths:
${(successes.length ? successes : ["No successes detected yet."])
  .map((item) => `- ${item}`)
  .join("\n")}

Warnings:
${(warnings.length ? warnings : ["No warnings detected."])
  .map((item) => `- ${item}`)
  .join("\n")}

Current milestone:
${analysis?.currentMilestone ?? "Not specified"}

Development workflow:
1. Confirm Git status and build status before changes.
2. Prefer small milestone packages.
3. Build before every commit.
4. Never commit broken builds.
5. Update documentation when architecture or workflow changes.

Next request:
Review the current workspace status and recommend the next safest development milestone.`;
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

export function formatBytes(sizeBytes?: number) {
  if (!sizeBytes || sizeBytes < 0) return "Unknown size";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
