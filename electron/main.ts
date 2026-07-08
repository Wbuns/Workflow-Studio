import { app, BrowserWindow, Menu, ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const activeWorkspaceRoot = "C:\\Users\\mitch\\Desktop\\Orivex";

type WorkspaceProjectMetadata = {
  schemaVersion?: string;
  name: string;
  description?: string;
  version: string;
  currentMilestone: string;
  projectType: string;
  rootPath?: string;
  gitEnabled: boolean;
  devCommand?: string;
  buildCommand?: string;
  testCommand?: string;
  packageFolder: string;
  backupFolder: string;
  documentationPaths?: string[];
  tagline?: string;
};

type WorkspaceAiContext = {
  schemaVersion?: string;
  purpose?: string;
  activeGoal?: string;
  currentFocus?: string;
  importantRules?: string[];
  nextLikelyMilestone?: string;
  recentlyCompleted?: string[];
  knownIssues?: string[];
};

type WorkspaceMilestone = {
  id?: string;
  name?: string;
  status?: string;
  description?: string;
  startedDate?: string;
  completedDate?: string;
  relatedPackage?: string;
  suggestedCommitMessage?: string;
  notes?: string;
};

type ActiveWorkspace = {
  id: string;
  name: string;
  rootPath: string;
  metadataPath: string;
  metadata: WorkspaceProjectMetadata;
  aiContext?: WorkspaceAiContext;
  milestones: WorkspaceMilestone[];
  loadedAt: string;
};

async function readJsonFile<T>(filePath: string): Promise<T | undefined> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Unable to read JSON file: ${filePath}`, error);
    return undefined;
  }
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function loadActiveWorkspace(): Promise<ActiveWorkspace> {
  const metadataPath = path.join(activeWorkspaceRoot, ".workflowstudio", "project.json");
  const aiContextPath = path.join(activeWorkspaceRoot, ".workflowstudio", "ai-context.json");
  const milestonesPath = path.join(activeWorkspaceRoot, ".workflowstudio", "milestones.json");

  const metadata = await readJsonFile<WorkspaceProjectMetadata>(metadataPath);

  if (!metadata) {
    throw new Error(`Active workspace metadata was not found: ${metadataPath}`);
  }

  const aiContext = await readJsonFile<WorkspaceAiContext>(aiContextPath);
  const milestoneData = await readJsonFile<WorkspaceMilestone[] | { milestones?: WorkspaceMilestone[] }>(milestonesPath);
  const milestones = Array.isArray(milestoneData)
    ? milestoneData
    : milestoneData?.milestones ?? [];

  return {
    id: slugify(metadata.name || "active-workspace"),
    name: metadata.name,
    rootPath: metadata.rootPath && metadata.rootPath !== "." ? metadata.rootPath : activeWorkspaceRoot,
    metadataPath,
    metadata: {
      ...metadata,
      rootPath: metadata.rootPath && metadata.rootPath !== "." ? metadata.rootPath : activeWorkspaceRoot,
    },
    aiContext,
    milestones,
    loadedAt: new Date().toISOString(),
  };
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

function buildContinuationPrompt(workspace: ActiveWorkspace) {
  const metadata = workspace.metadata;
  const context = workspace.aiContext;

  const prompt = `Workflow Studio Continuation Prompt\n\nActive workspace:\n- Name: ${metadata.name}\n- Path: ${workspace.rootPath}\n- Version: ${metadata.version}\n- Current milestone: ${metadata.currentMilestone}\n- Project type: ${metadata.projectType}\n- Build command: ${metadata.buildCommand ?? "npm run build"}\n- Test command: ${metadata.testCommand || "Not configured"}\n- Package folder: ${metadata.packageFolder}\n- Backup folder: ${metadata.backupFolder}\n\nDescription:\n${metadata.description ?? "No description provided."}\n\nCurrent AI focus:\n${context?.currentFocus ?? context?.activeGoal ?? "Continue the active milestone using workspace metadata."}\n\nImportant development rules:\n${formatList(context?.importantRules, "Build before commit and never commit broken builds.")}\n\nRecent or known milestones:\n${formatMilestones(workspace.milestones)}\n\nToday's goal:\nContinue from ${metadata.currentMilestone}. Use Workflow Studio metadata as the source of truth, keep changes small, prefer complete replacement files, run the build before committing, and update documentation when the implementation changes.\n\nAfter this milestone is complete, transition back to Orivex Render Stack development.`;

  return {
    title: `${metadata.name} — ${metadata.currentMilestone}`,
    prompt,
    generatedAt: new Date().toISOString(),
    workspaceName: metadata.name,
    milestone: metadata.currentMilestone,
  };
}

function registerWorkspaceHandlers() {
  ipcMain.handle("workspace:get-active", async () => loadActiveWorkspace());
  ipcMain.handle("workspace:get-project-metadata", async () => {
    const workspace = await loadActiveWorkspace();
    return workspace.metadata;
  });
  ipcMain.handle("workspace:generate-continuation-prompt", async () => {
    const workspace = await loadActiveWorkspace();
    return buildContinuationPrompt(workspace);
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    title: "Workflow Studio",
    backgroundColor: "#0f172a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerWorkspaceHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
