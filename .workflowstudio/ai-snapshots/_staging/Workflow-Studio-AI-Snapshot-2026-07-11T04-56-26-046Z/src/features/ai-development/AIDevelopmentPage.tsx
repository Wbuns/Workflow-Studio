import { useEffect, useMemo, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";
import "./AIDevelopmentPage.css";
import {
  buildContinuationPrompt,
  copyText,
  createAIPackage,
  createAISnapshot,
  formatBytes,
  getGitStatus,
  listAISnapshots,
  openAISnapshotFolder,
  scanWorkspace,
  type AIPackageBuilderResult,
  type AIPackageSafetyState,
  type AISnapshotRecord,
  type GitStatus,
  type WorkspaceAnalysis,
} from "./AIDevelopmentService";

type AIDevelopmentPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

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

export function AIDevelopmentPage({ activePage, activeWorkspace }: AIDevelopmentPageProps) {
  const rootPath = activeWorkspace?.rootPath;
  const [analysis, setAnalysis] = useState<WorkspaceAnalysis | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [snapshots, setSnapshots] = useState<AISnapshotRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("AI Development tools are ready.");
  const [showStatusMessage, setShowStatusMessage] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [developerRequest, setDeveloperRequest] = useState("");
  const [packageId, setPackageId] = useState("");
  const [packageResult, setPackageResult] = useState<AIPackageBuilderResult | null>(null);

  function showStatus(message: string) {
    setStatusMessage(message);
    setShowStatusMessage(true);

    window.setTimeout(() => {
      setShowStatusMessage(false);
    }, 3000);
  }

  const prompt = useMemo(
    () => buildContinuationPrompt(analysis, gitStatus),
    [analysis, gitStatus],
  );

  const packageReadiness = useMemo<PackageReadiness>(() => {
    const reasons: string[] = [];
    const changedFileCount = gitStatus?.changedFiles.length ?? 0;
    const safeChangedFileCount = gitStatus?.changedFiles.filter((file) => !file.startsWith("_packages/")).length ?? 0;

    if (!rootPath) reasons.push("Open a managed workspace first.");
    if (!developerRequest.trim()) reasons.push("Paste a Developer Request before exporting.");
    if (!gitStatus?.isRepository) reasons.push("Git status is required so changed files can be detected safely.");
    if (gitStatus?.isRepository && changedFileCount === 0) reasons.push("No Git changes are currently available to package.");
    if (changedFileCount > 0 && safeChangedFileCount === 0) reasons.push("Detected changes are package outputs or ignored files, not replacement files.");

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
  }, [analysis, developerRequest, gitStatus, rootPath]);

  async function refresh() {
    if (!rootPath) return;

    const [nextAnalysis, nextGitStatus, nextSnapshots] = await Promise.all([
      scanWorkspace(rootPath),
      getGitStatus(rootPath),
      listAISnapshots(rootPath),
    ]);

    setAnalysis(nextAnalysis);
    setGitStatus(nextGitStatus);
    setSnapshots(nextSnapshots);
  }

  useEffect(() => {
    refresh().catch((error) => {
      console.error(error);
      showStatus("Unable to load AI Development workspace data.");
    });
  }, [rootPath]);

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
    showStatus("Continuation prompt copied to clipboard.");
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
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.title}</h2>
        <p>
          Create AI-ready project snapshots, continuation prompts, and a lightweight history of
          workspace exports. This page is the first dedicated AI development cockpit for Orivex and
          future projects.
        </p>
      </section>

      <section className="ai-development-layout">
        <article className="module-panel">
          <h3>Current Workspace</h3>
          <div className="ai-dev-status-grid">
            <div className="ai-dev-status-card">
              <span>Name</span>
              <strong>{analysis?.projectName ?? activeWorkspace?.name ?? "No workspace"}</strong>
            </div>
            <div className="ai-dev-status-card">
              <span>Git</span>
              <strong>{gitStatus?.summary ?? "Not checked"}</strong>
            </div>
            <div className="ai-dev-status-card">
              <span>Health</span>
              <strong>{analysis ? `${analysis.health.score}%` : "Unknown"}</strong>
            </div>
            <div className="ai-dev-status-card">
              <span>Build</span>
              <strong>{analysis?.buildCommand ?? "Not detected"}</strong>
            </div>
            <div className="ai-dev-status-card">
              <span>Milestone</span>
              <strong>{analysis?.currentMilestone ?? "Not specified"}</strong>
            </div>
            <div className="ai-dev-status-card">
              <span>Root</span>
              <strong>{rootPath ?? "Open a workspace"}</strong>
            </div>
          </div>

          <div className="ai-dev-actions">
            <button type="button" onClick={handleCreateSnapshot} disabled={!rootPath || isWorking}>
              Create AI Snapshot
            </button>
            <button type="button" onClick={handleCopyPrompt} disabled={!rootPath}>
              Copy Continuation Prompt
            </button>
            <button type="button" disabled title="Coming in v1.4">
              Export Documentation Bundle
            </button>
            <button type="button" onClick={handleOpenSnapshotFolder} disabled={!rootPath}>
              Open Snapshot Folder
            </button>
          </div>

          <p className={showStatusMessage ? "ai-dev-message visible" : "ai-dev-message"}>
            {statusMessage}
          </p>
        </article>

        <article className="module-panel ai-dev-prompt">
          <h3>Continuation Prompt Preview</h3>
          <p>
            This prompt is generated from the selected workspace scan and Git status. Copy it into a
            new chat when you want to continue development with full context.
          </p>
          <textarea value={prompt} readOnly />
        </article>
      </section>

      <section className="module-panel ai-package-builder-panel">
        <div className="ai-package-builder-header">
          <div>
            <p className="eyebrow">Package Export Polish</p>
            <h3>AI Package Builder</h3>
            <p>
              Review workspace readiness, validation status, replacement files, and copy-ready
              install commands before exporting a standard Workflow Studio package.
            </p>
          </div>
          <button type="button" onClick={handleCreatePackage} disabled={!rootPath || isWorking || packageReadiness.state === "blocked"}>
            Build Package From Workspace Changes
          </button>
        </div>

        <div className={`ai-package-readiness ${packageReadiness.state}`}>
          <div>
            <span>{packageReadiness.label}</span>
            <strong>{packageReadiness.summary}</strong>
          </div>
          <ul>
            {packageReadiness.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>

        <label className="ai-package-field">
          <span>Package ID</span>
          <input
            value={packageId}
            onChange={(event) => setPackageId(event.target.value)}
            placeholder="workflowstudio-v1.2.5-package-export-polish"
          />
        </label>

        <label className="ai-package-field">
          <span>Developer Request</span>
          <textarea
            value={developerRequest}
            onChange={(event) => setDeveloperRequest(event.target.value)}
            placeholder="Paste the milestone request here before building the package..."
          />
        </label>

        <div className="ai-package-builder-grid">
          <div>
            <strong>Package preview</strong>
            <ul>
              <li>Target workspace: {analysis?.projectName ?? activeWorkspace?.name ?? "No workspace selected"}</li>
              <li>Package ID: {packageId.trim() || "Auto-generated from project and timestamp"}</li>
              <li>Build command: {analysis?.buildCommand ?? "npm run build"}</li>
              <li>Output folder: _packages/{packageId.trim() || "generated-package-id"}</li>
            </ul>
          </div>
          <div>
            <strong>Detected replacement files</strong>
            {gitStatus?.changedFiles.length ? (
              <ul>
                {gitStatus.changedFiles.slice(0, 10).map((file) => (
                  <li key={file}>{file}</li>
                ))}
                {gitStatus.changedFiles.length > 10 && <li>+ {gitStatus.changedFiles.length - 10} more</li>}
              </ul>
            ) : (
              <p>No Git changes detected yet.</p>
            )}
          </div>
        </div>

        {packageResult && (
          <div className={`ai-package-result ${packageResult.safetyState ?? (packageResult.ok ? "safe" : "blocked")}`}>
            <div className="ai-package-result-header">
              <div>
                <span>{packageStateLabel(packageResult.safetyState ?? (packageResult.ok ? "safe" : "blocked"))}</span>
                <strong>{packageResult.validationSummary ?? packageResult.message}</strong>
              </div>
              <p>{packageResult.message}</p>
            </div>

            {packageResult.packagePath && <p><strong>Package:</strong> {packageResult.packagePath}</p>}

            <div className="ai-package-command-list">
              {commandBlock("Install command", packageResult.installCommand, handleCopyPackageText)}
              {commandBlock("Build command", packageResult.buildCommand, handleCopyPackageText)}
              {commandBlock("Git commit message", packageResult.suggestedCommitMessage, handleCopyPackageText)}
            </div>

            {packageResult.files?.length ? (
              <div className="ai-package-file-list">
                <strong>Included files</strong>
                <ul>
                  {packageResult.files.map((file) => (
                    <li key={file}>{file}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {packageResult.warnings?.length ? (
              <div className="ai-package-warning-list">
                <strong>Warnings</strong>
                <ul>
                  {packageResult.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="module-panel">
        <h3>Snapshot History</h3>
        {snapshots.length === 0 ? (
          <p className="empty-state">No AI snapshots have been created for this workspace yet.</p>
        ) : (
          <div className="snapshot-history-list">
            {snapshots.map((snapshot) => (
              <div className="snapshot-history-card" key={snapshot.id}>
                <strong>{snapshot.name}</strong>
                <span>{new Date(snapshot.createdAt).toLocaleString()}</span>
                <span>
                  {formatBytes(snapshot.sizeBytes)} · {snapshot.filePath}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
