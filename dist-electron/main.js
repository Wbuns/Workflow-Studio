import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawn } from "node:child_process";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;
const defaultWorkspaceRoot = path.resolve(__dirname, "..");
const runningWorkspaceCommands = new Map();
const allowedExecutables = new Set(["npm", "npm.cmd", "pnpm", "pnpm.cmd", "yarn", "yarn.cmd", "pio", "pio.exe", "platformio", "platformio.exe", "python", "python.exe", "py", "py.exe", "cargo", "cargo.exe", "cmake", "cmake.exe"]);
function tokenizeCommand(command) {
    const tokens = command.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    return tokens.map((token) => token.startsWith('"') && token.endsWith('"') ? token.slice(1, -1) : token);
}
function executableForPlatform(executable) {
    if (process.platform !== "win32")
        return executable;
    if (["npm", "pnpm", "yarn"].includes(executable))
        return `${executable}.cmd`;
    return executable;
}
function emitCommandOutput(target, executionId, stream, text) {
    target.send("workspace:commandOutput", { executionId, stream, text, timestamp: new Date().toISOString() });
}
function resolveCommandWorkingDirectory(rootPath, command) {
    const candidate = path.resolve(rootPath, command.workingDirectory ?? ".");
    const relative = path.relative(rootPath, candidate);
    if (relative.startsWith("..") || path.isAbsolute(relative))
        throw new Error("Command working directory is outside the workspace.");
    return candidate;
}
function runWorkspaceCommand(target, rootPathInput, commandId, approvedPermission) {
    const rootPath = normalizeRoot(rootPathInput);
    const analysis = scanWorkspace(rootPath);
    const command = analysis.workspaceCommands.find((entry) => entry.id === commandId);
    if (!command)
        throw new Error("Workspace command is no longer available. Run project analysis and try again.");
    if (command.permission === "blocked")
        throw new Error("This command is blocked from native execution.");
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
    if (tokens.length === 0)
        throw new Error("Command is empty.");
    const executable = executableForPlatform(tokens[0]);
    if (!allowedExecutables.has(executable.toLowerCase()))
        throw new Error(`Executable is not approved: ${tokens[0]}`);
    const executionId = `command-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const execution = {
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
    child.stdout.on("data", (chunk) => emitCommandOutput(target, executionId, "stdout", chunk.toString()));
    child.stderr.on("data", (chunk) => emitCommandOutput(target, executionId, "stderr", chunk.toString()));
    child.on("error", (error) => emitCommandOutput(target, executionId, "stderr", `${error.message}\n`));
    child.on("close", (code, signal) => {
        const running = runningWorkspaceCommands.get(executionId);
        if (!running)
            return;
        if (running.execution.status !== "cancelled")
            running.execution.status = code === 0 ? "completed" : "failed";
        running.execution.exitCode = code ?? undefined;
        running.execution.finishedAt = new Date().toISOString();
        running.execution.message = signal ? `Stopped by ${signal}.` : code === 0 ? "Command completed successfully." : `Command exited with code ${code ?? "unknown"}.`;
        emitCommandOutput(target, executionId, "system", `\n${running.execution.message}\n`);
        runningWorkspaceCommands.delete(executionId);
    });
    return execution;
}
function cancelWorkspaceCommand(executionId) {
    const running = runningWorkspaceCommands.get(executionId);
    if (!running)
        return { ok: false, message: "Command is not running." };
    running.execution.status = "cancelled";
    const stopped = running.child.kill();
    return { ok: stopped, message: stopped ? "Cancellation requested." : "Unable to stop command." };
}
function normalizeRoot(rootPath) {
    if (!rootPath || rootPath.trim() === ".")
        return defaultWorkspaceRoot;
    return path.resolve(rootPath);
}
function exists(rootPath, relativePath) {
    return fs.existsSync(path.join(rootPath, relativePath));
}
function findFirstExisting(rootPath, paths) {
    return paths.find((candidate) => exists(rootPath, candidate));
}
function readJson(rootPath, relativePath) {
    const filePath = path.join(rootPath, relativePath);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
    catch (error) {
        console.warn(`Unable to read JSON file: ${relativePath}`, error);
        return null;
    }
}
function writeJson(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
function detectPackageManager(rootPath, applicationRootPath = rootPath) {
    if (fs.existsSync(path.join(applicationRootPath, "pnpm-lock.yaml")) || exists(rootPath, "pnpm-lock.yaml"))
        return "pnpm";
    if (fs.existsSync(path.join(applicationRootPath, "yarn.lock")) || exists(rootPath, "yarn.lock"))
        return "yarn";
    if (fs.existsSync(path.join(applicationRootPath, "package-lock.json")) || exists(rootPath, "package-lock.json"))
        return "npm";
    return fs.existsSync(path.join(applicationRootPath, "package.json")) || exists(rootPath, "package.json") ? "npm" : "unknown";
}
function discoverPackageJson(workspaceRoot) {
    const rootPackageJson = readJson(workspaceRoot, "package.json");
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
        const packageJson = readJson(workspaceRoot, relativePath);
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
            const packageJson = readJson(workspaceRoot, relativePath);
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
function scriptCommand(packageManager, scriptName) {
    const runner = packageManager === "unknown" ? "npm" : packageManager;
    return `${runner} run ${scriptName}`;
}
function detectProjectType(rootPath, packageJson, applicationRootPath = rootPath) {
    const dependencies = {
        ...packageJson?.dependencies,
        ...packageJson?.devDependencies,
    };
    const hasElectron = Boolean(dependencies.electron) || exists(rootPath, "electron") || fs.existsSync(path.join(applicationRootPath, "electron"));
    const hasReact = Boolean(dependencies.react);
    const hasTypeScript = Boolean(dependencies.typescript) || exists(rootPath, "tsconfig.json") || fs.existsSync(path.join(applicationRootPath, "tsconfig.json"));
    if (hasElectron && hasReact && hasTypeScript)
        return "electron-react-typescript";
    if (hasElectron)
        return "electron";
    if (hasReact)
        return "react";
    if (packageJson)
        return "node";
    if (exists(rootPath, "pyproject.toml") || exists(rootPath, "requirements.txt") || fs.existsSync(path.join(applicationRootPath, "pyproject.toml")) || fs.existsSync(path.join(applicationRootPath, "requirements.txt")))
        return "python";
    return "unknown";
}
function detectDocumentationPaths(rootPath, readmePath) {
    const paths = [];
    if (readmePath)
        paths.push(readmePath);
    if (exists(rootPath, "docs"))
        paths.push("docs");
    if (exists(rootPath, "Documentation"))
        paths.push("Documentation");
    if (exists(rootPath, "CHANGELOG.md"))
        paths.push("CHANGELOG.md");
    if (exists(rootPath, "Roadmap.md"))
        paths.push("Roadmap.md");
    if (exists(rootPath, "prompts"))
        paths.push("prompts");
    if (exists(rootPath, "templates"))
        paths.push("templates");
    return paths;
}
function collectMatchingPaths(rootPath, folders, pattern) {
    const matches = [];
    for (const folder of folders) {
        const absoluteFolder = path.join(rootPath, folder);
        if (!fs.existsSync(absoluteFolder) || !fs.statSync(absoluteFolder).isDirectory())
            continue;
        const visit = (currentFolder) => {
            for (const entry of fs.readdirSync(currentFolder, { withFileTypes: true })) {
                const absolutePath = path.join(currentFolder, entry.name);
                const relativePath = path.relative(rootPath, absolutePath);
                if (entry.isDirectory())
                    visit(absolutePath);
                else if (pattern.test(relativePath.replace(/\\/g, "/")))
                    matches.push(relativePath);
            }
        };
        visit(absoluteFolder);
    }
    return matches.sort((a, b) => a.localeCompare(b));
}
function parsePlatformIoConfig(rootPath, relativePath) {
    const text = fs.readFileSync(path.join(rootPath, relativePath), "utf8");
    const environments = [];
    const boards = new Set();
    const frameworks = new Set();
    const platforms = new Set();
    let currentEnvironment;
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.replace(/[;#].*$/, "").trim();
        if (!line)
            continue;
        const section = line.match(/^\[env:([^\]]+)\]$/i);
        if (section) {
            currentEnvironment = section[1].trim();
            environments.push(currentEnvironment);
            continue;
        }
        if (!currentEnvironment)
            continue;
        const property = line.match(/^([^=]+)=(.+)$/);
        if (!property)
            continue;
        const key = property[1].trim().toLowerCase();
        const values = property[2].split(",").map((value) => value.trim()).filter(Boolean);
        if (key === "board")
            values.forEach((value) => boards.add(value));
        if (key === "framework")
            values.forEach((value) => frameworks.add(value));
        if (key === "platform")
            values.forEach((value) => platforms.add(value));
    }
    return { environments, boards: [...boards], frameworks: [...frameworks], platforms: [...platforms] };
}
function hasTrackedGeneratedEmbeddedOutput(rootPath) {
    if (!exists(rootPath, ".git"))
        return false;
    try {
        const tracked = runGit(rootPath, "ls-files .pio build firmware/build");
        return tracked.length > 0;
    }
    catch {
        return false;
    }
}
function analyzeEmbeddedWorkspace(rootPath, workflowProject) {
    const platformioConfigPath = findFirstExisting(rootPath, ["platformio.ini", "firmware/platformio.ini"]);
    const firmwareSourcePath = findFirstExisting(rootPath, [
        "src/main.cpp",
        "firmware/src/main.cpp",
        "firmware/main/main.cpp",
        "main/main.cpp",
    ]);
    const hasEmbeddedFolders = ["firmware", "include", "lib", "boards"].some((folder) => exists(rootPath, folder));
    if (!platformioConfigPath && !firmwareSourcePath && !hasEmbeddedFolders)
        return undefined;
    const parsed = platformioConfigPath
        ? parsePlatformIoConfig(rootPath, platformioConfigPath)
        : { environments: [], boards: [], frameworks: [], platforms: [] };
    const primaryEnvironment = parsed.environments[0];
    const environmentSuffix = primaryEnvironment ? ` -e ${primaryEnvironment}` : "";
    const metadata = (workflowProject?.embedded ?? workflowProject);
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
function buildWorkspaceCommands(packageScripts, packageManager, applicationRelativePath, embedded, workflowProject) {
    const commands = [];
    const workingDirectory = applicationRelativePath && applicationRelativePath !== "." ? applicationRelativePath : undefined;
    const add = (command) => {
        if (!command || commands.some((item) => item.id === command.id || item.command === command.command))
            return;
        const permission = command.id === "embedded:upload"
            ? "device-changing"
            : command.interactive
                ? "interactive"
                : command.source === "metadata" || command.id === "workspace:analysis"
                    ? "blocked"
                    : "safe";
        commands.push({ ...command, permission });
    };
    for (const script of packageScripts) {
        const category = script.name === "build" ? "build" : script.name === "test" ? "test" : script.name === "dev" || script.name === "start" ? "development" : "maintenance";
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
    if (embedded?.buildCommand)
        add({ id: "embedded:build", label: "Build firmware", command: embedded.buildCommand, category: "build", description: "Compile firmware for the selected PlatformIO environment.", source: "platformio", workingDirectory });
    if (embedded?.uploadCommand)
        add({ id: "embedded:upload", label: "Upload firmware", command: embedded.uploadCommand, category: "embedded", description: "Upload firmware to the connected embedded device.", source: "platformio", workingDirectory, destructive: true });
    if (embedded?.serialMonitorCommand)
        add({ id: "embedded:monitor", label: "Open serial monitor", command: embedded.serialMonitorCommand, category: "embedded", description: "Open an interactive serial monitor for the selected environment.", source: "platformio", workingDirectory, interactive: true });
    if (embedded?.cleanCommand)
        add({ id: "embedded:clean", label: "Clean firmware build", command: embedded.cleanCommand, category: "maintenance", description: "Remove generated PlatformIO build output.", source: "platformio", workingDirectory, destructive: true });
    const metadataCommands = workflowProject?.commands;
    if (Array.isArray(metadataCommands)) {
        metadataCommands.forEach((value, index) => {
            if (!value || typeof value !== "object")
                return;
            const record = value;
            if (typeof record.command !== "string" || typeof record.label !== "string")
                return;
            add({ id: typeof record.id === "string" ? record.id : `metadata:${index}`, label: record.label, command: record.command, category: "maintenance", description: typeof record.description === "string" ? record.description : "Project metadata command.", source: "metadata", workingDirectory });
        });
    }
    add({ id: "workspace:analysis", label: "Run project analysis", command: "Workflow Studio Analysis", category: "analysis", description: "Refresh workspace detection, health checks, and command profiles.", source: "detected" });
    return commands;
}
function capability(id, label, enabled, enabledDetail, disabledDetail) {
    return {
        id,
        label,
        enabled,
        detail: enabled ? enabledDetail : disabledDetail,
    };
}
function scanWorkspace(rootPathInput) {
    const workspaceRoot = normalizeRoot(rootPathInput);
    const packageDiscovery = discoverPackageJson(workspaceRoot);
    const { packageJson, packageJsonPath, applicationRootPath, applicationRelativePath } = packageDiscovery;
    const workflowMetadataPath = findFirstExisting(workspaceRoot, [
        ".workflowstudio/project.json",
        ".workflowstudio/metadata.json",
    ]);
    const workflowProject = workflowMetadataPath
        ? readJson(workspaceRoot, workflowMetadataPath)
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
    const projectType = embedded?.platformioConfigPath ? "platformio" : embedded ? (hasEsp32 ? "esp32" : "embedded") : detectedProjectType;
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
    const successes = [];
    const warnings = [];
    if (hasGit)
        successes.push("Git repository detected.");
    else
        warnings.push("Git repository was not detected.");
    if (hasPackageJson)
        successes.push(`${packageJsonPath ?? "package.json"} detected.`);
    else
        warnings.push("package.json was not detected.");
    if (applicationRelativePath && applicationRelativePath !== ".")
        successes.push(`Application root detected: ${applicationRelativePath}.`);
    if (hasReadme)
        successes.push(`${readmePath} detected.`);
    else
        warnings.push("README.md was not detected.");
    if (hasDocs)
        successes.push("Documentation folder detected.");
    else
        warnings.push("Documentation folder was not detected.");
    if (hasWorkflowMetadata)
        successes.push(`${workflowMetadataPath} detected.`);
    else
        warnings.push("Workflow Studio metadata was not detected.");
    if (buildCommand)
        successes.push(`Build command detected: ${buildCommand}.`);
    else
        warnings.push("Build command was not detected.");
    if (devCommand)
        successes.push(`Development command detected: ${devCommand}.`);
    if (testCommand)
        successes.push(`Test command detected: ${testCommand}.`);
    else if (!embedded?.detected)
        warnings.push("Test command was not detected yet.");
    if (embedded?.detected) {
        successes.push("Embedded project structure detected.");
        if (embedded.platformioConfigPath)
            successes.push(`${embedded.platformioConfigPath} detected.`);
        else
            warnings.push("platformio.ini was not detected.");
        if (embedded.firmwareSourcePath)
            successes.push(`Firmware entry point detected: ${embedded.firmwareSourcePath}.`);
        else
            warnings.push("Firmware source entry point was not detected.");
        if (embedded.environments.length > 0)
            successes.push(`PlatformIO environment detected: ${embedded.environments.join(", ")}.`);
        else
            warnings.push("PlatformIO board environment was not defined.");
        if (embedded.boardIdentifiers.length > 0)
            successes.push(`Board target detected: ${embedded.boardIdentifiers.join(", ")}.`);
        else
            warnings.push("Embedded board identifier was not detected.");
        if (embedded.hardwareDocumentationPaths.length > 0 || embedded.specificationPaths.length > 0)
            successes.push("Hardware target documentation detected.");
        else
            warnings.push("Hardware target documentation was not detected.");
        if (embedded.generatedOutputTracked)
            warnings.push("Generated embedded build output appears to be tracked by Git.");
        else
            successes.push("No tracked embedded build output was detected.");
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
function runGit(rootPath, command) {
    return execSync(`git ${command}`, {
        cwd: rootPath,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
    }).trim();
}
function getGitStatus(rootPathInput) {
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
            summary: status === "clean"
                ? `Branch ${branch} is clean.`
                : `Branch ${branch} has ${changedFiles.length} changed file${changedFiles.length === 1 ? "" : "s"}.`,
        };
    }
    catch (error) {
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
function collectMarkdownFiles(rootPath, relativeFolder, kind, maxDepth = 4) {
    const folderPath = path.join(rootPath, relativeFolder);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory())
        return [];
    const results = [];
    function walk(currentRelativeFolder, depth) {
        if (depth > maxDepth)
            return;
        const currentFolder = path.join(rootPath, currentRelativeFolder);
        for (const entry of fs.readdirSync(currentFolder, { withFileTypes: true })) {
            if (entry.name.startsWith("."))
                continue;
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
function listDirectoryEntries(rootPath, relativeFolder) {
    const folderPath = path.join(rootPath, relativeFolder);
    if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
        return [];
    }
    return fs
        .readdirSync(folderPath, { withFileTypes: true })
        .filter((entry) => !entry.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name));
}
function listPackages(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const entries = [];
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
    const packageHistory = readJson(rootPath, ".workflowstudio/packages.json");
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
function buildPackageTree(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const roots = ["_packages", "_backup"];
    function walk(relativePath, depth = 0) {
        if (depth > 6)
            return [];
        const absolutePath = path.join(rootPath, relativePath);
        if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory())
            return [];
        return fs.readdirSync(absolutePath, { withFileTypes: true })
            .filter((entry) => !entry.name.startsWith("."))
            .sort((a, b) => {
            if (a.isDirectory() !== b.isDirectory())
                return a.isDirectory() ? -1 : 1;
            return a.name.localeCompare(b.name);
        })
            .map((entry) => {
            const childPath = path.join(relativePath, entry.name);
            return entry.isDirectory()
                ? { name: entry.name, path: childPath, kind: "folder", children: walk(childPath, depth + 1) }
                : { name: entry.name, path: childPath, kind: "file" };
        });
    }
    return roots
        .filter((relativePath) => fs.existsSync(path.join(rootPath, relativePath)))
        .map((relativePath) => ({
        name: relativePath,
        path: relativePath,
        kind: "folder",
        children: walk(relativePath),
    }));
}
function collectReusableFiles(rootPath, relativeFolder, kind) {
    return listDirectoryEntries(rootPath, relativeFolder)
        .filter((entry) => entry.isDirectory() || /\.(md|txt|json|tsx?|ps1)$/i.test(entry.name))
        .map((entry) => ({
        name: entry.name.replace(/\.(md|txt|json|tsx?|ps1)$/i, ""),
        path: path.join(relativeFolder, entry.name),
        kind,
        detail: entry.isDirectory() ? "Reusable folder" : "Reusable file",
    }));
}
function listTemplates(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    return [
        ...collectReusableFiles(rootPath, "templates", "template"),
        ...collectReusableFiles(rootPath, "prompts", "prompt"),
    ];
}
async function openWorkspacePath(rootPathInput, relativePath) {
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
function listDocumentation(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const entries = [];
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
function listProjectTimeline(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const events = [];
    const warnings = [];
    if (exists(rootPath, ".git")) {
        try {
            const raw = runGit(rootPath, "log -n 30 --pretty=format:%H%x1f%h%x1f%aI%x1f%s");
            for (const line of raw.split(/\r?\n/).filter(Boolean)) {
                const [hash, shortHash, occurredAt, subject] = line.split("\x1f");
                if (!hash || !occurredAt)
                    continue;
                events.push({
                    id: `git-${hash}`,
                    kind: "git",
                    title: subject || "Git commit",
                    detail: `Commit ${shortHash || hash.slice(0, 7)}`,
                    occurredAt,
                    status: "success",
                });
            }
        }
        catch (error) {
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
        }
        catch {
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
            if (entry.name.startsWith("."))
                continue;
            const entryPath = path.join(packagesRoot, entry.name);
            try {
                const stats = fs.statSync(entryPath);
                const manifestPath = entry.isDirectory() ? path.join(entryPath, "manifest.json") : "";
                let title = "Package created";
                let detail = entry.name;
                if (manifestPath && fs.existsSync(manifestPath)) {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
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
            }
            catch (error) {
                console.warn(`Unable to inspect package ${entry.name}.`, error);
            }
        }
    }
    const packageHistory = readJson(rootPath, ".workflowstudio/packages.json");
    for (const record of packageHistory?.packages ?? []) {
        if (!record.installedDate)
            continue;
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
function snapshotRoot(rootPath) {
    return path.join(rootPath, ".workflowstudio", "ai-snapshots");
}
function snapshotHistoryPath(rootPath) {
    return path.join(rootPath, ".workflowstudio", "ai-snapshots.json");
}
function listAISnapshots(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const historyFile = snapshotHistoryPath(rootPath);
    const snapshotsByPath = new Map();
    if (fs.existsSync(historyFile)) {
        try {
            const history = JSON.parse(fs.readFileSync(historyFile, "utf8"));
            for (const snapshot of history.snapshots ?? []) {
                snapshotsByPath.set(path.resolve(snapshot.filePath), snapshot);
            }
        }
        catch (error) {
            console.warn("Unable to read AI snapshot history.", error);
        }
    }
    const folder = snapshotRoot(rootPath);
    if (fs.existsSync(folder)) {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".zip"))
                continue;
            const filePath = path.join(folder, entry.name);
            const resolvedPath = path.resolve(filePath);
            if (snapshotsByPath.has(resolvedPath))
                continue;
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
function shouldExclude(relativePath) {
    const normalized = relativePath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    if (parts.some((part) => ["node_modules", "dist", ".git", "_backup", ".vite", "coverage"].includes(part))) {
        return true;
    }
    return /(^|\/).+\.log$/i.test(normalized);
}
function copyIfExists(workspaceRoot, stagingRoot, relativePath) {
    const source = path.join(workspaceRoot, relativePath);
    const target = path.join(stagingRoot, relativePath);
    if (!fs.existsSync(source))
        return false;
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
function shellEscapePowerShell(value) {
    return `'${value.replace(/'/g, "''")}'`;
}
function compressFolder(sourceFolder, destinationZip) {
    if (fs.existsSync(destinationZip))
        fs.rmSync(destinationZip, { force: true });
    const sourceGlob = path.join(sourceFolder, "*");
    const command = [
        "powershell",
        "-NoProfile",
        "-Command",
        `Compress-Archive -Path ${shellEscapePowerShell(sourceGlob)} -DestinationPath ${shellEscapePowerShell(destinationZip)} -Force`,
    ].join(" ");
    execSync(command, { stdio: "pipe" });
}
function createAISnapshot(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    if (!fs.existsSync(rootPath) || !fs.statSync(rootPath).isDirectory()) {
        return { ok: false, message: "Workspace folder does not exist." };
    }
    const analysis = scanWorkspace(rootPath);
    const timestamp = safeTimestamp();
    const snapshotName = `${analysis.projectName || path.basename(rootPath)}-AI-Snapshot-${timestamp}`.replace(/[^a-z0-9._-]+/gi, "-");
    const outputFolder = snapshotRoot(rootPath);
    const stagingFolder = path.join(outputFolder, "_staging", snapshotName);
    const destinationZip = path.join(outputFolder, `${snapshotName}.zip`);
    const includedRoots = [];
    fs.rmSync(stagingFolder, { recursive: true, force: true });
    fs.mkdirSync(stagingFolder, { recursive: true });
    fs.mkdirSync(outputFolder, { recursive: true });
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
        candidates.push(path.join(appRelative, "src"), path.join(appRelative, "electron"), path.join(appRelative, "package.json"), path.join(appRelative, "tsconfig.json"), path.join(appRelative, "tsconfig.app.json"), path.join(appRelative, "vite.config.ts"));
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
    compressFolder(stagingFolder, destinationZip);
    fs.rmSync(stagingFolder, { recursive: true, force: true });
    const snapshot = {
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
function sanitizePackageId(value, fallback) {
    const normalized = (value.trim() || fallback)
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return normalized || fallback;
}
function parseGitChangedFiles(rootPath) {
    const porcelain = runGit(rootPath, "status --short");
    if (!porcelain)
        return [];
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
function isSafePackageReplacement(relativePath) {
    const normalized = relativePath.replace(/\\/g, "/");
    const parts = normalized.split("/");
    if (path.isAbsolute(relativePath) || normalized.includes(".."))
        return false;
    if (parts.some((part) => [".git", "node_modules", "dist", "_backup", ".vite", "coverage", "ai-snapshots"].includes(part))) {
        return false;
    }
    if (normalized.startsWith("_packages/"))
        return false;
    if (normalized === ".workflowstudio/ai-snapshots.json")
        return false;
    return /\.(tsx?|jsx?|json|md|css|scss|html|ps1|yml|yaml|txt)$/i.test(normalized);
}
function getAIPackageReadiness(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    if (!exists(rootPath, ".git")) {
        return {
            isRepository: false,
            changedFiles: [],
            packageableFiles: [],
            skippedFiles: [],
            message: "Git status is required to identify packageable changes.",
        };
    }
    const rawChanges = parseGitChangedFiles(rootPath);
    const changedFiles = rawChanges.map((entry) => entry.filePath);
    const packageableFiles = rawChanges
        .filter((entry) => !entry.status.includes("D"))
        .map((entry) => entry.filePath)
        .filter((filePath) => isSafePackageReplacement(filePath))
        .filter((filePath) => {
        const candidate = path.join(rootPath, filePath);
        return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
    })
        .sort((a, b) => a.localeCompare(b));
    const skippedFiles = changedFiles.filter((filePath) => !packageableFiles.includes(filePath));
    return {
        isRepository: true,
        changedFiles,
        packageableFiles,
        skippedFiles,
        message: packageableFiles.length
            ? `${packageableFiles.length} safe replacement file${packageableFiles.length === 1 ? "" : "s"} ready.`
            : changedFiles.length
                ? "Workspace changes were found, but none are safe replacement files."
                : "No workspace changes were detected.",
    };
}
function packageReadme(input) {
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
function validateGeneratedPackage(packagePath) {
    const manifestPath = path.join(packagePath, "manifest.json");
    const readmePath = path.join(packagePath, "README.md");
    const warnings = [];
    if (!fs.existsSync(manifestPath))
        warnings.push("manifest.json is missing.");
    if (!fs.existsSync(readmePath))
        warnings.push("README.md is missing.");
    if (!fs.existsSync(manifestPath))
        return warnings;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    if (!manifest.files?.length)
        warnings.push("manifest files array is empty.");
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
function createAIPackage(input) {
    const rootPath = normalizeRoot(input.rootPath);
    const developerRequest = input.developerRequest.trim();
    const warnings = [];
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
        warnings.push(`Skipped ${skippedChanges.length} changed file${skippedChanges.length === 1 ? "" : "s"} that cannot be safely packaged as replacement files.`);
    }
    if (!safeChanges.length) {
        return {
            ok: false,
            message: "No safe changed replacement files were found, so no package was created.",
            files: [],
            warnings: [
                ...warnings,
                "Make the milestone code changes first, then run AI Package Builder again.",
            ],
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
            skippedChanges,
            warnings,
        },
    };
    writeJson(path.join(packagePath, "manifest.json"), manifest);
    fs.writeFileSync(path.join(packagePath, "README.md"), packageReadme({
        packageId,
        projectName: analysis.projectName,
        developerRequest,
        files: safeChanges,
        installCommand,
        buildCommand,
        suggestedCommitMessage,
        warnings,
    }), "utf8");
    const validationWarnings = validateGeneratedPackage(packagePath);
    if (validationWarnings.length) {
        return {
            ok: false,
            message: "Package structure validation failed.",
            packageId,
            packagePath,
            files: safeChanges,
            warnings: [...warnings, ...validationWarnings],
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
        safetyState: warnings.length ? "warning" : "safe",
        validationSummary: warnings.length
            ? "Package created with warnings. Review skipped files before installing."
            : "Package structure validated and ready to install.",
    };
}
async function openAISnapshotFolder(rootPathInput) {
    const rootPath = normalizeRoot(rootPathInput);
    const folder = snapshotRoot(rootPath);
    fs.mkdirSync(folder, { recursive: true });
    const result = await shell.openPath(folder);
    return {
        ok: result.length === 0,
        message: result.length === 0 ? "Opened AI snapshot folder." : result,
    };
}
ipcMain.handle("workspace:runCommand", (event, rootPath, commandId, approvedPermission) => runWorkspaceCommand(event.sender, rootPath, commandId, approvedPermission));
ipcMain.handle("workspace:cancelCommand", (_event, executionId) => cancelWorkspaceCommand(executionId));
ipcMain.handle("workspace:scan", (_event, rootPath) => scanWorkspace(rootPath));
ipcMain.handle("workspace:gitStatus", (_event, rootPath) => getGitStatus(rootPath));
ipcMain.handle("workspace:listDocumentation", (_event, rootPath) => listDocumentation(rootPath));
ipcMain.handle("workspace:listPackages", (_event, rootPath) => listPackages(rootPath));
ipcMain.handle("workspace:getPackageTree", (_event, rootPath) => buildPackageTree(rootPath));
ipcMain.handle("workspace:listTemplates", (_event, rootPath) => listTemplates(rootPath));
ipcMain.handle("workspace:listProjectTimeline", (_event, rootPath) => listProjectTimeline(rootPath));
ipcMain.handle("workspace:createAISnapshot", (_event, rootPath) => createAISnapshot(rootPath));
ipcMain.handle("workspace:listAISnapshots", (_event, rootPath) => listAISnapshots(rootPath));
ipcMain.handle("workspace:openAISnapshotFolder", (_event, rootPath) => openAISnapshotFolder(rootPath));
ipcMain.handle("workspace:getAIPackageReadiness", (_event, rootPath) => getAIPackageReadiness(rootPath));
ipcMain.handle("workspace:createAIPackage", (_event, input) => createAIPackage(input));
ipcMain.handle("workspace:openPath", (_event, rootPath, relativePath) => openWorkspacePath(rootPath, relativePath));
ipcMain.handle("workspace:openFolder", async () => {
    const result = await dialog.showOpenDialog({
        title: "Open Workspace Folder",
        properties: ["openDirectory"],
    });
    if (result.canceled || result.filePaths.length === 0)
        return null;
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
    }
    else {
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
