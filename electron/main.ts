import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, execSync, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;
const defaultWorkspaceRoot = path.resolve(__dirname, "..");

type WorkspaceProjectType =
  | "react"
  | "electron"
  | "node"
  | "python"
  | "embedded"
  | "esp32"
  | "platformio"
  | "electron-react-typescript"
  | "unknown";

type WorkspacePackageManager = "npm" | "pnpm" | "yarn" | "platformio" | "unknown";

type WorkspaceCapability = {
  id: string;
  label: string;
  enabled: boolean;
  detail: string;
};

type WorkspacePackageScript = {
  name: string;
  command: string;
};

type WorkspaceCommandCategory = "development" | "build" | "test" | "embedded" | "maintenance" | "analysis";

type WorkspaceCommandPermission = "safe" | "interactive" | "device-changing" | "blocked";

type WorkspaceCommand = {
  id: string;
  label: string;
  command: string;
  category: WorkspaceCommandCategory;
  description: string;
  source: "package-script" | "platformio" | "metadata" | "detected";
  workingDirectory?: string;
  destructive?: boolean;
  interactive?: boolean;
  permission: WorkspaceCommandPermission;
};


type WorkspaceCommandExecutionStatus = "running" | "completed" | "failed" | "cancelled";

type WorkspaceCommandExecution = {
  executionId: string;
  commandId: string;
  label: string;
  command: string;
  status: WorkspaceCommandExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
  message?: string;
  permission: WorkspaceCommandPermission;
};

type RunningWorkspaceCommand = {
  child: ChildProcessWithoutNullStreams;
  execution: WorkspaceCommandExecution;
};

const runningWorkspaceCommands = new Map<string, RunningWorkspaceCommand>();
const allowedExecutables = new Set(["npm", "npm.cmd", "pnpm", "pnpm.cmd", "yarn", "yarn.cmd", "pio", "pio.exe", "platformio", "platformio.exe", "python", "python.exe", "py", "py.exe", "cargo", "cargo.exe", "cmake", "cmake.exe"]);

function tokenizeCommand(command: string): string[] {
  const tokens = command.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  return tokens.map((token) => token.startsWith('"') && token.endsWith('"') ? token.slice(1, -1) : token);
}

function executableForPlatform(executable: string): string {
  if (process.platform !== "win32") return executable;
  if (["npm", "pnpm", "yarn"].includes(executable)) return `${executable}.cmd`;
  return executable;
}

function emitCommandOutput(target: Electron.WebContents, executionId: string, stream: "stdout" | "stderr" | "system", text: string) {
  target.send("workspace:commandOutput", { executionId, stream, text, timestamp: new Date().toISOString() });
}

