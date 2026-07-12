import { useEffect, useMemo, useState, type DragEvent } from "react";
import { createDevelopmentSession } from "../../services/DevelopmentSessionService";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";
import "./AIDevelopmentPage.css";
import {
  buildAIWorkspaceContext,
  copyText,
  createAIPackage,
  createAISnapshot,
  formatBytes,
  getGitStatus,
  getAIPackageReadiness,
  importGeneratedPackage,
  runDevelopmentPipeline,
  listAISnapshots,
  openAISnapshotFolder,
  scanWorkspace,
  type AIPackageBuilderResult,
  type AIPackageReadiness,
  type AIPackageSafetyState,
  type AISnapshotRecord,
  type GitStatus,
  type ImportedPackageResult,
  type WorkspaceAnalysis,
} from "./AIDevelopmentService";

type AIDevelopmentPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

type AIDevelopmentTab = "context" | "package" | "snapshots" | "history";
type SessionHistoryRecord = { id: string; generatedAt: string; project: string; milestone: string; developerRequest: string; readiness: number; packageId?: string; pipelineStatus?: "success" | "failed"; };
type AIPipelineStage = "analyzed" | "session-ready" | "prompt-copied" | "chatgpt-opened";

const AI_TAB_KEY = "workflowstudio.aiWorkspace.activeTab";

function workspaceDraftKey(rootPath?: string) {
  return `workflowstudio.aiWorkspace.draft:${rootPath ?? "none"}`;
}

function getInitialTab(): AIDevelopmentTab {
  const saved = window.sessionStorage.getItem(AI_TAB_KEY);
  return saved === "package" || saved === "snapshots" || saved === "history" ? saved : "context";
}

type PackageReadiness = {
  state: AIPackageSafetyState;
  label: string;
  summary: string;
  reasons: string[];
};

function packageStateLabel(state: AIPackageSafetyState) {
  if (state === "safe") return "Safe";
  if (state === "warning") return "Warning";
  return "Blocked";
}

function commandBlock(label: string, value: string | undefined, onCopy: (value: string, label: string) => void) {
  if (!value) return null;


  return (
    <div className="ai-package-command">
      <div>
        <strong>{label}</strong>
        <code>{value}</code>
      </div>
      <button type="button" onClick={() => onCopy(value, label)}>
        Copy
      </button>
    </div>
  );
}

