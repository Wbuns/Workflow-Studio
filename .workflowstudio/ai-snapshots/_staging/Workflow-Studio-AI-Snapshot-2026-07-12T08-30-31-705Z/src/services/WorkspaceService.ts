import type {
  ActiveWorkspace,
  AiContinuationPrompt,
  WorkspaceAiContext,
  WorkspaceHealthItem,
  WorkspaceMilestone,
  WorkspaceProjectMetadata,
} from "../types/workspace";

const fallbackMetadata: WorkspaceProjectMetadata = {
  schemaVersion: "1.0",
  name: "Orivex",
  description:
    "Creative software project managed by Workflow Studio. Workspace metadata could not be loaded, so fallback metadata is being shown.",
  version: "unknown",
  currentMilestone: "v1.1-real-workspace-integration",
  projectType: "electron-react-typescript",
  rootPath: "C:\\Users\\mitch\\Desktop\\Orivex",
  gitEnabled: true,
  devCommand: "npm run dev",
  buildCommand: "npm run build",
  testCommand: "",
  packageFolder: "_packages",
  backupFolder: "_backup",
  documentationPaths: ["docs"],
  tagline: "Real workspace integration active.",
};

const fallbackWorkspace: ActiveWorkspace = {
  id: "orivex",
  name: "Orivex",
  rootPath: fallbackMetadata.rootPath ?? "C:\\Users\\mitch\\Desktop\\Orivex",
  metadataPath: "C:\\Users\\mitch\\Desktop\\Orivex\\.workflowstudio\\project.json",
  metadata: fallbackMetadata,
  aiContext: {
    activeGoal: "Continue Orivex render stack development after Workflow Studio v1.1.",
    currentFocus: "Real workspace metadata integration.",
    importantRules: [
      "Build before commit",
      "Never commit broken builds",
      "Prefer complete replacement files",
      "Services over page logic",
      "Package-based workflow",
    ],
  },
  milestones: [],
  loadedAt: new Date().toISOString(),
};

function getBridge() {
  return window.workflowStudio?.workspace;
}

export async function getActiveWorkspace(): Promise<ActiveWorkspace> {
  try {
    const workspace = await getBridge()?.getActiveWorkspace();
    return workspace ?? fallbackWorkspace;
  } catch (error) {
    console.warn("Unable to load active workspace.", error);
    return fallbackWorkspace;
  }
}

export async function getWorkspaceMetadata(): Promise<WorkspaceProjectMetadata> {
  const workspace = await getActiveWorkspace();
  return workspace.metadata;
}

export function getWorkspaceHealthItems(workspace: ActiveWorkspace): WorkspaceHealthItem[] {
  const metadata = workspace.metadata;

  return [
    {
      label: "Metadata",
      value: "Loaded",
      detail: workspace.metadataPath,
    },
    {
      label: "Active Workspace",
      value: metadata.name,
      detail: workspace.rootPath,
    },
    {
      label: "Git",
      value: metadata.gitEnabled ? "Enabled" : "Disabled",
      detail: metadata.gitEnabled
        ? "Milestone commits are expected after passing builds."
        : "Git metadata is not enabled for this workspace.",
    },
    {
      label: "AI Context",
      value: workspace.aiContext ? "Available" : "Basic",
      detail: workspace.aiContext?.currentFocus ?? "Using project metadata only.",
    },
  ];
}

function formatList(items: string[] | undefined, fallback: string): string {
  if (!items?.length) {
    return `- ${fallback}`;
  }

  return items.map((item) => `- ${item}`).join("\n");
}

function formatMilestones(milestones: WorkspaceMilestone[]): string {
  if (!milestones.length) {
    return "- No milestone history file was loaded.";
  }

  return milestones
    .slice(-5)
    .map((milestone) => {
      const name = milestone.name ?? milestone.id ?? "Unnamed milestone";
      const status = milestone.status ? ` — ${milestone.status}` : "";
      return `- ${name}${status}`;
    })
    .join("\n");
}

export function buildContinuationPrompt(
  workspace: ActiveWorkspace,
  aiContext?: WorkspaceAiContext,
): AiContinuationPrompt {
  const metadata = workspace.metadata;
  const context = aiContext ?? workspace.aiContext;

  const prompt = `Workflow Studio Continuation Prompt\n\nActive workspace:\n- Name: ${metadata.name}\n- Path: ${workspace.rootPath}\n- Version: ${metadata.version}\n- Current milestone: ${metadata.currentMilestone}\n- Project type: ${metadata.projectType}\n- Build command: ${metadata.buildCommand ?? "npm run build"}\n- Test command: ${metadata.testCommand || "Not configured"}\n- Package folder: ${metadata.packageFolder}\n- Backup folder: ${metadata.backupFolder}\n\nDescription:\n${metadata.description ?? "No description provided."}\n\nCurrent AI focus:\n${context?.currentFocus ?? context?.activeGoal ?? "Continue the active milestone using workspace metadata."}\n\nImportant development rules:\n${formatList(context?.importantRules, "Build before commit and never commit broken builds.")}\n\nRecent or known milestones:\n${formatMilestones(workspace.milestones)}\n\nToday's goal:\nContinue from ${metadata.currentMilestone}. Use Workflow Studio metadata as the source of truth, keep changes small, prefer complete replacement files, run the build before committing, and update documentation when the implementation changes.\n\nAfter this milestone is complete, transition back to Orivex Render Stack development.`;

  return {
    title: `${metadata.name} — ${metadata.currentMilestone}`,
    prompt,
    generatedAt: new Date().toISOString(),
    workspaceName: metadata.name,
    milestone: metadata.currentMilestone,
  };
}

export async function generateContinuationPrompt(): Promise<AiContinuationPrompt> {
  try {
    const prompt = await getBridge()?.generateContinuationPrompt();
    if (prompt) {
      return prompt;
    }
  } catch (error) {
    console.warn("Unable to generate continuation prompt through Electron bridge.", error);
  }

  return buildContinuationPrompt(fallbackWorkspace, fallbackWorkspace.aiContext);
}