function resolveCommandWorkingDirectory(rootPath: string, command: WorkspaceCommand): string {
  const candidate = path.resolve(rootPath, command.workingDirectory ?? ".");
  const relative = path.relative(rootPath, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Command working directory is outside the workspace.");
  return candidate;
}

function runWorkspaceCommand(
  target: Electron.WebContents,
  rootPathInput: string | undefined,
  commandId: string,
  approvedPermission?: "interactive" | "device-changing",
): WorkspaceCommandExecution {
  const rootPath = normalizeRoot(rootPathInput);
  const analysis = scanWorkspace(rootPath);
  const command = analysis.workspaceCommands.find((entry) => entry.id === commandId);
  if (!command) throw new Error("Workspace command is no longer available. Run project analysis and try again.");
  if (command.permission === "blocked") throw new Error("This command is blocked from native execution.");
  if (command.permission === "interactive" && approvedPermission !== "interactive") {
    throw new Error("Interactive command approval is required.");
  }
  if (command.permission === "device-changing" && approvedPermission !== "device-changing") {
    throw new Error("Device-changing command approval is required.");
  }
  if (command.permission === "interactive" && Array.from(runningWorkspaceCommands.values()).some((entry) => entry.execution.permission === "interactive")) {
    throw new Error("An interactive command session is already running.");
  }
  if (command.permission === "device-changing" && Array.from(runningWorkspaceCommands.values()).some((entry) => entry.execution.permission === "interactive" || entry.execution.permission === "device-changing")) {
    throw new Error("Stop the active device session before uploading firmware.");
  }

  const tokens = tokenizeCommand(command.command);
  if (tokens.length === 0) throw new Error("Command is empty.");
  const executable = executableForPlatform(tokens[0]);
  if (!allowedExecutables.has(executable.toLowerCase())) throw new Error(`Executable is not approved: ${tokens[0]}`);

  const executionId = `command-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const execution: WorkspaceCommandExecution = {
    executionId,
    commandId: command.id,
    label: command.label,
    command: command.command,
    status: "running",
    startedAt: new Date().toISOString(),
    permission: command.permission,
  };
  const child = spawn(executable, tokens.slice(1), {
    cwd: resolveCommandWorkingDirectory(rootPath, command),
    env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    shell: false,
    windowsHide: true,
  });

  runningWorkspaceCommands.set(executionId, { child, execution });
  emitCommandOutput(target, executionId, "system", `> ${command.command}\n`);
  child.stdout.on("data", (chunk: Buffer) => emitCommandOutput(target, executionId, "stdout", chunk.toString()));
  child.stderr.on("data", (chunk: Buffer) => emitCommandOutput(target, executionId, "stderr", chunk.toString()));
  child.on("error", (error) => emitCommandOutput(target, executionId, "stderr", `${error.message}\n`));
  child.on("close", (code, signal) => {
    const running = runningWorkspaceCommands.get(executionId);
    if (!running) return;
    if (running.execution.status !== "cancelled") running.execution.status = code === 0 ? "completed" : "failed";
    running.execution.exitCode = code ?? undefined;
    running.execution.finishedAt = new Date().toISOString();
    running.execution.message = signal ? `Stopped by ${signal}.` : code === 0 ? "Command completed successfully." : `Command exited with code ${code ?? "unknown"}.`;
    emitCommandOutput(target, executionId, "system", `\n${running.execution.message}\n`);
    runningWorkspaceCommands.delete(executionId);
  });
  return execution;
}

function cancelWorkspaceCommand(executionId: string) {
  const running = runningWorkspaceCommands.get(executionId);
  if (!running) return { ok: false, message: "Command is not running." };
  running.execution.status = "cancelled";
  const stopped = running.child.kill();
  return { ok: stopped, message: stopped ? "Cancellation requested." : "Unable to stop command." };
}


type AIPackageBuilderInput = {
  rootPath?: string;
  developerRequest: string;
  packageId?: string;
};

type AIPackageSafetyState = "safe" | "warning" | "blocked";

type AIPackageBuilderResult = {
  ok: boolean;
  message: string;
  packageId?: string;
  packagePath?: string;
  files?: string[];
  installCommand?: string;
  buildCommand?: string;
  suggestedCommitMessage?: string;
  warnings?: string[];
  skippedFiles?: AIPackageSkippedFile[];
  safetyState?: AIPackageSafetyState;
  validationSummary?: string;
};

type AIPackageSkippedFile = {
  path: string;
  reason: string;
  category: "generated" | "protected" | "deleted" | "unsupported" | "missing";
};

type AIPackageReadiness = {
  isRepository: boolean;
  changedFiles: string[];
  packageableFiles: string[];
  skippedFiles: AIPackageSkippedFile[];
  counts: {
    changed: number;
    packageable: number;
    skipped: number;
    generated: number;
    protected: number;
    deleted: number;
    unsupported: number;
    missing: number;
  };
  message: string;
};

type EmbeddedWorkspaceAnalysis = {
  detected: boolean;
  platform?: string;
  boardIdentifiers: string[];
  environments: string[];
  frameworks: string[];
  firmwareSourcePath?: string;
  platformioConfigPath?: string;
  buildCommand?: string;
  uploadCommand?: string;
  serialMonitorCommand?: string;
  cleanCommand?: string;
  deviceProfile?: string;
  hardwareDocumentationPaths: string[];
  specificationPaths: string[];
  packageFormatDocumentationPaths: string[];
  generatedOutputTracked: boolean;
};

type WorkspaceAnalysis = {
  projectName: string;
  rootPath: string;
  projectType: WorkspaceProjectType;
  hasGit: boolean;
  hasPackageJson: boolean;
  hasReadme: boolean;
  hasDocs: boolean;
  hasWorkflowMetadata: boolean;
  buildCommand?: string;
  testCommand?: string;
  devCommand?: string;
  packageManager: WorkspacePackageManager;
  documentationPath?: string;
  documentationPaths: string[];
  readmePath?: string;
  workflowMetadataPath?: string;
  packageJsonPath?: string;
  applicationRootPath?: string;
  currentMilestone?: string;
  packageScripts: WorkspacePackageScript[];
  workspaceCommands: WorkspaceCommand[];
  embedded?: EmbeddedWorkspaceAnalysis;
  capabilities: WorkspaceCapability[];
  health: {
    score: number;
    warnings: string[];
    successes: string[];
  };
};

type GitStatus = {
  isRepository: boolean;
  branch: string;
  status: "clean" | "dirty" | "not-repository";
  changedFiles: string[];
  summary: string;
};

type DocumentationEntry = {
  title: string;
  path: string;
  kind: "readme" | "docs" | "metadata" | "prompt" | "template";
};

type WorkspacePackageEntry = {
  name: string;
  path: string;
  kind: "package-folder" | "installed-history" | "backup-folder";
  detail: string;
};

type WorkspaceTemplateEntry = {
  name: string;
  path: string;
  kind: "template" | "prompt";
  detail: string;
};

type OpenPathResult = {
  ok: boolean;
  message: string;
};

type PackageJson = {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type PackageJsonDiscovery = {
  packageJson: PackageJson | null;
  packageJsonPath?: string;
  applicationRootPath: string;
  applicationRelativePath?: string;
};



type ProjectTimelineEventKind = "git" | "package" | "snapshot" | "workspace";

type ProjectTimelineEvent = {
  id: string;
  kind: ProjectTimelineEventKind;
  title: string;
  detail: string;
  occurredAt: string;
  path?: string;
  status?: "success" | "warning" | "info";
};

type ProjectTimelineResult = {
  generatedAt: string;
  events: ProjectTimelineEvent[];
  warnings: string[];
};
type AISnapshotRecord = {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
  rootPath: string;
  includedRoots: string[];
  excludedPatterns: string[];
  sizeBytes?: number;
};

function normalizeRoot(rootPath?: string) {
  if (!rootPath || rootPath.trim() === ".") return defaultWorkspaceRoot;
  return path.resolve(rootPath);
}

function exists(rootPath: string, relativePath: string) {
  return fs.existsSync(path.join(rootPath, relativePath));
}

function findFirstExisting(rootPath: string, paths: string[]) {
  return paths.find((candidate) => exists(rootPath, candidate));
}

function readJson<T>(rootPath: string, relativePath: string): T | null {
  const filePath = path.join(rootPath, relativePath);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch (error) {
    console.warn(`Unable to read JSON file: ${relativePath}`, error);
    return null;
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function detectPackageManager(rootPath: string, applicationRootPath = rootPath): WorkspacePackageManager {
  if (fs.existsSync(path.join(applicationRootPath, "pnpm-lock.yaml")) || exists(rootPath, "pnpm-lock.yaml")) return "pnpm";
  if (fs.existsSync(path.join(applicationRootPath, "yarn.lock")) || exists(rootPath, "yarn.lock")) return "yarn";
  if (fs.existsSync(path.join(applicationRootPath, "package-lock.json")) || exists(rootPath, "package-lock.json")) return "npm";
  return fs.existsSync(path.join(applicationRootPath, "package.json")) || exists(rootPath, "package.json") ? "npm" : "unknown";
}

function discoverPackageJson(workspaceRoot: string): PackageJsonDiscovery {
  const rootPackageJson = readJson<PackageJson>(workspaceRoot, "package.json");

  if (rootPackageJson) {
    return {
      packageJson: rootPackageJson,
      packageJsonPath: "package.json",
      applicationRootPath: workspaceRoot,
      applicationRelativePath: ".",
    };
  }

  const preferredNestedPackages = [
    "apps/desktop-studio/package.json",
    "apps/workflow-studio/package.json",
    "apps/web/package.json",
  ];

  for (const relativePath of preferredNestedPackages) {
    const packageJson = readJson<PackageJson>(workspaceRoot, relativePath);

    if (packageJson) {
      return {
        packageJson,
        packageJsonPath: relativePath,
        applicationRootPath: path.join(workspaceRoot, path.dirname(relativePath)),
        applicationRelativePath: path.dirname(relativePath),
      };
    }
  }

  const appsPath = path.join(workspaceRoot, "apps");

  if (fs.existsSync(appsPath) && fs.statSync(appsPath).isDirectory()) {
    const appFolders = fs
      .readdirSync(appsPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const appFolder of appFolders) {
      const relativePath = path.join("apps", appFolder.name, "package.json");
      const packageJson = readJson<PackageJson>(workspaceRoot, relativePath);

      if (packageJson) {
        return {
          packageJson,
          packageJsonPath: relativePath,
          applicationRootPath: path.join(workspaceRoot, "apps", appFolder.name),
          applicationRelativePath: path.join("apps", appFolder.name),
        };
      }
    }
  }

  return {
    packageJson: null,
    applicationRootPath: workspaceRoot,
  };
}

function scriptCommand(packageManager: WorkspacePackageManager, scriptName: string) {
  const runner = packageManager === "unknown" ? "npm" : packageManager;
  return `${runner} run ${scriptName}`;
}

function detectProjectType(rootPath: string, packageJson: PackageJson | null, applicationRootPath = rootPath): WorkspaceProjectType {
  const dependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  };

  const hasElectron = Boolean(dependencies.electron) || exists(rootPath, "electron") || fs.existsSync(path.join(applicationRootPath, "electron"));
  const hasReact = Boolean(dependencies.react);
  const hasTypeScript = Boolean(dependencies.typescript) || exists(rootPath, "tsconfig.json") || fs.existsSync(path.join(applicationRootPath, "tsconfig.json"));

  if (hasElectron && hasReact && hasTypeScript) return "electron-react-typescript";
  if (hasElectron) return "electron";
  if (hasReact) return "react";
  if (packageJson) return "node";
  if (exists(rootPath, "pyproject.toml") || exists(rootPath, "requirements.txt") || fs.existsSync(path.join(applicationRootPath, "pyproject.toml")) || fs.existsSync(path.join(applicationRootPath, "requirements.txt"))) return "python";

  return "unknown";
}

function detectDocumentationPaths(rootPath: string, readmePath?: string) {
  const paths: string[] = [];

  if (readmePath) paths.push(readmePath);
  if (exists(rootPath, "docs")) paths.push("docs");
  if (exists(rootPath, "Documentation")) paths.push("Documentation");
  if (exists(rootPath, "CHANGELOG.md")) paths.push("CHANGELOG.md");
  if (exists(rootPath, "Roadmap.md")) paths.push("Roadmap.md");
  if (exists(rootPath, "prompts")) paths.push("prompts");
  if (exists(rootPath, "templates")) paths.push("templates");

  return paths;
}


function collectMatchingPaths(rootPath: string, folders: string[], pattern: RegExp) {
  const matches: string[] = [];

  for (const folder of folders) {
    const absoluteFolder = path.join(rootPath, folder);
    if (!fs.existsSync(absoluteFolder) || !fs.statSync(absoluteFolder).isDirectory()) continue;

    const visit = (currentFolder: string) => {
      for (const entry of fs.readdirSync(currentFolder, { withFileTypes: true })) {
        const absolutePath = path.join(currentFolder, entry.name);
        const relativePath = path.relative(rootPath, absolutePath);
        if (entry.isDirectory()) visit(absolutePath);
        else if (pattern.test(relativePath.replace(/\\/g, "/"))) matches.push(relativePath);
      }
    };

    visit(absoluteFolder);
  }

  return matches.sort((a, b) => a.localeCompare(b));
}

function parsePlatformIoConfig(rootPath: string, relativePath: string) {
  const text = fs.readFileSync(path.join(rootPath, relativePath), "utf8");
  const environments: string[] = [];
  const boards = new Set<string>();
  const frameworks = new Set<string>();
  const platforms = new Set<string>();
  let currentEnvironment: string | undefined;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/[;#].*$/, "").trim();
    if (!line) continue;
    const section = line.match(/^\[env:([^\]]+)\]$/i);
    if (section) {
      currentEnvironment = section[1].trim();
      environments.push(currentEnvironment);
      continue;
    }
    if (!currentEnvironment) continue;
    const property = line.match(/^([^=]+)=(.+)$/);
    if (!property) continue;
    const key = property[1].trim().toLowerCase();
    const values = property[2].split(",").map((value) => value.trim()).filter(Boolean);
    if (key === "board") values.forEach((value) => boards.add(value));
    if (key === "framework") values.forEach((value) => frameworks.add(value));
    if (key === "platform") values.forEach((value) => platforms.add(value));
  }

  return { environments, boards: [...boards], frameworks: [...frameworks], platforms: [...platforms] };
}

function hasTrackedGeneratedEmbeddedOutput(rootPath: string) {
  if (!exists(rootPath, ".git")) return false;
  try {
    const tracked = runGit(rootPath, "ls-files .pio build firmware/build");
    return tracked.length > 0;
  } catch {
    return false;
  }
}

function analyzeEmbeddedWorkspace(rootPath: string, workflowProject: Record<string, unknown> | null): EmbeddedWorkspaceAnalysis | undefined {
  const platformioConfigPath = findFirstExisting(rootPath, ["platformio.ini", "firmware/platformio.ini"]);
  const firmwareSourcePath = findFirstExisting(rootPath, [
    "src/main.cpp",
    "firmware/src/main.cpp",
    "firmware/main/main.cpp",
    "main/main.cpp",
  ]);
  const hasEmbeddedFolders = ["firmware", "include", "lib", "boards"].some((folder) => exists(rootPath, folder));
  if (!platformioConfigPath && !firmwareSourcePath && !hasEmbeddedFolders) return undefined;

  const parsed = platformioConfigPath
    ? parsePlatformIoConfig(rootPath, platformioConfigPath)
    : { environments: [], boards: [], frameworks: [], platforms: [] };
  const primaryEnvironment = parsed.environments[0];
  const environmentSuffix = primaryEnvironment ? ` -e ${primaryEnvironment}` : "";
  const metadata = (workflowProject?.embedded ?? workflowProject) as Record<string, unknown> | undefined;
  const hardwareDocumentationPaths = collectMatchingPaths(rootPath, ["docs", "Documentation", "hardware"], /(^|\/)(hardware|board|enclosure|dock)[^/]*\.(md|json|ya?ml)$/i);
  const specificationPaths = collectMatchingPaths(rootPath, ["docs", "Documentation", "hardware"], /(specification|spec|pinout|bom|schematic).*\.(md|json|ya?ml|csv)$/i);
  const packageFormatDocumentationPaths = collectMatchingPaths(rootPath, ["docs", "Documentation"], /(package|asset|ovx).*\.(md|json|ya?ml)$/i);
  const platform = typeof metadata?.targetPlatform === "string" ? metadata.targetPlatform : parsed.platforms[0];
  const deviceProfile = typeof metadata?.deviceProfile === "string" ? metadata.deviceProfile : undefined;

  return {
    detected: true,
    platform,
    boardIdentifiers: parsed.boards,
    environments: parsed.environments,
    frameworks: parsed.frameworks,
    firmwareSourcePath,
    platformioConfigPath,
    buildCommand: platformioConfigPath ? `platformio run${environmentSuffix}` : undefined,
    uploadCommand: platformioConfigPath ? `platformio run${environmentSuffix} --target upload` : undefined,
    serialMonitorCommand: platformioConfigPath ? `platformio device monitor${primaryEnvironment ? ` -e ${primaryEnvironment}` : ""}` : undefined,
    cleanCommand: platformioConfigPath ? `platformio run${environmentSuffix} --target clean` : undefined,
    deviceProfile,
    hardwareDocumentationPaths,
    specificationPaths,
    packageFormatDocumentationPaths,
    generatedOutputTracked: hasTrackedGeneratedEmbeddedOutput(rootPath),
  };
}

function buildWorkspaceCommands(
  packageScripts: WorkspacePackageScript[],
  packageManager: WorkspacePackageManager,
  applicationRelativePath: string | undefined,
  embedded: EmbeddedWorkspaceAnalysis | undefined,
  workflowProject: Record<string, unknown> | null,
): WorkspaceCommand[] {
  const commands: WorkspaceCommand[] = [];
  const workingDirectory = applicationRelativePath && applicationRelativePath !== "." ? applicationRelativePath : undefined;
  const add = (command: Omit<WorkspaceCommand, "permission"> | undefined) => {
    if (!command || commands.some((item) => item.id === command.id || item.command === command.command)) return;
    const permission: WorkspaceCommandPermission = command.id === "embedded:upload"
      ? "device-changing"
      : command.interactive
        ? "interactive"
        : command.source === "metadata" || command.id === "workspace:analysis"
          ? "blocked"
          : "safe";
    commands.push({ ...command, permission });
  };

  for (const script of packageScripts) {
    const category: WorkspaceCommandCategory = script.name === "build" ? "build" : script.name === "test" ? "test" : script.name === "dev" || script.name === "start" ? "development" : "maintenance";
    add({
      id: `script:${script.name}`,
      label: script.name === "dev" ? "Start development server" : script.name === "build" ? "Build project" : script.name === "test" ? "Run tests" : `Run ${script.name}`,
      command: scriptCommand(packageManager, script.name),
      category,
      description: `Run the ${script.name} package script.`,
      source: "package-script",
      workingDirectory,
      interactive: script.name === "dev" || script.name === "start",
    });
  }

  if (embedded?.buildCommand) add({ id: "embedded:build", label: "Build firmware", command: embedded.buildCommand, category: "build", description: "Compile firmware for the selected PlatformIO environment.", source: "platformio", workingDirectory });
  if (embedded?.uploadCommand) add({ id: "embedded:upload", label: "Upload firmware", command: embedded.uploadCommand, category: "embedded", description: "Upload firmware to the connected embedded device.", source: "platformio", workingDirectory, destructive: true });
  if (embedded?.serialMonitorCommand) add({ id: "embedded:monitor", label: "Open serial monitor", command: embedded.serialMonitorCommand, category: "embedded", description: "Open an interactive serial monitor for the selected environment.", source: "platformio", workingDirectory, interactive: true });
  if (embedded?.cleanCommand) add({ id: "embedded:clean", label: "Clean firmware build", command: embedded.cleanCommand, category: "maintenance", description: "Remove generated PlatformIO build output.", source: "platformio", workingDirectory, destructive: true });

  const metadataCommands = workflowProject?.commands;
  if (Array.isArray(metadataCommands)) {
    metadataCommands.forEach((value, index) => {
      if (!value || typeof value !== "object") return;
      const record = value as Record<string, unknown>;
      if (typeof record.command !== "string" || typeof record.label !== "string") return;
      add({ id: typeof record.id === "string" ? record.id : `metadata:${index}`, label: record.label, command: record.command, category: "maintenance", description: typeof record.description === "string" ? record.description : "Project metadata command.", source: "metadata", workingDirectory });
    });
  }

  add({ id: "workspace:analysis", label: "Run project analysis", command: "Workflow Studio Analysis", category: "analysis", description: "Refresh workspace detection, health checks, and command profiles.", source: "detected" });
  return commands;
}

function capability(
  id: string,
  label: string,
  enabled: boolean,
  enabledDetail: string,
  disabledDetail: string,
): WorkspaceCapability {
  return {
    id,
    label,
    enabled,
    detail: enabled ? enabledDetail : disabledDetail,
  };
}

function scanWorkspace(rootPathInput?: string): WorkspaceAnalysis {
  const workspaceRoot = normalizeRoot(rootPathInput);
  const packageDiscovery = discoverPackageJson(workspaceRoot);
  const { packageJson, packageJsonPath, applicationRootPath, applicationRelativePath } = packageDiscovery;
  const workflowMetadataPath = findFirstExisting(workspaceRoot, [
    ".workflowstudio/project.json",
    ".workflowstudio/metadata.json",
  ]);
  const workflowProject = workflowMetadataPath
    ? readJson<Record<string, unknown> & { name?: string; version?: string; currentMilestone?: string }>(
        workspaceRoot,
        workflowMetadataPath,
      )
    : null;
  const readmePath = findFirstExisting(workspaceRoot, ["README.md", "readme.md", "Readme.md"]);
  const documentationPaths = detectDocumentationPaths(workspaceRoot, readmePath);
  const hasGit = exists(workspaceRoot, ".git");
  const hasPackageJson = Boolean(packageJson);
  const hasReadme = Boolean(readmePath);
  const hasDocs = exists(workspaceRoot, "docs") || exists(workspaceRoot, "Documentation");
  const hasWorkflowMetadata = Boolean(workflowMetadataPath);
  const embedded = analyzeEmbeddedWorkspace(workspaceRoot, workflowProject);
  const packageManager = embedded?.platformioConfigPath ? "platformio" : detectPackageManager(workspaceRoot, applicationRootPath);
  const detectedProjectType = detectProjectType(workspaceRoot, packageJson, applicationRootPath);
  const hasEsp32 = Boolean(embedded?.boardIdentifiers.some((board) => /esp32/i.test(board)) || /esp32/i.test(embedded?.platform ?? ""));
  const projectType: WorkspaceProjectType = embedded?.platformioConfigPath ? "platformio" : embedded ? (hasEsp32 ? "esp32" : "embedded") : detectedProjectType;
  const scripts = packageJson?.scripts ?? {};
  const packageScripts = Object.entries(scripts).map(([name, command]) => ({ name, command }));
  const workspaceCommands = buildWorkspaceCommands(packageScripts, packageManager, applicationRelativePath, embedded, workflowProject);
  const buildCommand = embedded?.buildCommand ?? (scripts.build ? scriptCommand(packageManager, "build") : undefined);
  const devCommand = scripts.dev ? scriptCommand(packageManager, "dev") : undefined;
  const testCommand = scripts.test ? scriptCommand(packageManager, "test") : undefined;
  const hasPackageWorkflow = exists(workspaceRoot, "_packages") && exists(workspaceRoot, "_backup");
  const hasTemplates = exists(workspaceRoot, "templates");
  const hasPrompts = exists(workspaceRoot, "prompts");
  const hasElectronFolder = exists(workspaceRoot, "electron") || fs.existsSync(path.join(applicationRootPath, "electron"));
  const hasSourceFolder = exists(workspaceRoot, "src") || fs.existsSync(path.join(applicationRootPath, "src"));
  const successes: string[] = [];
  const warnings: string[] = [];

  if (hasGit) successes.push("Git repository detected.");
  else warnings.push("Git repository was not detected.");

  if (hasPackageJson) successes.push(`${packageJsonPath ?? "package.json"} detected.`);
  else warnings.push("package.json was not detected.");

  if (applicationRelativePath && applicationRelativePath !== ".") successes.push(`Application root detected: ${applicationRelativePath}.`);

  if (hasReadme) successes.push(`${readmePath} detected.`);
  else warnings.push("README.md was not detected.");

  if (hasDocs) successes.push("Documentation folder detected.");
  else warnings.push("Documentation folder was not detected.");

  if (hasWorkflowMetadata) successes.push(`${workflowMetadataPath} detected.`);
  else warnings.push("Workflow Studio metadata was not detected.");

  if (buildCommand) successes.push(`Build command detected: ${buildCommand}.`);
  else warnings.push("Build command was not detected.");

  if (devCommand) successes.push(`Development command detected: ${devCommand}.`);
  if (testCommand) successes.push(`Test command detected: ${testCommand}.`);
  else if (!embedded?.detected) warnings.push("Test command was not detected yet.");

  if (embedded?.detected) {
    successes.push("Embedded project structure detected.");
    if (embedded.platformioConfigPath) successes.push(`${embedded.platformioConfigPath} detected.`);
    else warnings.push("platformio.ini was not detected.");
    if (embedded.firmwareSourcePath) successes.push(`Firmware entry point detected: ${embedded.firmwareSourcePath}.`);
    else warnings.push("Firmware source entry point was not detected.");
    if (embedded.environments.length > 0) successes.push(`PlatformIO environment detected: ${embedded.environments.join(", ")}.`);
    else warnings.push("PlatformIO board environment was not defined.");
    if (embedded.boardIdentifiers.length > 0) successes.push(`Board target detected: ${embedded.boardIdentifiers.join(", ")}.`);
    else warnings.push("Embedded board identifier was not detected.");
    if (embedded.hardwareDocumentationPaths.length > 0 || embedded.specificationPaths.length > 0) successes.push("Hardware target documentation detected.");
    else warnings.push("Hardware target documentation was not detected.");
    if (embedded.generatedOutputTracked) warnings.push("Generated embedded build output appears to be tracked by Git.");
    else successes.push("No tracked embedded build output was detected.");
  }

  const checks = embedded?.detected
    ? [hasGit, Boolean(embedded.platformioConfigPath), Boolean(embedded.firmwareSourcePath), embedded.environments.length > 0, embedded.boardIdentifiers.length > 0, hasDocs, hasWorkflowMetadata, !embedded.generatedOutputTracked]
    : [hasGit, hasPackageJson, hasReadme, hasDocs, hasWorkflowMetadata, Boolean(buildCommand), hasPackageWorkflow, hasSourceFolder];
  const score = Math.round((checks.filter(Boolean).length / checks.length) * 100);

  return {
    projectName: workflowProject?.name ?? packageJson?.name ?? path.basename(workspaceRoot),
    rootPath: workspaceRoot,
    projectType,
    hasGit,
    hasPackageJson,
    hasReadme,
    hasDocs,
    hasWorkflowMetadata,
    buildCommand,
    testCommand,
    devCommand,
    packageManager,
    documentationPath: documentationPaths[0],
    documentationPaths,
    readmePath,
    workflowMetadataPath,
    packageJsonPath,
    applicationRootPath,
    currentMilestone: workflowProject?.currentMilestone,
    packageScripts,
    workspaceCommands,
    embedded,
    capabilities: [
      capability("git", "Git", hasGit, "Repository is available.", "Repository folder was not found."),
      capability("source", "Source", hasSourceFolder, "Source folder is available.", "src folder was not found."),
      capability("package-json", "package.json", hasPackageJson, "Node project metadata is available.", "package.json was not found."),
      capability("package-workflow", "Package Workflow", hasPackageWorkflow, "Package and backup folders are available.", "_packages and _backup were not both found."),
      capability("build", "Build", Boolean(buildCommand), "Build command is available.", "Build command was not found."),
      capability("test", "Tests", Boolean(testCommand), "Test command is available.", "Test command was not found."),
      capability("readme", "README", hasReadme, "README documentation is available.", "README.md was not found."),
      capability("docs", "Docs", hasDocs, "Documentation folder is available.", "docs folder was not found."),
      capability("workflow-metadata", "Workflow Metadata", hasWorkflowMetadata, "Workflow Studio metadata is available.", "Workflow Studio metadata was not found."),
      ...(embedded?.detected ? [
        capability("embedded", "Embedded Project", true, "Embedded project structure is available.", "Embedded project structure was not found."),
        capability("platformio", "PlatformIO", Boolean(embedded.platformioConfigPath), "PlatformIO configuration is available.", "platformio.ini was not found."),
        capability("firmware-entry", "Firmware Entry", Boolean(embedded.firmwareSourcePath), "Firmware entry point is available.", "Firmware entry point was not found."),
        capability("board-environment", "Board Environment", embedded.environments.length > 0, "PlatformIO board environment is defined.", "PlatformIO board environment was not defined."),
        capability("serial-monitor", "Serial Monitor", Boolean(embedded.serialMonitorCommand), "Serial monitor command is available.", "Serial monitor command was not detected."),
        capability("hardware-docs", "Hardware Docs", embedded.hardwareDocumentationPaths.length > 0 || embedded.specificationPaths.length > 0, "Hardware documentation is available.", "Hardware documentation was not found."),
      ] : []),
      capability("electron", "Electron", hasElectronFolder, "Electron desktop shell is available.", "electron folder was not found."),
      capability("prompts", "Prompts", hasPrompts, "Prompt library folder is available.", "prompts folder was not found."),
      capability("templates", "Templates", hasTemplates, "Template folder is available.", "templates folder was not found."),
    ],
    health: {
      score,
      warnings,
      successes,
    },
  };
}

function runGit(rootPath: string, command: string) {
  return execSync(`git ${command}`, {
    cwd: rootPath,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function getGitStatus(rootPathInput?: string): GitStatus {
  const rootPath = normalizeRoot(rootPathInput);

  if (!exists(rootPath, ".git")) {
    return {
      isRepository: false,
      branch: "Not a Git repository",
      status: "not-repository",
      changedFiles: [],
      summary: "Git repository was not detected for this workspace.",
    };
  }

  try {
    const branch = runGit(rootPath, "rev-parse --abbrev-ref HEAD") || "unknown";
    const porcelain = runGit(rootPath, "status --short");
    const changedFiles = porcelain
      ? porcelain.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      : [];
    const status = changedFiles.length > 0 ? "dirty" : "clean";

    return {
      isRepository: true,
      branch,
      status,
      changedFiles,
      summary:
        status === "clean"
          ? `Branch ${branch} is clean.`
          : `Branch ${branch} has ${changedFiles.length} changed file${changedFiles.length === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    console.warn("Unable to read Git status.", error);
    return {
      isRepository: true,
      branch: "Unknown",
      status: "dirty",
      changedFiles: [],
      summary: "Git is available, but status could not be read.",
    };
  }
}

function collectMarkdownFiles(
  rootPath: string,
  relativeFolder: string,
  kind: DocumentationEntry["kind"],
  maxDepth = 4,
) {
  const folderPath = path.join(rootPath, relativeFolder);

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) return [];

  const results: DocumentationEntry[] = [];

  function walk(currentRelativeFolder: string, depth: number) {
    if (depth > maxDepth) return;

    const currentFolder = path.join(rootPath, currentRelativeFolder);

    for (const entry of fs.readdirSync(currentFolder, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;

      const entryRelativePath = path.join(currentRelativeFolder, entry.name);

      if (entry.isDirectory()) {
        walk(entryRelativePath, depth + 1);
        continue;
      }

      if (entry.name.toLowerCase().endsWith(".md")) {
        results.push({
          title: entry.name.replace(/\.md$/i, ""),
          path: entryRelativePath,
          kind,
        });
      }
    }
  }

  walk(relativeFolder, 0);

  return results.sort((a, b) => a.path.localeCompare(b.path));
}

function listDirectoryEntries(rootPath: string, relativeFolder: string) {
  const folderPath = path.join(rootPath, relativeFolder);

  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return [];
  }

  return fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function listPackages(rootPathInput?: string): WorkspacePackageEntry[] {
  const rootPath = normalizeRoot(rootPathInput);
  const entries: WorkspacePackageEntry[] = [];

  for (const entry of listDirectoryEntries(rootPath, "_packages")) {
    entries.push({
      name: entry.name,
      path: path.join("_packages", entry.name),
      kind: "package-folder",
      detail: entry.isDirectory() ? "Local package folder" : "Package file",
    });
  }

  for (const entry of listDirectoryEntries(rootPath, "_backup")) {
    entries.push({
      name: entry.name,
      path: path.join("_backup", entry.name),
      kind: "backup-folder",
      detail: entry.isDirectory() ? "Backup history folder" : "Backup file",
    });
  }

  const packageHistory = readJson<{ packages?: Array<{ name?: string; packageId?: string; installedDate?: string; version?: string }> }>(
    rootPath,
    ".workflowstudio/packages.json",
  );

  for (const packageRecord of packageHistory?.packages ?? []) {
    const name = packageRecord.name ?? packageRecord.packageId ?? "Installed package";
    entries.push({
      name,
      path: ".workflowstudio/packages.json",
      kind: "installed-history",
      detail: packageRecord.installedDate
        ? `Installed ${packageRecord.installedDate}`
        : packageRecord.version
          ? `Version ${packageRecord.version}`
          : "Package history record",
    });
  }

  return entries;
}


type WorkspacePackageTreeNode = {
  name: string;
  path: string;
  kind: "folder" | "file";
  children?: WorkspacePackageTreeNode[];
};

function buildPackageTree(rootPathInput?: string): WorkspacePackageTreeNode[] {
  const rootPath = normalizeRoot(rootPathInput);
  const roots = ["_packages", "_backup"];

  function walk(relativePath: string, depth = 0): WorkspacePackageTreeNode[] {
    if (depth > 6) return [];
    const absolutePath = path.join(rootPath, relativePath);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) return [];

    return fs.readdirSync(absolutePath, { withFileTypes: true })
      .filter((entry) => !entry.name.startsWith("."))
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .map((entry) => {
        const childPath = path.join(relativePath, entry.name);
        return entry.isDirectory()
          ? { name: entry.name, path: childPath, kind: "folder" as const, children: walk(childPath, depth + 1) }
          : { name: entry.name, path: childPath, kind: "file" as const };
      });
  }

  return roots
    .filter((relativePath) => fs.existsSync(path.join(rootPath, relativePath)))
    .map((relativePath) => ({
      name: relativePath,
      path: relativePath,
      kind: "folder" as const,
      children: walk(relativePath),
    }));
}

