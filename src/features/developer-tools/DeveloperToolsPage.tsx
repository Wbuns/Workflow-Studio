import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { WorkspaceRecord } from "../../types/workspaceRegistry";
import type { DeveloperAutomationRecord, DeveloperValidationReport, DeveloperWorkflowResult } from "../../types/developerWorkflow";
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
  const [buildOutput, setBuildOutput] = useState<string[]>([]);
  const [validationReport, setValidationReport] = useState<DeveloperValidationReport>();
  const [automationHistory, setAutomationHistory] = useState<DeveloperAutomationRecord[]>([]);

  useEffect(() => DeveloperWorkflowService.subscribeToBuildOutput((line) => {
    setBuildOutput((current) => [...current.slice(-299), line]);
  }), []);

  async function refreshAutomationHistory() {
    try {
      setAutomationHistory(await DeveloperWorkflowService.listAutomationHistory());
    } catch (error) {
      console.warn("Unable to load automation history.", error);
    }
  }

  useEffect(() => {
    void refreshAutomationHistory();
  }, []);

  async function runAction(
    actionId: string,
    action: () => Promise<DeveloperWorkflowResult>,
  ) {
    setBusyAction(actionId);
    try {
      setResult(await action());
      await refreshAutomationHistory();
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
          <h3>Build Automation</h3>
          <p>Run the active workspace's detected safe build command and stream output here.</p>
          <div className="developer-tool-actions">
            <button type="button" onClick={async () => {
              setBusyAction("build");
              setBuildOutput([]);
              try {
                const execution = await DeveloperWorkflowService.runBuild(rootPath, activeWorkspace?.name);
                setResult({ ok: execution.status !== "failed", message: `Build started: ${execution.command}` });
              } catch (error) {
                setResult({ ok: false, message: error instanceof Error ? error.message : "Build failed to start." });
              } finally {
                await refreshAutomationHistory();
                setBusyAction(undefined);
              }
            }} disabled={!rootPath || Boolean(busyAction)}>
              Run Build
            </button>
            <button type="button" onClick={() => setBuildOutput([])} disabled={!buildOutput.length}>Clear Output</button>
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
                setValidationReport(report);
                setResult({ ok: report.ok, message: `Workspace validation score: ${report.score}%`, details: report.checks.map((check) => `${check.label}: ${check.detail}`) });
              } catch (error) {
                setResult({ ok: false, message: error instanceof Error ? error.message : "Validation failed." });
              } finally {
                await refreshAutomationHistory();
                setBusyAction(undefined);
              }
            }} disabled={!rootPath || Boolean(busyAction)}>
              Validate Workspace
            </button>
          </div>
        </article>
      </section>

      {validationReport ? (
        <section className="detail-panel developer-validation-report">
          <div className="developer-console-header">
            <div><h3>Workspace Preflight</h3><p>Generated {new Date(validationReport.generatedAt).toLocaleString()}</p></div>
            <strong>{validationReport.score}%</strong>
          </div>
          <div className="developer-validation-list">
            {validationReport.checks.map((check) => (
              <article className={`developer-validation-check ${check.status}`} key={check.id}>
                <span>{check.status === "passed" ? "✓" : check.status === "warning" ? "!" : "×"}</span>
                <div><strong>{check.label}</strong><p>{check.detail}</p></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}


      <section className="detail-panel developer-automation-history">
        <div className="developer-console-header">
          <div>
            <h3>Automation History</h3>
            <p>Recent developer operations across registered workspaces.</p>
          </div>
          <div className="developer-tool-actions">
            <button type="button" onClick={() => void refreshAutomationHistory()} disabled={Boolean(busyAction)}>
              Refresh
            </button>
            <button type="button" onClick={() => runAction("clear-history", async () => {
              const cleared = await DeveloperWorkflowService.clearAutomationHistory();
              setAutomationHistory([]);
              return cleared;
            })} disabled={!automationHistory.length || Boolean(busyAction)}>
              Clear History
            </button>
          </div>
        </div>
        <div className="developer-automation-list">
          {automationHistory.length ? automationHistory.map((record) => (
            <article className={`developer-automation-record ${record.status}`} key={record.id}>
              <span className="developer-automation-status">
                {record.status === "success" ? "✓" : record.status === "failed" ? "×" : "…"}
              </span>
              <div>
                <strong>{record.label}</strong>
                <p>{record.message}</p>
                <small>
                  {record.workspaceName ?? record.rootPath ?? "Workflow Studio"} · {new Date(record.startedAt).toLocaleString()}
                  {typeof record.durationMs === "number" ? ` · ${record.durationMs} ms` : ""}
                </small>
              </div>
            </article>
          )) : <p className="developer-empty-state">No automated developer operations have been recorded yet.</p>}
        </div>
      </section>

      <section className="detail-panel developer-build-console">
        <div className="developer-console-header"><h3>Build Console</h3><span>{buildOutput.length} lines</span></div>
        <pre>{buildOutput.length ? buildOutput.join("") : "Build output will appear here."}</pre>
      </section>

      <section className={`detail-panel developer-result-panel ${result?.ok === false ? "error" : ""}`}>
        <h3>Latest Result</h3>
        <p>{busyAction ? "Running developer workflow…" : result?.message ?? "Choose an action to begin."}</p>
        {result?.details?.length ? <ul>{result.details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
      </section>
    </>
  );
}
