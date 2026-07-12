import { useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";
import type { DeveloperWorkflowResult } from "../../types/developerWorkflow";
import { DeveloperWorkflowService } from "../../services/DeveloperWorkflowService";
import "./DeveloperToolsPage.css";

type DeveloperToolsPageProps = {
  activePage: NavigationItem;
  activeWorkspace?: WorkspaceRecord;
};

export function DeveloperToolsPage({
  activePage,
  activeWorkspace,
}: DeveloperToolsPageProps) {
  const [result, setResult] = useState<DeveloperWorkflowResult>();
  const [busyAction, setBusyAction] = useState<string>();

  async function runAction(
    actionId: string,
    action: () => Promise<DeveloperWorkflowResult>,
  ) {
    setBusyAction(actionId);
    try {
      setResult(await action());
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : "Developer action failed.",
      });
    } finally {
      setBusyAction(undefined);
    }
  }

  const rootPath = activeWorkspace?.rootPath;

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Developer Tools</h2>
        <p>
          Run safe development utilities for <strong>{activeWorkspace?.name ?? "the active workspace"}</strong>
          without leaving Workflow Studio.
        </p>
      </section>

      <section className="developer-tools-grid">
        <article className="detail-panel developer-tool-card">
          <h3>Package Automation</h3>
          <p>Find, extract, validate, back up, and install downloaded Workflow Studio packages.</p>
          <div className="developer-tool-actions">
            <button type="button" onClick={() => runAction("latest-package", () => DeveloperWorkflowService.installLatestPackage(rootPath))} disabled={!rootPath || Boolean(busyAction)}>
              Install Latest Downloaded Package
            </button>
            <button type="button" onClick={() => runAction("package-picker", () => DeveloperWorkflowService.installPackage(rootPath))} disabled={!rootPath || Boolean(busyAction)}>
              Install Package…
            </button>
            <button type="button" onClick={() => runAction("downloads", () => DeveloperWorkflowService.openDownloads())} disabled={Boolean(busyAction)}>
              Open Downloads
            </button>
            <button type="button" onClick={() => runAction("packages", () => DeveloperWorkflowService.openPackageFolder(rootPath))} disabled={!rootPath || Boolean(busyAction)}>
              Open Packages Folder
            </button>
            <button type="button" onClick={() => runAction("backups", () => DeveloperWorkflowService.openBackupFolder(rootPath))} disabled={!rootPath || Boolean(busyAction)}>
              Open Backup Folder
            </button>
          </div>
        </article>

        <article className="detail-panel developer-tool-card">
          <h3>Maintenance</h3>
          <p>Clear abandoned temporary snapshot data and run a workspace preflight check.</p>
          <div className="developer-tool-actions">
            <button type="button" onClick={() => runAction("clean", () => DeveloperWorkflowService.cleanSnapshotStaging())} disabled={Boolean(busyAction)}>
              Clean Snapshot Staging
            </button>
            <button type="button" onClick={async () => {
              setBusyAction("validate");
              try {
                const report = await DeveloperWorkflowService.validateWorkspace(rootPath);
                setResult({ ok: report.ok, message: `Workspace validation score: ${report.score}%`, details: report.checks.map((check) => `${check.label}: ${check.detail}`) });
              } catch (error) {
                setResult({ ok: false, message: error instanceof Error ? error.message : "Validation failed." });
              } finally {
                setBusyAction(undefined);
              }
            }} disabled={!rootPath || Boolean(busyAction)}>
              Validate Workspace
            </button>
          </div>
        </article>
      </section>

      <section className={`detail-panel developer-result-panel ${result?.ok === false ? "error" : ""}`}>
        <h3>Latest Result</h3>
        <p>{busyAction ? "Running developer workflow…" : result?.message ?? "Choose an action to begin."}</p>
        {result?.details?.length ? <ul>{result.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
      </section>
    </>
  );
}