function collectReusableFiles(
  rootPath: string,
  relativeFolder: string,
  kind: WorkspaceTemplateEntry["kind"],
): WorkspaceTemplateEntry[] {
  return listDirectoryEntries(rootPath, relativeFolder)
    .filter((entry) => entry.isDirectory() || /\.(md|txt|json|tsx?|ps1)$/i.test(entry.name))
    .map((entry) => ({
      name: entry.name.replace(/\.(md|txt|json|tsx?|ps1)$/i, ""),
      path: path.join(relativeFolder, entry.name),
      kind,
      detail: entry.isDirectory() ? "Reusable folder" : "Reusable file",
    }));
}

function listTemplates(rootPathInput?: string): WorkspaceTemplateEntry[] {
  const rootPath = normalizeRoot(rootPathInput);

  return [
    ...collectReusableFiles(rootPath, "templates", "template"),
    ...collectReusableFiles(rootPath, "prompts", "prompt"),
  ];
}

async function openWorkspacePath(rootPathInput: string | undefined, relativePath: string): Promise<OpenPathResult> {
  const rootPath = normalizeRoot(rootPathInput);
  const targetPath = path.resolve(rootPath, relativePath);

  if (!targetPath.startsWith(rootPath)) {
    return { ok: false, message: "Blocked path outside the active workspace." };
  }

  if (!fs.existsSync(targetPath)) {
    return { ok: false, message: "Path does not exist yet." };
  }

  const result = await shell.openPath(targetPath);

  return {
    ok: result.length === 0,
    message: result.length === 0 ? "Opened." : result,
  };
}

