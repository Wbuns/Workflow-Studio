import { useEffect, useMemo, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";
import "./AIDevelopmentPage.css";
import {
  buildContinuationPrompt,
  copyText,
  createAISnapshot,
  formatBytes,
  getGitStatus,
  listAISnapshots,
  openAISnapshotFolder,
  scanWorkspace,
  type AISnapshotRecord,
  type GitStatus,
  type WorkspaceAnalysis,
} from "./AIDevelopmentService";

type AIDevelopmentPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

export function AIDevelopmentPage({ activePage, activeWorkspace }: AIDevelopmentPageProps) {
  const rootPath = activeWorkspace?.rootPath;
  const [analysis, setAnalysis] = useState<WorkspaceAnalysis | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [snapshots, setSnapshots] = useState<AISnapshotRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState("AI Development tools are ready.");
  const [showStatusMessage, setShowStatusMessage] = useState(true);
  const [isWorking, setIsWorking] = useState(false);

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

  async function handleOpenSnapshotFolder() {
    const result = await openAISnapshotFolder(rootPath);
    showStatus(result.message);
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