export function AIWorkspacePage({ activePage, activeWorkspace }: AIDevelopmentPageProps) {
  const rootPath = activeWorkspace?.rootPath;
  const [analysis, setAnalysis] = useState<WorkspaceAnalysis | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [snapshots, setSnapshots] = useState<AISnapshotRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("AI Workspace is ready.");
  const [showStatusMessage, setShowStatusMessage] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [developerRequest, setDeveloperRequest] = useState("");
  const [packageId, setPackageId] = useState("");
  const [packageResult, setPackageResult] = useState<AIPackageBuilderResult | null>(null);
  const [importedPackage, setImportedPackage] = useState<ImportedPackageResult | null>(null);
  const [pipelineResult, setPipelineResult] = useState<Awaited<ReturnType<typeof runDevelopmentPipeline>> | null>(null);
  const [pipelineStartedAt, setPipelineStartedAt] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryRecord[]>([]);
  const [isDraggingPackage, setIsDraggingPackage] = useState(false);
  const [packageEligibility, setPackageEligibility] = useState<AIPackageReadiness | null>(null);
  const [activeTab, setActiveTab] = useState<AIDevelopmentTab>(getInitialTab);
  const [copiedAction, setCopiedAction] = useState<"continuation" | "combined" | "package" | null>(null);
  const [pipelineStage, setPipelineStage] = useState<AIPipelineStage>("analyzed");

  function showStatus(message: string) {
    setStatusMessage(message);
    setShowStatusMessage(true);

    window.setTimeout(() => {
      setShowStatusMessage(false);
    }, 3000);
  }

  const workspaceContext = useMemo(
    () => buildAIWorkspaceContext(analysis),
    [analysis],
  );

  const developmentSession = useMemo(
    () => createDevelopmentSession({
      analysis,
      gitStatus,
      workspaceContext,
      developerRequest,
    }),
    [analysis, developerRequest, gitStatus, workspaceContext],
  );

  const prompt = developmentSession.continuationPrompt;
  const combinedPrompt = developmentSession.combinedPrompt;
  const packageGenerationPrompt = developmentSession.packageGenerationPrompt;
  const sessionReadiness = useMemo(() => {
    const checks = [
      { label: "Workspace analyzed", ready: Boolean(analysis) },
      { label: "Project metadata loaded", ready: Boolean(analysis?.projectName && rootPath) },
      { label: "Documentation discovered", ready: developmentSession.documentation.paths.length > 0 },
      { label: "Git status checked", ready: Boolean(gitStatus) },
      { label: "Developer Request included", ready: Boolean(developerRequest.trim()) },
      { label: "Development session built", ready: Boolean(analysis && developmentSession.id) },
    ];
    const readyCount = checks.filter((item) => item.ready).length;
    return {
      checks,
      readyCount,
      percent: Math.round((readyCount / checks.length) * 100),
      readyForPackage: Boolean(analysis && rootPath && developerRequest.trim()),
    };
  }, [analysis, developerRequest, developmentSession, gitStatus, rootPath]);

  const packageReadiness = useMemo<PackageReadiness>(() => {
    const reasons: string[] = [];
    const changedFileCount = packageEligibility?.changedFiles.length ?? 0;
    const safeChangedFileCount = packageEligibility?.packageableFiles.length ?? 0;

    if (!rootPath) reasons.push("Open a managed workspace first.");
    if (!developerRequest.trim()) reasons.push("Paste a Developer Request before exporting.");
    if (!packageEligibility?.isRepository) reasons.push("Git status is required so changed files can be detected safely.");
    if (packageEligibility?.isRepository && changedFileCount === 0) reasons.push("No Git changes are currently available to package.");
    if (changedFileCount > 0 && safeChangedFileCount === 0) reasons.push("No safe source or documentation changes were detected.");

    if (reasons.length) {
      return {
        state: "blocked",
        label: "Blocked",
        summary: "Package export is blocked until required context is available.",
        reasons,
      };
    }

    const warnings = analysis?.health.warnings ?? [];
    if (warnings.length) {
      return {
        state: "warning",
        label: "Warning",
        summary: "Package export can run, but workspace health warnings should be reviewed first.",
        reasons: warnings.slice(0, 3),
      };
    }

    return {
      state: "safe",
      label: "Safe",
      summary: "Workspace context, Developer Request, and changed files are ready for package export.",
      reasons: ["Package will include current safe Git replacement files only."],
    };
  }, [analysis, developerRequest, packageEligibility, rootPath]);
  const packageButtonLabel = useMemo(() => {
    if (!rootPath) return "Open a Workspace First";
    if (!developerRequest.trim()) return "Add Developer Request";
    if (!packageEligibility?.isRepository) return "Git Status Required";
    if ((packageEligibility.packageableFiles.length ?? 0) === 0) return "No Packageable Changes Detected";
    if (packageReadiness.state === "blocked") return "Package Not Ready";
    return "Build Package From Workspace Changes";
  }, [developerRequest, packageEligibility, packageReadiness.state, rootPath]);

  async function refresh() {
    if (!rootPath) return;

    const [nextAnalysis, nextGitStatus, nextSnapshots, nextPackageEligibility] = await Promise.all([
      scanWorkspace(rootPath),
      getGitStatus(rootPath),
      listAISnapshots(rootPath),
      getAIPackageReadiness(rootPath),
    ]);

    setAnalysis(nextAnalysis);
    setGitStatus(nextGitStatus);
    setSnapshots(nextSnapshots);
    setPackageEligibility(nextPackageEligibility);
  }

  useEffect(() => {
    refresh().catch((error) => {
      console.error(error);
      showStatus("Unable to load AI Workspace data.");
    });
  }, [rootPath]);

  useEffect(() => {
    window.sessionStorage.setItem(AI_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("workflowstudio.ai-session-history");
      setSessionHistory(saved ? JSON.parse(saved) as SessionHistoryRecord[] : []);
    } catch { setSessionHistory([]); }
  }, []);

  function saveSessionHistory(next: SessionHistoryRecord[]) {
    setSessionHistory(next);
    window.localStorage.setItem("workflowstudio.ai-session-history", JSON.stringify(next.slice(0, 50)));
  }

  useEffect(() => {
    const saved = window.sessionStorage.getItem(workspaceDraftKey(rootPath));
    if (!saved) return;
    try {
      const draft = JSON.parse(saved) as { developerRequest?: string; packageId?: string };
      setDeveloperRequest(draft.developerRequest ?? "");
      setPackageId(draft.packageId ?? "");
    } catch {
      window.sessionStorage.removeItem(workspaceDraftKey(rootPath));
    }
  }, [rootPath]);

  useEffect(() => {
    window.sessionStorage.setItem(workspaceDraftKey(rootPath), JSON.stringify({ developerRequest, packageId }));
  }, [developerRequest, packageId, rootPath]);

  useEffect(() => {
    setPipelineStage(analysis ? "session-ready" : "analyzed");
  }, [analysis, developerRequest, rootPath]);

  async function handleCreateSnapshot() {
    if (!rootPath) {
      showStatus("Open a workspace before creating an AI snapshot.");
      return;
    }

    setIsWorking(true);
    showStatus("Creating AI snapshot...");

    try {
      const result = await createAISnapshot(rootPath);
      showStatus(result.message);
      await refresh();
    } catch (error) {
      console.error(error);
      showStatus("AI snapshot creation failed.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleCopyPrompt() {
    await copyText(prompt);
    setCopiedAction("continuation");
    showStatus("Continuation prompt copied to clipboard.");
    window.setTimeout(() => setCopiedAction(null), 2400);
  }

  async function handleCopyCombinedPrompt() {
    await copyText(combinedPrompt);
    setCopiedAction("combined");
    showStatus(developerRequest.trim()
      ? "Combined prompt copied to clipboard."
      : "Continuation prompt copied. Add a Developer Request to include milestone instructions.");
    window.setTimeout(() => setCopiedAction(null), 2400);
  }

  function handleGenerateDevelopmentSession() {
    if (!rootPath || !analysis) {
      showStatus("Open and analyze a workspace before generating a development session.");
      return;
    }
    setPipelineStage("session-ready");
    const record: SessionHistoryRecord = { id: `${Date.now()}`, generatedAt: new Date().toISOString(), project: developmentSession.project.name, milestone: developmentSession.project.currentMilestone ?? "Not specified", developerRequest: developerRequest.trim(), readiness: sessionReadiness.percent };
    saveSessionHistory([record, ...sessionHistory.filter((item) => item.developerRequest !== record.developerRequest || item.project !== record.project)]);
    showStatus("Development session generated, saved to history, and ready for review.");
  }

  async function handleCopyPackagePrompt() {
    if (!developerRequest.trim()) {
      showStatus("Add a Developer Request before copying the package-generation prompt.");
      return;
    }
    await copyText(packageGenerationPrompt);
    setCopiedAction("package");
    setPipelineStage("prompt-copied");
    showStatus("Package-generation prompt copied to clipboard.");
    window.setTimeout(() => setCopiedAction(null), 2400);
  }

  async function handleOpenChatGPT() {
    if (!sessionReadiness.readyForPackage) {
      showStatus("Complete the workspace analysis and Developer Request before opening ChatGPT.");
      return;
    }
    if (pipelineStage !== "prompt-copied" && copiedAction !== "package") {
      await copyText(packageGenerationPrompt);
      setCopiedAction("package");
    }
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
    setPipelineStage("chatgpt-opened");
    showStatus("ChatGPT opened. Paste the copied package-generation prompt to create the ZIP.");
    window.setTimeout(() => setCopiedAction(null), 2400);
  }

  async function handleCopyPackageText(value: string, label: string) {
    await copyText(value);
    showStatus(`${label} copied to clipboard.`);
  }

  async function handleOpenSnapshotFolder() {
    const result = await openAISnapshotFolder(rootPath);
    showStatus(result.message);
  }

  async function handleCreatePackage() {
    if (!rootPath) {
      showStatus("Open a workspace before creating an AI package.");
      return;
    }

    if (!developerRequest.trim()) {
      showStatus("Add a Developer Request before creating an AI package.");
      return;
    }

    setIsWorking(true);
    setPackageResult(null);
    showStatus("Scanning workspace changes and building package...");

    try {
      const result = await createAIPackage({
        rootPath,
        developerRequest,
        packageId,
      });

      setPackageResult(result);

      if (result.ok) {
        setPackageId(result.packageId ?? packageId);
        showStatus(result.message);
        await refresh();
        return;
      }

      showStatus(result.message);
    } catch (error) {
      console.error(error);
      showStatus("AI package creation failed.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleImportGeneratedPackage(sourcePath?: string) {
    if (!rootPath) {
      showStatus("Open a workspace before importing a generated package.");
      return;
    }

    setIsWorking(true);
    showStatus("Importing and validating generated package...");
    try {
      const result = await importGeneratedPackage(rootPath, sourcePath);
      if (result.canceled) {
        showStatus(result.message);
        return;
      }
      setImportedPackage(result);
      showStatus(result.message);
    } catch (error) {
      console.error(error);
      showStatus("Generated package import failed.");
    } finally {
      setIsWorking(false);
    }
  }


  async function handleRunDevelopmentPipeline() {
    if (!rootPath || !importedPackage?.packagePath || importedPackage.safetyState === "blocked") {
      showStatus("Import and validate a safe package before running the development pipeline.");
      return;
    }
    setIsWorking(true);
    setPipelineResult(null);
    setPipelineStartedAt(new Date().toISOString());
    showStatus("Installing package and running the detected build command...");
    try {
      const result = await runDevelopmentPipeline(rootPath, importedPackage.packagePath, importedPackage.suggestedCommitMessage);
      setPipelineResult(result);
      if (sessionHistory.length) saveSessionHistory(sessionHistory.map((item, index) => index === 0 ? { ...item, packageId: importedPackage.packageId, pipelineStatus: result.ok ? "success" : "failed" } : item));
      showStatus(result.message);
      if (result.ok) await refresh();
    } catch (error) {
      console.error(error);
      showStatus("Development pipeline failed unexpectedly.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handlePackageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingPackage(false);
    const file = event.dataTransfer.files[0] as File & { path?: string };
    if (!file?.path) {
      showStatus("Unable to read the dropped package path. Use Browse for Package instead.");
      return;
    }
    await handleImportGeneratedPackage(file.path);
  }

  return (
    <>
      <section className="hero-panel ai-development-hero">
        <div>
          <p className="eyebrow">{activePage.eyebrow}</p>
          <h2>{activePage.title}</h2>
          <p>Prepare workspace context, build installable milestone packages, and keep AI snapshot history without leaving the active project.</p>
        </div>
        <div className="ai-hero-status"><span>{workspaceContext.lifecycle}</span><strong>{analysis?.projectName ?? activeWorkspace?.name ?? "No workspace"}</strong></div>
      </section>

      <section className="module-panel ai-workspace-overview">
        <div className="ai-workspace-heading">
          <div><p className="eyebrow">Current Workspace</p><h3>{analysis?.projectName ?? activeWorkspace?.name ?? "No workspace selected"}</h3></div>
          <p className={showStatusMessage ? "ai-dev-message visible" : "ai-dev-message"}>{statusMessage}</p>
        </div>
        <div className="ai-dev-status-grid">
          <div className="ai-dev-status-card"><span>Git</span><strong>{gitStatus?.summary ?? "Not checked"}</strong></div>
          <div className="ai-dev-status-card"><span>Lifecycle</span><strong>{analysis ? workspaceContext.lifecycle : "Unknown"}</strong></div>
          <div className="ai-dev-status-card"><span>Build</span><strong>{analysis?.buildCommand ?? "Not configured"}</strong></div>
          <div className="ai-dev-status-card"><span>Milestone</span><strong>{analysis?.currentMilestone ?? "Not specified"}</strong></div>
          <div className="ai-dev-status-card ai-dev-root-card"><span>Root</span><strong>{rootPath ?? "Open a workspace"}</strong></div>
        </div>
        <div className="ai-dev-actions ai-dev-actions-row">
          <button type="button" onClick={handleCreateSnapshot} disabled={!rootPath || isWorking}>Create Snapshot</button>
          <button type="button" onClick={handleCopyPrompt} disabled={!rootPath} className={copiedAction === "continuation" ? "copied" : ""}>{copiedAction === "continuation" ? "✓ Continuation Copied" : "Copy Continuation"}</button>
          <button type="button" onClick={handleCopyCombinedPrompt} disabled={!rootPath} className={copiedAction === "combined" ? "copied" : ""}>{copiedAction === "combined" ? "✓ Combined Prompt Copied" : "Copy Combined Prompt"}</button>
          <button type="button" onClick={handleOpenSnapshotFolder} disabled={!rootPath}>Open Snapshot Folder</button>
        </div>
      </section>

      <nav className="ai-development-tabs" aria-label="AI Workspace sections">
        <button type="button" className={activeTab === "context" ? "active" : ""} onClick={() => setActiveTab("context")}>Workspace</button>
        <button type="button" className={activeTab === "package" ? "active" : ""} onClick={() => setActiveTab("package")}>Package Builder</button>
        <button type="button" className={activeTab === "snapshots" ? "active" : ""} onClick={() => setActiveTab("snapshots")}>Snapshots <span>{snapshots.length}</span></button>
        <button type="button" className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>Session History <span>{sessionHistory.length}</span></button>
      </nav>

      {activeTab === "context" && (
        <>
          <section className="module-panel ai-development-pipeline">
            <div className="ai-section-heading">
              <div>
                <p className="eyebrow">AI Development Orchestrator</p>
                <h3>Development Pipeline</h3>
                <p>Workspace analysis runs automatically. Review readiness, generate the session, and hand the package request to ChatGPT.</p>
              </div>
              <div className={`ai-readiness-score ${sessionReadiness.readyForPackage ? "ready" : "attention"}`}>
                <strong>{sessionReadiness.percent}%</strong>
                <span>Session readiness</span>
              </div>
            </div>
            <div className="ai-pipeline-layout">
              <div className="ai-pipeline-steps">
                {sessionReadiness.checks.map((check) => (
                  <div className={check.ready ? "complete" : "pending"} key={check.label}>
                    <span>{check.ready ? "✓" : "○"}</span>
                    <strong>{check.label}</strong>
                  </div>
                ))}
              </div>
              <div className="ai-session-summary">
                <dl>
                  <div><dt>Project</dt><dd>{developmentSession.project.name}</dd></div>
                  <div><dt>Milestone</dt><dd>{developmentSession.project.currentMilestone ?? "Not specified"}</dd></div>
                  <div><dt>Git</dt><dd>{developmentSession.gitStatus?.summary ?? "Not checked"}</dd></div>
                  <div><dt>Documentation</dt><dd>{developmentSession.documentation.paths.length} paths</dd></div>
                  <div><dt>Warnings</dt><dd>{developmentSession.warnings.length}</dd></div>
                </dl>
              </div>
            </div>
            <div className="ai-pipeline-actions">
              <button type="button" onClick={handleGenerateDevelopmentSession} disabled={!rootPath || !analysis}>Generate Development Session</button>
              <button type="button" onClick={handleCopyPackagePrompt} disabled={!sessionReadiness.readyForPackage} className={copiedAction === "package" ? "copied" : ""}>
                {copiedAction === "package" ? "✓ Package Prompt Copied" : "Copy Package-Generation Prompt"}
              </button>
              <button type="button" onClick={handleOpenChatGPT} disabled={!sessionReadiness.readyForPackage}>Open ChatGPT</button>
              <button type="button" onClick={() => setActiveTab("package")} disabled={pipelineStage !== "chatgpt-opened"}>Import Generated Package</button>
            </div>
            <div className={`ai-pipeline-current-step ${pipelineStage}`}>
              <span>Current step</span>
              <strong>{pipelineStage === "analyzed" ? "Review workspace readiness" : pipelineStage === "session-ready" ? "Copy the package-generation prompt" : pipelineStage === "prompt-copied" ? "Open ChatGPT and generate the ZIP" : "Download the ZIP, then open Package Builder to import or install it"}</strong>
            </div>
          </section>
          <section className="module-panel ai-developer-request-panel">
            <div className="ai-section-heading">
              <div>
                <p className="eyebrow">Next Milestone</p>
                <h3>Developer Request</h3>
                <p>Describe the next milestone, bug fix, or development task. The same request is used by Copy Combined Prompt and the Package Builder.</p>
              </div>
              <button type="button" className="ai-inline-action" onClick={handleCopyCombinedPrompt} disabled={!rootPath}>
                {copiedAction === "combined" ? "✓ Combined Prompt Copied" : "Copy Combined Prompt"}
              </button>
            </div>
            <textarea
              value={developerRequest}
              onChange={(event) => setDeveloperRequest(event.target.value)}
              placeholder="Describe the next development milestone..."
              aria-label="Developer Request"
            />
          </section>
          <section className="ai-context-layout">
          <article className="module-panel ai-context-overview-panel">
            <div className="ai-section-heading"><div><p className="eyebrow">Shared Analysis</p><h3>Workspace Context</h3></div><button type="button" className="ai-inline-action" onClick={handleCopyPrompt} disabled={!rootPath}>Copy Context</button></div>
            <p>Generated from workspace analysis, Git status, commands, embedded metadata, readiness, and documentation.</p>
            <div className="ai-context-summary"><div><span>Lifecycle</span><strong>{workspaceContext.lifecycle}</strong></div>{workspaceContext.readiness.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.status}</strong></div>)}</div>
            {workspaceContext.missingMetadata.length > 0 && <div className="ai-context-notice"><strong>Context can be improved</strong><ul>{workspaceContext.missingMetadata.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          </article>
          <article className="module-panel ai-dev-prompt">
            <div className="ai-section-heading"><div><p className="eyebrow">Copy-ready</p><h3>Continuation Prompt</h3></div><button type="button" className="ai-inline-action" onClick={handleCopyCombinedPrompt} disabled={!rootPath}>Copy Combined</button></div>
            <textarea value={prompt} readOnly aria-label="Continuation prompt preview" />
          </article>
          </section>
        </>
      )}

      {activeTab === "package" && (
        <section className="module-panel ai-package-builder-panel ai-tab-panel">
          <div className="ai-package-builder-header"><div><p className="eyebrow">Installable Milestones</p><h3>AI Package Builder</h3><p>Import generated packages for validation, or build a package from safe workspace changes.</p></div><div className="ai-package-header-actions"><button type="button" className="secondary-button" onClick={() => handleImportGeneratedPackage()} disabled={!rootPath || isWorking}>Browse for Package</button><button type="button" onClick={handleCreatePackage} disabled={!rootPath || isWorking || packageReadiness.state === "blocked"}>{packageButtonLabel}</button></div></div>
          <div
            className={`ai-package-drop-zone ${isDraggingPackage ? "dragging" : ""}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDraggingPackage(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDraggingPackage(false)}
            onDrop={handlePackageDrop}
          >
            <strong>Import generated package</strong>
            <span>Drop a Workflow Studio ZIP or extracted package folder here, or use Browse for Package.</span>
          </div>
          {importedPackage && <div className={`ai-imported-package ${importedPackage.safetyState}`}>
            <div className="ai-imported-package-heading"><div><span>{packageStateLabel(importedPackage.safetyState)}</span><strong>{importedPackage.packageId ?? "Imported package"}</strong><p>{importedPackage.message}</p></div><code>{importedPackage.packagePath ?? importedPackage.sourcePath}</code></div>
            <div className="ai-imported-package-summary"><div><span>Target</span><strong>{importedPackage.targetProject ?? "Not specified"}</strong></div><div><span>Files</span><strong>{importedPackage.files.length}</strong></div><div><span>Generated</span><strong>{importedPackage.generatedAt ? new Date(importedPackage.generatedAt).toLocaleString() : "Not recorded"}</strong></div><div><span>Status</span><strong>{packageStateLabel(importedPackage.safetyState)}</strong></div></div>
            {importedPackage.description && <p>{importedPackage.description}</p>}
            <details className="ai-package-advanced"><summary>Advanced commands and package metadata</summary><div className="ai-package-command-list">{commandBlock("Install command", importedPackage.suggestedInstallCommand, handleCopyPackageText)}{commandBlock("Build command", importedPackage.suggestedBuildCommand, handleCopyPackageText)}{commandBlock("Git commit message", importedPackage.suggestedCommitMessage, handleCopyPackageText)}</div></details>
            <div className="ai-package-file-list"><strong>Replacement files ({importedPackage.files.length})</strong>{importedPackage.files.length ? <ul>{importedPackage.files.map((file) => <li key={`${file.source}:${file.target}`} className={file.exists ? "" : "missing"}><span>{file.exists ? "✓" : "!"}</span><code>{file.target}</code></li>)}</ul> : <p>No replacement files were found.</p>}</div>
            {importedPackage.warnings.length ? <div className="ai-package-warning-list"><strong>Validation notes</strong><ul>{importedPackage.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
            <div className="ai-development-runner">
              <div><span>Guided Development Pipeline</span><strong>Install → Build → Ready to Commit</strong><p>Uses the reviewed package, the standard backup installer, and the detected safe build command.</p></div>
              <button type="button" onClick={handleRunDevelopmentPipeline} disabled={isWorking || !importedPackage.ok || importedPackage.safetyState === "blocked"}>{isWorking ? "Installing and Building…" : "Install Package and Run Build"}</button>
            </div>
            {(isWorking || pipelineResult) && <div className={`ai-development-result ${pipelineResult ? (pipelineResult.ok ? "success" : "failed") : "running"}`} aria-live="polite">
              <div className="ai-pipeline-result-heading"><span>{pipelineResult ? (pipelineResult.ok ? "Pipeline complete" : "Pipeline stopped") : "Pipeline in progress"}</span><strong>{pipelineResult?.message ?? "Workflow Studio is installing the package and running the build."}</strong><time>{pipelineResult ? new Date(pipelineResult.completedAt).toLocaleString() : pipelineStartedAt ? `Started ${new Date(pipelineStartedAt).toLocaleTimeString()}` : "Starting…"}</time></div>
              <div className="ai-pipeline-feedback-list">
                <div className="complete"><span>✓</span><div><strong>Package imported</strong><small>Generated package is loaded into the intake pipeline.</small></div></div>
                <div className="complete"><span>✓</span><div><strong>Package validated</strong><small>{packageStateLabel(importedPackage.safetyState)} package passed intake review.</small></div></div>
                <div className={pipelineResult?.install.status === "completed" ? "complete" : pipelineResult?.install.status === "failed" ? "failed" : "active"}><span>{pipelineResult?.install.status === "completed" ? "✓" : pipelineResult?.install.status === "failed" ? "!" : "…"}</span><div><strong>Backup created and files installed</strong><small>{pipelineResult ? `Install ${pipelineResult.install.status}.` : "Running the standard backup-aware installer."}</small></div></div>
                <div className={pipelineResult?.build.status === "completed" ? "complete" : pipelineResult?.build.status === "failed" ? "failed" : pipelineResult?.install.status === "failed" ? "pending" : "active"}><span>{pipelineResult?.build.status === "completed" ? "✓" : pipelineResult?.build.status === "failed" ? "!" : pipelineResult?.install.status === "failed" ? "–" : "…"}</span><div><strong>Build verification</strong><small>{pipelineResult ? `Build ${pipelineResult.build.status}.` : "Waiting for installation, then running the detected build command."}</small></div></div>
                <div className={pipelineResult?.ok ? "complete" : pipelineResult ? "pending" : "pending"}><span>{pipelineResult?.ok ? "✓" : "–"}</span><div><strong>{pipelineResult?.ok ? "Ready to commit" : "Commit remains locked"}</strong><small>{pipelineResult?.ok ? (pipelineResult.suggestedCommitMessage ?? "Review changes and commit manually.") : "A successful build is required before committing."}</small></div></div>
              </div>
              {pipelineResult && <><div className="ai-development-stage-grid"><div><span>Install</span><strong>{pipelineResult.install.status}</strong></div><div><span>Build</span><strong>{pipelineResult.build.status}</strong></div><div><span>Commit</span><strong>{pipelineResult.ok ? "Ready" : "Not ready"}</strong></div></div>
              <details><summary>Installation output</summary><pre>{pipelineResult.install.output || "No output."}</pre></details>
              <details><summary>Build output</summary><pre>{pipelineResult.build.output || "No output."}</pre></details></>}
            </div>}
          </div>}
          <div className={`ai-package-readiness ${packageReadiness.state}`}><div><span>{packageReadiness.label}</span><strong>{packageReadiness.summary}</strong></div><ul>{packageReadiness.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>
          <div className="ai-package-form-grid">
            <label className="ai-package-field"><span>Package ID</span><input value={packageId} onChange={(event) => setPackageId(event.target.value)} placeholder="workflowstudio-v1.4.0-daily-driver-polish" /></label>
            <label className="ai-package-field"><span>Developer Request</span><textarea value={developerRequest} onChange={(event) => setDeveloperRequest(event.target.value)} placeholder="Paste the milestone request here before building the package..." /></label>
          </div>
          <div className="ai-package-counts">
            <div className="package-count-card packageable"><span>Packageable</span><strong>{packageEligibility?.counts.packageable ?? 0}</strong></div>
            <div className="package-count-card skipped"><span>Skipped safely</span><strong>{packageEligibility?.counts.skipped ?? 0}</strong></div>
            <div className="package-count-card generated"><span>Generated</span><strong>{packageEligibility?.counts.generated ?? 0}</strong></div>
            <div className="package-count-card protected"><span>Protected</span><strong>{packageEligibility?.counts.protected ?? 0}</strong></div>
          </div>
          <div className="ai-package-builder-grid">
            <div className="ai-package-summary"><strong>Package preview</strong><dl><div><dt>Target</dt><dd>{analysis?.projectName ?? activeWorkspace?.name ?? "No workspace selected"}</dd></div><div><dt>Package ID</dt><dd>{packageId.trim() || "Auto-generated from project and timestamp"}</dd></div><div><dt>Build</dt><dd>{analysis?.buildCommand ?? "npm run build"}</dd></div><div><dt>Output</dt><dd>_packages/{packageId.trim() || "generated-package-id"}</dd></div></dl></div>
            <div className="ai-package-file-preview"><strong>Packageable files ({packageEligibility?.packageableFiles.length ?? 0})</strong>{packageEligibility?.packageableFiles.length ? <ul>{packageEligibility.packageableFiles.map((file) => <li key={file}><span className="ai-file-check">✓</span>{file}</li>)}</ul> : <p>No packageable source or documentation changes detected.</p>}</div>
          </div>
          {packageEligibility?.skippedFiles.length ? <details className="ai-skipped-files"><summary>Skipped files ({packageEligibility.skippedFiles.length})</summary><div>{packageEligibility.skippedFiles.map((file) => <div className="ai-skipped-file" key={`${file.category}:${file.path}`}><code>{file.path}</code><span>{file.reason}</span></div>)}</div></details> : null}
          {packageResult && <div className={`ai-package-result ${packageResult.safetyState ?? (packageResult.ok ? "safe" : "blocked")}`}>
            <div className="ai-package-result-header"><div><span>{packageStateLabel(packageResult.safetyState ?? (packageResult.ok ? "safe" : "blocked"))}</span><strong>{packageResult.validationSummary ?? packageResult.message}</strong></div><p>{packageResult.message}</p></div>
            {packageResult.packagePath && <p><strong>Package:</strong> {packageResult.packagePath}</p>}
            <div className="ai-package-command-list">{commandBlock("Install command", packageResult.installCommand, handleCopyPackageText)}{commandBlock("Build command", packageResult.buildCommand, handleCopyPackageText)}{commandBlock("Git commit message", packageResult.suggestedCommitMessage, handleCopyPackageText)}</div>
            {packageResult.files?.length ? <div className="ai-package-file-list"><strong>Included files ({packageResult.files.length})</strong><ul>{packageResult.files.map((file) => <li key={file}>{file}</li>)}</ul></div> : null}
            {packageResult.skippedFiles?.length ? <details className="ai-skipped-files"><summary>Skipped during export ({packageResult.skippedFiles.length})</summary><div>{packageResult.skippedFiles.map((file) => <div className="ai-skipped-file" key={`${file.category}:${file.path}`}><code>{file.path}</code><span>{file.reason}</span></div>)}</div></details> : null}
            {packageResult.warnings?.length ? <div className="ai-package-warning-list"><strong>Warnings</strong><ul>{packageResult.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div> : null}
          </div>}
        </section>
      )}

      {activeTab === "history" && (
        <section className="module-panel ai-session-history">
          <div className="ai-section-heading"><div><p className="eyebrow">Development Continuity</p><h3>Session History</h3><p>Resume recent package-generation requests and review how milestone work progressed.</p></div><button type="button" onClick={() => saveSessionHistory([])} disabled={!sessionHistory.length}>Clear History</button></div>
          {sessionHistory.length ? <div className="ai-session-history-list">{sessionHistory.map((item) => <article key={item.id}>
            <div><span>{new Date(item.generatedAt).toLocaleString()}</span><strong>{item.project}</strong><p>{item.milestone}</p></div>
            <div className="ai-session-history-meta"><span>{item.readiness}% ready</span><span>{item.pipelineStatus ?? "session prepared"}</span>{item.packageId && <code>{item.packageId}</code>}</div>
            <p>{item.developerRequest || "No Developer Request recorded."}</p>
            <button type="button" onClick={() => { setDeveloperRequest(item.developerRequest); setActiveTab("context"); showStatus("Development Session restored from history."); }}>Resume Session</button>
          </article>)}</div> : <div className="empty-state"><strong>No development sessions yet</strong><p>Generate a Development Session to begin building reusable history.</p></div>}
        </section>
      )}

      {activeTab === "snapshots" && (
        <section className="module-panel ai-tab-panel">
          <div className="ai-section-heading"><div><p className="eyebrow">Workspace History</p><h3>AI Snapshots</h3></div><div className="ai-snapshot-actions"><button type="button" className="ai-inline-action" onClick={() => refresh().then(() => showStatus("Snapshot history refreshed."))} disabled={!rootPath || isWorking}>Refresh History</button></div></div>
          {snapshots.length === 0 ? <p className="empty-state">No AI snapshots have been created for this workspace yet.</p> : <div className="snapshot-history-list">{snapshots.map((snapshot) => <div className="snapshot-history-card" key={snapshot.id}><div><strong>{snapshot.name}</strong><span>{new Date(snapshot.createdAt).toLocaleString()}</span></div><span>{formatBytes(snapshot.sizeBytes)} · {snapshot.filePath}</span></div>)}</div>}
        </section>
      )}
    </>
  );
}