function listDocumentation(rootPathInput?: string): DocumentationEntry[] {
  const rootPath = normalizeRoot(rootPathInput);
  const entries: DocumentationEntry[] = [];
  const readmePath = findFirstExisting(rootPath, ["README.md", "readme.md", "Readme.md"]);

  if (readmePath) {
    entries.push({ title: "README", path: readmePath, kind: "readme" });
  }

  for (const entry of fs.readdirSync(rootPath, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md") && entry.name !== readmePath) {
      entries.push({ title: entry.name.replace(/\.md$/i, ""), path: entry.name, kind: "docs" });
    }
  }

  entries.push(...collectMarkdownFiles(rootPath, "docs", "docs"));
  entries.push(...collectMarkdownFiles(rootPath, ".workflowstudio", "metadata"));
  entries.push(...collectMarkdownFiles(rootPath, "prompts", "prompt"));
  entries.push(...collectMarkdownFiles(rootPath, "templates", "template"));

  return entries;
}



function listProjectTimeline(rootPathInput?: string): ProjectTimelineResult {
  const rootPath = normalizeRoot(rootPathInput);
  const events: ProjectTimelineEvent[] = [];
  const warnings: string[] = [];

  if (exists(rootPath, ".git")) {
    try {
      const raw = runGit(rootPath, "log -n 30 --pretty=format:%H%x1f%h%x1f%aI%x1f%s");
      for (const line of raw.split(/\r?\n/).filter(Boolean)) {
        const [hash, shortHash, occurredAt, subject] = line.split("\x1f");
        if (!hash || !occurredAt) continue;
        events.push({
          id: `git-${hash}`,
          kind: "git",
          title: subject || "Git commit",
          detail: `Commit ${shortHash || hash.slice(0, 7)}`,
          occurredAt,
          status: "success",
        });
      }
    } catch (error) {
      console.warn("Unable to read Git history for timeline.", error);
      warnings.push("Git history could not be loaded.");
    }

    try {
      const status = getGitStatus(rootPath);
      if (status.status === "dirty") {
        events.push({
          id: "workspace-uncommitted",
          kind: "workspace",
          title: "Uncommitted workspace changes",
          detail: `${status.changedFiles.length} changed file${status.changedFiles.length === 1 ? "" : "s"} on ${status.branch}.`,
          occurredAt: new Date().toISOString(),
          status: "warning",
        });
      }
    } catch {
      // Git history above already reports useful failures.
    }
  }

  for (const snapshot of listAISnapshots(rootPath)) {
    events.push({
      id: `snapshot-${snapshot.id}`,
      kind: "snapshot",
      title: "AI snapshot created",
      detail: snapshot.name,
      occurredAt: snapshot.createdAt,
      path: path.relative(rootPath, snapshot.filePath),
      status: "success",
    });
  }

  const packagesRoot = path.join(rootPath, "_packages");
  if (fs.existsSync(packagesRoot) && fs.statSync(packagesRoot).isDirectory()) {
    for (const entry of fs.readdirSync(packagesRoot, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const entryPath = path.join(packagesRoot, entry.name);
      try {
        const stats = fs.statSync(entryPath);
        const manifestPath = entry.isDirectory() ? path.join(entryPath, "manifest.json") : "";
        let title = "Package created";
        let detail = entry.name;
        if (manifestPath && fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as { name?: string; packageId?: string; version?: string };
          title = manifest.name ?? title;
          detail = [manifest.packageId ?? entry.name, manifest.version ? `v${manifest.version}` : ""].filter(Boolean).join(" · ");
        }
        events.push({
          id: `package-${entry.name}`,
          kind: "package",
          title,
          detail,
          occurredAt: stats.mtime.toISOString(),
          path: path.join("_packages", entry.name),
          status: "success",
        });
      } catch (error) {
        console.warn(`Unable to inspect package ${entry.name}.`, error);
      }
    }
  }

  const packageHistory = readJson<{ packages?: Array<{ name?: string; packageId?: string; installedDate?: string; version?: string }> }>(
    rootPath,
    ".workflowstudio/packages.json",
  );
  for (const record of packageHistory?.packages ?? []) {
    if (!record.installedDate) continue;
    const name = record.name ?? record.packageId ?? "Package";
    events.push({
      id: `installed-${record.packageId ?? name}-${record.installedDate}`,
      kind: "package",
      title: "Package installed",
      detail: [name, record.version ? `v${record.version}` : ""].filter(Boolean).join(" · "),
      occurredAt: record.installedDate,
      path: ".workflowstudio/packages.json",
      status: "info",
    });
  }

  const normalized = events
    .filter((event) => !Number.isNaN(Date.parse(event.occurredAt)))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, 80);

  return { generatedAt: new Date().toISOString(), events: normalized, warnings };
}
function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function snapshotRoot(rootPath: string) {
  return path.join(rootPath, ".workflowstudio", "ai-snapshots");
}

