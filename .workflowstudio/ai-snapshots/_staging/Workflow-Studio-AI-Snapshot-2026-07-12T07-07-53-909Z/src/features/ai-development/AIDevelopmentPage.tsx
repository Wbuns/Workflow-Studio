import { useEffect, useMemo, useState } from "react";
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
  listAISnapshots,
  openAISnapshotFolder,
  scanWorkspace,
  type AIPackageBuilderResult,
  type AIPackageReadiness,
  type AIPackageSafetyState,
  type AISnapshotRecord,
  type GitStatus,
  type WorkspaceAnalysis,
} from "./AIDevelopmentService";

type AIDevelopmentPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

type AIDevelopmentTab = "context" | "package" | "snapshots";

const AI_TAB_KEY = "workflowstudio.aiWorkspace.activeTab";

function workspaceDraftKey(rootPath?: string) {
  return `workflowstudio.aiWorkspace.draft:${rootPath ?? "none"}`;
}

function getInitialTab(): AIDevelopmentTab {
  const saved = window.sessionStorage.getItem(AI_TAB_KEY);
  return saved === "package" || saved === "snapshots" ? saved : "context";
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
  const [packageEligibility, setPackageEligibility] = useState<AIPackageReadiness | null>(null);
  const [activeTab, setActiveTab] = useState<AIDevelopmentTab>(getInitialTab);
  const [copiedAction, setCopiedAction] = useState<"continuation" | "combined" | null>(null);

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
      </nav>

      {activeTab === "context" && (
        <>
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
          <div className="ai-package-builder-header"><div><p className="eyebrow">Installable Milestones</p><h3>AI Package Builder</h3><p>Review readiness, replacement files, and install commands before exporting a standard package.</p></div><button type="button" onClick={handleCreatePackage} disabled={!rootPath || isWorking || packageReadiness.state === "blocked"}>{packageButtonLabel}</button></div>
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

      {activeTab === "snapshots" && (
        <section className="module-panel ai-tab-panel">
          <div className="ai-section-heading"><div><p className="eyebrow">Workspace History</p><h3>AI Snapshots</h3></div><div className="ai-snapshot-actions"><button type="button" className="ai-inline-action" onClick={() => refresh().then(() => showStatus("Snapshot history refreshed."))} disabled={!rootPath || isWorking}>Refresh History</button></div></div>
          {snapshots.length === 0 ? <p className="empty-state">No AI snapshots have been created for this workspace yet.</p> : <div className="snapshot-history-list">{snapshots.map((snapshot) => <div className="snapshot-history-card" key={snapshot.id}><div><strong>{snapshot.name}</strong><span>{new Date(snapshot.createdAt).toLocaleString()}</span></div><span>{formatBytes(snapshot.sizeBytes)} · {snapshot.filePath}</span></div>)}</div>}
        </section>
      )}
    </>
  );
}