function snapshotHistoryPath(rootPath: string) {
  return path.join(rootPath, ".workflowstudio", "ai-snapshots.json");
}

function listAISnapshots(rootPathInput?: string): AISnapshotRecord[] {
  const rootPath = normalizeRoot(rootPathInput);
  const historyFile = snapshotHistoryPath(rootPath);
  const snapshotsByPath = new Map<string, AISnapshotRecord>();

  if (fs.existsSync(historyFile)) {
    try {
      const history = JSON.parse(fs.readFileSync(historyFile, "utf8")) as { snapshots?: AISnapshotRecord[] };
      for (const snapshot of history.snapshots ?? []) {
        snapshotsByPath.set(path.resolve(snapshot.filePath), snapshot);
      }
    } catch (error) {
      console.warn("Unable to read AI snapshot history.", error);
    }
  }

  const folder = snapshotRoot(rootPath);
  if (fs.existsSync(folder)) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".zip")) continue;

      const filePath = path.join(folder, entry.name);
      const resolvedPath = path.resolve(filePath);
      if (snapshotsByPath.has(resolvedPath)) continue;

      const stat = fs.statSync(filePath);
      snapshotsByPath.set(resolvedPath, {
        id: path.basename(entry.name, path.extname(entry.name)),
        name: entry.name,
        filePath,
        createdAt: stat.birthtime.toISOString() !== new Date(0).toISOString()
          ? stat.birthtime.toISOString()
          : stat.mtime.toISOString(),
        rootPath,
        includedRoots: [],
        excludedPatterns: [],
        sizeBytes: stat.size,
      });
    }
  }

  const snapshots = Array.from(snapshotsByPath.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 25);

  if (snapshots.length > 0) {
    writeJson(historyFile, { snapshots });
  }

  return snapshots;
}

function shouldExclude(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  const parts = normalized.split("/");

  if (parts.some((part) => ["node_modules", "dist", ".git", "_backup", ".vite", "coverage"].includes(part))) {
    return true;
  }

  return /(^|\/).+\.log$/i.test(normalized);
}

function copyIfExists(workspaceRoot: string, stagingRoot: string, relativePath: string) {
  const source = path.join(workspaceRoot, relativePath);
  const target = path.join(stagingRoot, relativePath);

  if (!fs.existsSync(source)) return false;

  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.cpSync(source, target, {
      recursive: true,
      filter: (sourcePath) => {
        const relative = path.relative(workspaceRoot, sourcePath);
        return !shouldExclude(relative);
      },
    });
    return true;
  }

  if (stat.isFile() && !shouldExclude(relativePath)) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    return true;
  }

  return false;
}

function shellEscapePowerShell(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function compressFolder(sourceFolder: string, destinationZip: string) {
  if (fs.existsSync(destinationZip)) fs.rmSync(destinationZip, { force: true });

  const sourceGlob = path.join(sourceFolder, "*");
  const command = [
    "powershell",
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path ${shellEscapePowerShell(sourceGlob)} -DestinationPath ${shellEscapePowerShell(destinationZip)} -Force`,
  ].join(" ");

  execSync(command, { stdio: "pipe" });
}

function removeDirectoryWithRetry(folderPath: string, attempts = 5) {
  if (!fs.existsSync(folderPath)) return;

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
      return;
    } catch (error) {
      lastError = error;
      const waitUntil = Date.now() + 100 * (attempt + 1);
      while (Date.now() < waitUntil) {
        // Brief synchronous backoff keeps snapshot creation deterministic on Windows.
      }
    }
  }

  throw lastError;
}

function createSnapshotStagingFolder(_outputFolder: string, snapshotName: string) {
  const stagingRoot = path.join(app.getPath("temp"), "workflow-studio-ai-snapshots");
  fs.mkdirSync(stagingRoot, { recursive: true });

  const preferredFolder = path.join(stagingRoot, snapshotName);
  try {
    removeDirectoryWithRetry(preferredFolder);
    fs.mkdirSync(preferredFolder, { recursive: true });
    return preferredFolder;
  } catch (error) {
    console.warn("Unable to reuse the preferred AI snapshot staging folder.", error);
    const fallbackFolder = path.join(
      stagingRoot,
      `${snapshotName}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`,
    );
    fs.mkdirSync(fallbackFolder, { recursive: true });
    return fallbackFolder;
  }
}

function createAISnapshot(rootPathInput?: string) {
  const rootPath = normalizeRoot(rootPathInput);

  if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
    return { ok: false, message: "Workspace folder does not exist." };
  }

  const analysis = scanWorkspace(rootPath);
  const timestamp = safeTimestamp();
  const snapshotName = `${analysis.projectName || path.basename(rootPath)}-AI-Snapshot-${timestamp}`.replace(/[^a-z0-9._-]+/gi, "-");
  const outputFolder = snapshotRoot(rootPath);
  fs.mkdirSync(outputFolder, { recursive: true });
  const stagingFolder = createSnapshotStagingFolder(outputFolder, snapshotName);
  const destinationZip = path.join(outputFolder, `${snapshotName}.zip`);
  const includedRoots: string[] = [];

  const candidates = [
    "docs",
    "Documentation",
    "prompts",
    "templates",
    "tools",
    "src",
    "electron",
    "README.md",
    "readme.md",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.electron.json",
    "vite.config.ts",
    ".gitignore",
    ".workflowstudio/project.json",
    ".workflowstudio/metadata.json",
  ];

  if (analysis.applicationRootPath && analysis.applicationRootPath !== rootPath) {
    const appRelative = path.relative(rootPath, analysis.applicationRootPath);
    candidates.push(
      path.join(appRelative, "src"),
      path.join(appRelative, "electron"),
      path.join(appRelative, "package.json"),
      path.join(appRelative, "tsconfig.json"),
      path.join(appRelative, "tsconfig.app.json"),
      path.join(appRelative, "vite.config.ts"),
    );
  }

  for (const relativePath of Array.from(new Set(candidates))) {
    if (copyIfExists(rootPath, stagingFolder, relativePath)) {
      includedRoots.push(relativePath);
    }
  }

  writeJson(path.join(stagingFolder, "AI_SNAPSHOT_MANIFEST.json"), {
    schemaVersion: "1.0",
    createdAt: new Date().toISOString(),
    projectName: analysis.projectName,
    rootPath,
    includedRoots,
    excludedPatterns: ["node_modules", "dist", ".git", "_backup", ".vite", "coverage", "*.log"],
    health: analysis.health,
  });

  try {
    compressFolder(stagingFolder, destinationZip);
  } finally {
    try {
      removeDirectoryWithRetry(stagingFolder);
    } catch (error) {
      console.warn("Unable to remove the AI snapshot staging folder after compression.", error);
    }
  }

  const snapshot: AISnapshotRecord = {
    id: snapshotName,
    name: `${snapshotName}.zip`,
    filePath: destinationZip,
    createdAt: new Date().toISOString(),
    rootPath,
    includedRoots,
    excludedPatterns: ["node_modules", "dist", ".git", "_backup", ".vite", "coverage", "*.log"],
    sizeBytes: fs.existsSync(destinationZip) ? fs.statSync(destinationZip).size : undefined,
  };

  const snapshots = [snapshot, ...listAISnapshots(rootPath).filter((entry) => entry.id !== snapshot.id)].slice(0, 25);
  writeJson(snapshotHistoryPath(rootPath), { snapshots });

  return {
    ok: true,
    message: `Created AI snapshot: ${snapshot.name}`,
    snapshot,
  };
}

function sanitizePackageId(value: string, fallback: string) {
  const normalized = (value.trim() || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function parseGitChangedFiles(rootPath: string) {
  const porcelain = runGit(rootPath, "status --short");

  if (!porcelain) return [];

  return porcelain
    .split(/\r?\n/)
    .map((line) => ({ status: line.slice(0, 2), filePath: line.slice(3).trim() }))
    .map((entry) => ({
      ...entry,
      filePath: entry.filePath.includes(" -> ")
        ? entry.filePath.split(" -> ").at(-1)?.trim() ?? entry.filePath
        : entry.filePath,
    }))
    .filter((entry) => Boolean(entry.filePath));
}

function classifyPackageReplacement(rootPath: string, relativePath: string, status: string): { packageable: boolean; skipped?: AIPackageSkippedFile } {
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const lower = normalized.toLowerCase();
  const parts = lower.split("/");

  if (path.isAbsolute(relativePath) || parts.includes("..")) {
    return { packageable: false, skipped: { path: relativePath, reason: "Path is outside the workspace or contains unsafe traversal.", category: "protected" } };
  }

  if (status.includes("D")) {
    return { packageable: false, skipped: { path: relativePath, reason: "Deleted files are not exported as replacement files.", category: "deleted" } };
  }

  const protectedDirectories = new Set([".git", "node_modules", "_packages", "_backup"]);
  if (parts.some((part) => protectedDirectories.has(part))) {
    return { packageable: false, skipped: { path: relativePath, reason: "Protected workspace or package-system path.", category: "protected" } };
  }

  if (lower === ".workflowstudio/ai-snapshots.json" || lower.startsWith(".workflowstudio/ai-snapshots/") || lower.startsWith(".workflowstudio/cache/") || lower.startsWith(".workflowstudio/temp/") || lower.startsWith(".workflowstudio/logs/")) {
    return { packageable: false, skipped: { path: relativePath, reason: "Generated Workflow Studio state or AI snapshot history.", category: "generated" } };
  }

  const generatedDirectories = new Set(["dist", "dist-electron", ".vite", "coverage", "build", "out", "cache", "temp", "tmp", "logs"]);
  if (parts.some((part) => generatedDirectories.has(part)) || /(^|\/)\.pio(\/|$)/i.test(normalized)) {
    return { packageable: false, skipped: { path: relativePath, reason: "Generated build, cache, coverage, or temporary output.", category: "generated" } };
  }

  if (/\.(log|tmp|cache|map)$/i.test(normalized)) {
    return { packageable: false, skipped: { path: relativePath, reason: "Generated log, cache, temporary, or source-map file.", category: "generated" } };
  }

  if (!/\.(tsx?|jsx?|json|md|css|scss|html|ps1|yml|yaml|txt|ini|toml|c|cc|cpp|h|hpp|py|rs)$/i.test(normalized)) {
    return { packageable: false, skipped: { path: relativePath, reason: "File type is not approved for replacement packages.", category: "unsupported" } };
  }

  const candidate = path.join(rootPath, normalized);
  if (!fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) {
    return { packageable: false, skipped: { path: relativePath, reason: "Changed path is missing or is not a regular file.", category: "missing" } };
  }

  return { packageable: true };
}

function emptyPackageCounts() {
  return { changed: 0, packageable: 0, skipped: 0, generated: 0, protected: 0, deleted: 0, unsupported: 0, missing: 0 };
}

function getAIPackageReadiness(rootPathInput?: string): AIPackageReadiness {
  const rootPath = normalizeRoot(rootPathInput);

  if (!exists(rootPath, ".git")) {
    return {
      isRepository: false,
      changedFiles: [],
      packageableFiles: [],
      skippedFiles: [],
      counts: emptyPackageCounts(),
      message: "Git status is required to identify packageable changes.",
    };
  }

  const rawChanges = parseGitChangedFiles(rootPath);
  const changedFiles = rawChanges.map((entry) => entry.filePath);
  const packageableFiles: string[] = [];
  const skippedFiles: AIPackageSkippedFile[] = [];

  for (const entry of rawChanges) {
    const result = classifyPackageReplacement(rootPath, entry.filePath, entry.status);
    if (result.packageable) packageableFiles.push(entry.filePath);
    else if (result.skipped) skippedFiles.push(result.skipped);
  }

  packageableFiles.sort((a, b) => a.localeCompare(b));
  skippedFiles.sort((a, b) => a.path.localeCompare(b.path));
  const counts = emptyPackageCounts();
  counts.changed = changedFiles.length;
  counts.packageable = packageableFiles.length;
  counts.skipped = skippedFiles.length;
  for (const file of skippedFiles) counts[file.category] += 1;

  return {
    isRepository: true,
    changedFiles,
    packageableFiles,
    skippedFiles,
    counts,
    message: packageableFiles.length
      ? `${packageableFiles.length} packageable file${packageableFiles.length === 1 ? "" : "s"} ready; ${skippedFiles.length} skipped safely.`
      : changedFiles.length
        ? "Workspace changes were found, but none are packageable replacement files."
        : "No workspace changes were detected.",
  };
}

function packageReadme(input: {
  packageId: string;
  projectName: string;
  developerRequest: string;
  files: string[];
  installCommand: string;
  buildCommand: string;
  suggestedCommitMessage: string;
  warnings: string[];
}) {
  const fileList = input.files.map((file) => `- ${file}`).join("\n");
  const warningList = input.warnings.length
    ? input.warnings.map((warning) => `- ${warning}`).join("\n")
    : "- No warnings.";

  return `# ${input.packageId}

AI Package Builder export for ${input.projectName}.

## Developer Request

${input.developerRequest.trim()}

## Included Replacement Files

${fileList}

## Suggested Install Command

\`\`\`powershell
${input.installCommand}
\`\`\`

## Suggested Build Command

\`\`\`powershell
${input.buildCommand}
\`\`\`

## Suggested Git Commit Message

\`\`\`text
${input.suggestedCommitMessage}
\`\`\`

## Manual Test Checklist

- Install the package with the standard Workflow Studio package installer.
- Run the suggested build command.
- Open Workflow Studio and confirm the changed feature still loads.
- Confirm existing Dashboard, Projects, Packages, Documentation, AI, AI Development, Git, Templates, and Settings pages still render.
- Review the changed files before committing.

## Validation Notes

${warningList}
`;
}

function validateGeneratedPackage(packagePath: string) {
  const manifestPath = path.join(packagePath, "manifest.json");
  const readmePath = path.join(packagePath, "README.md");
  const warnings: string[] = [];

  if (!fs.existsSync(manifestPath)) warnings.push("manifest.json is missing.");
  if (!fs.existsSync(readmePath)) warnings.push("README.md is missing.");

  if (!fs.existsSync(manifestPath)) return warnings;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    files?: Array<{ source?: string; target?: string }>;
  };

  if (!manifest.files?.length) warnings.push("manifest files array is empty.");

  for (const file of manifest.files ?? []) {
    if (!file.source || !file.target) {
      warnings.push("A manifest file entry is missing source or target.");
      continue;
    }

    if (!fs.existsSync(path.join(packagePath, file.source))) {
      warnings.push(`Source file is missing: ${file.source}.`);
    }
  }

  return warnings;
}

function createAIPackage(input: AIPackageBuilderInput): AIPackageBuilderResult {
  const rootPath = normalizeRoot(input.rootPath);
  const developerRequest = input.developerRequest.trim();
  const warnings: string[] = [];

  if (!developerRequest) {
    return {
      ok: false,
      message: "Developer Request is required before building a package.",
      warnings: ["No Developer Request was provided."],
      safetyState: "blocked",
      validationSummary: "Blocked: package generation needs a Developer Request."
    };
  }

  if (!exists(rootPath, ".git")) {
    return {
      ok: false,
      message: "AI Package Builder needs a Git workspace so it can detect changed files safely.",
      warnings: ["Git repository was not detected."],
      safetyState: "blocked",
      validationSummary: "Blocked: Git is required to identify safe replacement files."
    };
  }

  const analysis = scanWorkspace(rootPath);
  const readiness = getAIPackageReadiness(rootPath);
  const safeChanges = readiness.packageableFiles;
  const skippedChanges = readiness.skippedFiles;

  if (skippedChanges.length) {
    warnings.push(`Skipped ${skippedChanges.length} generated, protected, deleted, missing, or unsupported changed file${skippedChanges.length === 1 ? "" : "s"}.`);
  }

  if (!safeChanges.length) {
    return {
      ok: false,
      message: "No safe changed replacement files were found, so no package was created.",
      files: [],
      warnings: [
        ...warnings,
        "Make a safe source or documentation change, then run AI Package Builder again.",
      ],
      skippedFiles: skippedChanges,
      safetyState: "blocked",
      validationSummary: "Blocked: no safe changed replacement files were found."
    };
  }

  const fallbackId = `${analysis.projectName}-ai-package-${safeTimestamp()}`;
  const packageId = sanitizePackageId(input.packageId ?? "", fallbackId);
  const packagePath = path.join(rootPath, "_packages", packageId);
  const filesRoot = path.join(packagePath, "files");
  const suggestedCommitMessage = developerRequest.split(/\r?\n/)[0]?.replace(/^#+\s*/, "").slice(0, 72) || `Apply ${packageId}`;
  const buildCommand = analysis.buildCommand ?? "npm run build";
  const installCommand = `.\\tools\\package\\install-package.ps1 "${packagePath}"`;

  fs.rmSync(packagePath, { recursive: true, force: true });
  fs.mkdirSync(filesRoot, { recursive: true });

  for (const relativePath of safeChanges) {
    const source = path.join(rootPath, relativePath);
    const target = path.join(filesRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }

  const manifest = {
    packageId,
    name: packageId,
    version: "1.0.0",
    targetProject: analysis.projectName,
    description: `AI Package Builder export for ${analysis.projectName}.`,
    generatedBy: "Workflow Studio AI Package Builder",
    generatedAt: new Date().toISOString(),
    developerRequest,
    files: safeChanges.map((relativePath) => ({
      source: path.join("files", relativePath).replace(/\\/g, "/"),
      target: relativePath.replace(/\\/g, "/"),
    })),
    suggestedInstallCommand: installCommand,
    suggestedBuildCommand: buildCommand,
    suggestedCommitMessage,
    manualTestChecklist: [
      "Install the package with the standard Workflow Studio installer.",
      "Run the suggested build command.",
      "Open Workflow Studio and confirm the changed feature still loads.",
      "Review the changed files before committing.",
    ],
    validation: {
      requiresChangedFiles: true,
      skippedChanges: skippedChanges.map((file) => ({ path: file.path, reason: file.reason, category: file.category })),
      warnings,
    },
  };

  writeJson(path.join(packagePath, "manifest.json"), manifest);
  fs.writeFileSync(
    path.join(packagePath, "README.md"),
    packageReadme({
      packageId,
      projectName: analysis.projectName,
      developerRequest,
      files: safeChanges,
      installCommand,
      buildCommand,
      suggestedCommitMessage,
      warnings,
    }),
    "utf8",
  );

  const validationWarnings = validateGeneratedPackage(packagePath);

  if (validationWarnings.length) {
    return {
      ok: false,
      message: "Package structure validation failed.",
      packageId,
      packagePath,
      files: safeChanges,
      warnings: [...warnings, ...validationWarnings],
      skippedFiles: skippedChanges,
      safetyState: "blocked",
      validationSummary: "Blocked: generated package structure did not pass validation.",
    };
  }

  return {
    ok: true,
    message: `Created installable package: ${packageId}`,
    packageId,
    packagePath,
    files: safeChanges,
    installCommand,
    buildCommand,
    suggestedCommitMessage,
    warnings,
    skippedFiles: skippedChanges,
    safetyState: warnings.length ? "warning" : "safe",
    validationSummary: warnings.length
      ? "Package created with warnings. Review skipped files before installing."
      : "Package structure validated and ready to install.",
  };
}


type ImportedPackageFile = {
  source: string;
  target: string;
  exists: boolean;
};

type ImportedPackageResult = {
  ok: boolean;
  canceled?: boolean;
  message: string;
  sourcePath?: string;
  packagePath?: string;
  packageId?: string;
  targetProject?: string;
  description?: string;
  generatedAt?: string;
  suggestedInstallCommand?: string;
  suggestedBuildCommand?: string;
  suggestedCommitMessage?: string;
  files: ImportedPackageFile[];
  warnings: string[];
  safetyState: "safe" | "warning" | "blocked";
};

function resolveImportedPackageRoot(candidatePath: string): string | null {
  if (fs.existsSync(path.join(candidatePath, "manifest.json"))) return candidatePath;
  if (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isDirectory()) return null;
  const children = fs.readdirSync(candidatePath, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  if (children.length === 1) {
    const nested = path.join(candidatePath, children[0].name);
    if (fs.existsSync(path.join(nested, "manifest.json"))) return nested;
  }
  return null;
}

function extractPackageZip(rootPath: string, zipPath: string): string {
  const intakeRoot = path.join(rootPath, ".workflowstudio", "temp", "package-intake");
  const destination = path.join(intakeRoot, `${safeTimestamp()}-${path.basename(zipPath, path.extname(zipPath))}`);
  fs.mkdirSync(destination, { recursive: true });

  if (process.platform !== "win32") {
    throw new Error("ZIP intake currently requires Windows. Import an extracted package folder instead.");
  }

  const escapedZip = zipPath.replace(/'/g, "''");
  const escapedDestination = destination.replace(/'/g, "''");
  execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedDestination}' -Force"`, {
    windowsHide: true,
    stdio: "pipe",
  });
  return destination;
}

function inspectImportedPackage(rootPath: string, sourcePath: string): ImportedPackageResult {
  const warnings: string[] = [];
  let candidatePath = sourcePath;

  try {
    if (path.extname(sourcePath).toLowerCase() === ".zip") {
      candidatePath = extractPackageZip(rootPath, sourcePath);
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Unable to extract the selected package ZIP.",
      sourcePath,
      files: [],
      warnings: ["The selected ZIP could not be extracted safely."],
      safetyState: "blocked",
    };
  }

  const packagePath = resolveImportedPackageRoot(candidatePath);
  if (!packagePath) {
    return {
      ok: false,
      message: "The selected item is not a valid Workflow Studio package.",
      sourcePath,
      files: [],
      warnings: ["manifest.json was not found at the package root."],
      safetyState: "blocked",
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(packagePath, "manifest.json"), "utf8")) as {
      packageId?: string;
      name?: string;
      targetProject?: string;
      description?: string;
      generatedAt?: string;
      suggestedInstallCommand?: string;
      suggestedBuildCommand?: string;
      suggestedCommitMessage?: string;
      files?: Array<{ source?: string; target?: string }>;
    };

    const files: ImportedPackageFile[] = (manifest.files ?? []).map((file) => {
      const source = file.source ?? "";
      const target = file.target ?? "";
      const normalizedSource = source.replace(/\\/g, "/");
      const exists = Boolean(source && fs.existsSync(path.join(packagePath, source)));
      if (!source || !target) warnings.push("A manifest file entry is missing source or target.");
      else if (!exists) warnings.push(`Replacement file is missing: ${normalizedSource}.`);
      if (target.startsWith("/") || target.includes("..")) warnings.push(`Unsafe target path was blocked: ${target}.`);
      return { source: normalizedSource, target: target.replace(/\\/g, "/"), exists };
    });

    if (!files.length) warnings.push("The manifest does not contain replacement files.");
    if (!fs.existsSync(path.join(packagePath, "README.md"))) warnings.push("README.md is missing.");

    const blocked = warnings.some((warning) => /missing source or target|Replacement file is missing|Unsafe target path|does not contain replacement/.test(warning));
    const installCommand = `.\\tools\\package\\install-package.ps1 "${packagePath}"`;

    return {
      ok: !blocked,
      message: blocked ? "Package validation found blocking problems." : warnings.length ? "Package imported with warnings." : "Package imported and validated successfully.",
      sourcePath,
      packagePath,
      packageId: manifest.packageId ?? manifest.name ?? path.basename(packagePath),
      targetProject: manifest.targetProject,
      description: manifest.description,
      generatedAt: manifest.generatedAt,
      suggestedInstallCommand: manifest.suggestedInstallCommand ?? installCommand,
      suggestedBuildCommand: manifest.suggestedBuildCommand,
      suggestedCommitMessage: manifest.suggestedCommitMessage,
      files,
      warnings,
      safetyState: blocked ? "blocked" : warnings.length ? "warning" : "safe",
    };
  } catch (error) {
    return {
      ok: false,
      message: "manifest.json could not be read.",
      sourcePath,
      packagePath,
      files: [],
      warnings: [error instanceof Error ? error.message : "Manifest parsing failed."],
      safetyState: "blocked",
    };
  }
}

async function importGeneratedPackage(rootPathInput?: string, sourcePathInput?: string): Promise<ImportedPackageResult> {
  const rootPath = normalizeRoot(rootPathInput);
  let sourcePath = sourcePathInput;

  if (!sourcePath) {
    const selected = await dialog.showOpenDialog({
      title: "Import Generated Package",
      properties: ["openFile", "openDirectory"],
      filters: [{ name: "Workflow Studio Packages", extensions: ["zip"] }],
    });
    if (selected.canceled || selected.filePaths.length === 0) {
      return { ok: false, canceled: true, message: "Package import canceled.", files: [], warnings: [], safetyState: "blocked" };
    }
    sourcePath = selected.filePaths[0];
  }

  return inspectImportedPackage(rootPath, sourcePath);
}

async function openAISnapshotFolder(rootPathInput?: string): Promise<OpenPathResult> {
  const rootPath = normalizeRoot(rootPathInput);
  const folder = snapshotRoot(rootPath);
  fs.mkdirSync(folder, { recursive: true });
  const result = await shell.openPath(folder);

  return {
    ok: result.length === 0,
    message: result.length === 0 ? "Opened AI snapshot folder." : result,
  };
}




type DevelopmentPipelineResult = {
  ok: boolean;
  message: string;
  install: { status: "completed" | "failed" | "skipped"; output: string };
  build: { status: "completed" | "failed" | "skipped"; command?: string; output: string };
  suggestedCommitMessage?: string;
  completedAt: string;
};

function runDevelopmentPipeline(rootPathInput: string | undefined, packagePathInput: string | undefined, suggestedCommitMessage?: string): DevelopmentPipelineResult {
  const rootPath = normalizeRoot(rootPathInput);
  const packagePath = packagePathInput ? path.resolve(packagePathInput) : "";
  const completedAt = new Date().toISOString();
  const failed = (message: string, installOutput = "", buildOutput = ""): DevelopmentPipelineResult => ({
    ok: false, message, completedAt, suggestedCommitMessage,
    install: { status: installOutput ? "failed" : "skipped", output: installOutput },
    build: { status: buildOutput ? "failed" : "skipped", output: buildOutput },
  });

  if (!packagePath || !fs.existsSync(path.join(packagePath, "manifest.json"))) return failed("Select a validated package before running the pipeline.");
  const installerPath = path.join(rootPath, "tools", "package", "install-package.ps1");
  if (!fs.existsSync(installerPath)) return failed("The standard package installer was not found in this workspace.");

  let installOutput = "";
  try {
    installOutput = execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", installerPath, packagePath], { cwd: rootPath, encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    const detail = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string };
    installOutput = `${detail.stdout ?? ""}${detail.stderr ?? ""}${detail.message ?? ""}`.trim();
    return failed("Package installation failed. The build was not started.", installOutput);
  }

  const analysis = scanWorkspace(rootPath);
  const buildCommand = analysis.workspaceCommands.find((command) => command.category === "build" && command.permission === "safe");
  if (!buildCommand) return { ok: true, message: "Package installed. No safe build command was detected.", completedAt, suggestedCommitMessage, install: { status: "completed", output: installOutput }, build: { status: "skipped", output: "No safe build command detected." } };

  const tokens = tokenizeCommand(buildCommand.command);
  let buildOutput = "";
  try {
    buildOutput = execFileSync(executableForPlatform(tokens[0]), tokens.slice(1), { cwd: resolveCommandWorkingDirectory(rootPath, buildCommand), encoding: "utf8", windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" } });
  } catch (error) {
    const detail = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string };
    buildOutput = `${detail.stdout ?? ""}${detail.stderr ?? ""}${detail.message ?? ""}`.trim();
    return { ok: false, message: "Package installed, but the build failed.", completedAt, suggestedCommitMessage, install: { status: "completed", output: installOutput }, build: { status: "failed", command: buildCommand.command, output: buildOutput } };
  }

  return { ok: true, message: "Package installed and the build passed.", completedAt, suggestedCommitMessage, install: { status: "completed", output: installOutput }, build: { status: "completed", command: buildCommand.command, output: buildOutput } };
}

type DeveloperWorkflowResult = {
  ok: boolean;
  message: string;
  path?: string;
  details?: string[];
};

type DeveloperValidationCheck = {
  id: string;
  label: string;
  status: "passed" | "warning" | "failed";
  detail: string;
};

type DeveloperValidationReport = {
  ok: boolean;
  score: number;
  checks: DeveloperValidationCheck[];
  generatedAt: string;
};

async function openDeveloperPath(folderPath: string, label: string): Promise<DeveloperWorkflowResult> {
  fs.mkdirSync(folderPath, { recursive: true });
  const error = await shell.openPath(folderPath);
  return error
    ? { ok: false, message: `Unable to open ${label}: ${error}`, path: folderPath }
    : { ok: true, message: `Opened ${label}.`, path: folderPath };
}

function validateDeveloperWorkspace(rootPathInput?: string): DeveloperValidationReport {
  const rootPath = normalizeRoot(rootPathInput);
  const analysis = scanWorkspace(rootPath);
  const checks: DeveloperValidationCheck[] = [
    { id: "root", label: "Workspace root", status: fs.existsSync(rootPath) ? "passed" : "failed", detail: rootPath },
    { id: "metadata", label: "Project metadata", status: analysis.hasWorkflowMetadata ? "passed" : "warning", detail: analysis.hasWorkflowMetadata ? "Detected .workflowstudio/project.json." : "Project metadata was not detected." },
    { id: "git", label: "Git repository", status: analysis.hasGit ? "passed" : "warning", detail: analysis.hasGit ? "Git repository detected." : "Git repository was not detected." },
    { id: "documentation", label: "Documentation", status: analysis.hasDocs ? "passed" : "warning", detail: analysis.hasDocs ? "Documentation folders detected." : "Documentation folder was not detected." },
    { id: "build", label: "Build command", status: analysis.buildCommand ? "passed" : "warning", detail: analysis.buildCommand ?? "Build command was not detected." },
  ];
  const passed = checks.filter((check) => check.status === "passed").length;
  const failed = checks.some((check) => check.status === "failed");
  return { ok: !failed, score: Math.round((passed / checks.length) * 100), checks, generatedAt: new Date().toISOString() };
}

function cleanDeveloperSnapshotStaging(): DeveloperWorkflowResult {
  const stagingRoot = path.join(app.getPath("temp"), "workflow-studio-ai-snapshots");
  try {
    fs.rmSync(stagingRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    return { ok: true, message: "Snapshot staging was cleaned.", path: stagingRoot };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to clean snapshot staging.", path: stagingRoot };
  }
}

ipcMain.handle("developer:openDownloads", () => openDeveloperPath(app.getPath("downloads"), "Downloads"));
ipcMain.handle("developer:openPackageFolder", (_event, rootPath?: string) => openDeveloperPath(path.join(normalizeRoot(rootPath), "_packages"), "package folder"));
ipcMain.handle("developer:openBackupFolder", (_event, rootPath?: string) => openDeveloperPath(path.join(normalizeRoot(rootPath), "_backup"), "backup folder"));
ipcMain.handle("developer:cleanSnapshotStaging", () => cleanDeveloperSnapshotStaging());
ipcMain.handle("developer:validateWorkspace", (_event, rootPath?: string) => validateDeveloperWorkspace(rootPath));
ipcMain.handle("workspace:runCommand", (event, rootPath: string | undefined, commandId: string, approvedPermission?: "interactive" | "device-changing") =>
  runWorkspaceCommand(event.sender, rootPath, commandId, approvedPermission),
);
ipcMain.handle("workspace:cancelCommand", (_event, executionId: string) => cancelWorkspaceCommand(executionId));
ipcMain.handle("workspace:scan", (_event, rootPath?: string) => scanWorkspace(rootPath));
ipcMain.handle("workspace:gitStatus", (_event, rootPath?: string) => getGitStatus(rootPath));
ipcMain.handle("workspace:listDocumentation", (_event, rootPath?: string) => listDocumentation(rootPath));
ipcMain.handle("workspace:listPackages", (_event, rootPath?: string) => listPackages(rootPath));
ipcMain.handle("workspace:getPackageTree", (_event, rootPath?: string) => buildPackageTree(rootPath));
ipcMain.handle("workspace:listTemplates", (_event, rootPath?: string) => listTemplates(rootPath));
ipcMain.handle("workspace:listProjectTimeline", (_event, rootPath?: string) => listProjectTimeline(rootPath));
ipcMain.handle("workspace:createAISnapshot", (_event, rootPath?: string) => createAISnapshot(rootPath));
ipcMain.handle("workspace:listAISnapshots", (_event, rootPath?: string) => listAISnapshots(rootPath));
ipcMain.handle("workspace:openAISnapshotFolder", (_event, rootPath?: string) => openAISnapshotFolder(rootPath));
ipcMain.handle("workspace:getAIPackageReadiness", (_event, rootPath?: string) => getAIPackageReadiness(rootPath));
ipcMain.handle("workspace:createAIPackage", (_event, input: AIPackageBuilderInput) => createAIPackage(input));
ipcMain.handle("workspace:importGeneratedPackage", (_event, rootPath?: string, sourcePath?: string) => importGeneratedPackage(rootPath, sourcePath));
ipcMain.handle("workspace:runDevelopmentPipeline", (_event, rootPath?: string, packagePath?: string, suggestedCommitMessage?: string) => runDevelopmentPipeline(rootPath, packagePath, suggestedCommitMessage));
ipcMain.handle("workspace:openPath", (_event, rootPath: string | undefined, relativePath: string) =>
  openWorkspacePath(rootPath, relativePath),
);
ipcMain.handle("workspace:openFolder", async () => {
  const result = await dialog.showOpenDialog({
    title: "Open Workspace Folder",
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  return scanWorkspace(result.filePaths[0]);
});

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
