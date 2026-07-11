import { useEffect, useState } from "react";
import type { WorkspaceCommand, WorkspaceCommandExecution, WorkspaceCommandOutput } from "../../types/workspaceAnalysis";
import type { DashboardSummary } from "./DashboardTypes";

type DashboardWidgetsProps = { summary: DashboardSummary };
type InfoCardProps = { title: string; value: string; detail: string };

function InfoCard({ title, value, detail }: InfoCardProps) {
  return <article className="info-panel"><h3>{title}</h3><p>{value}</p><span>{detail}</span></article>;
}

function CommandRow({ label, command }: { label: string; command?: string }) {
  return <div><dt>{label}</dt><dd>{command ?? "Not available"}</dd></div>;
}

function WorkspaceCommandCard({ command, onCopy, onRun, copiedId, runningId }: { command: WorkspaceCommand; onCopy: (command: WorkspaceCommand) => void; onRun: (command: WorkspaceCommand) => void; copiedId?: string; runningId?: string }) {
  return (
    <article className="workspace-command-card">
      <div className="workspace-command-heading">
        <div><span className="workspace-command-category">{command.category}</span><h4>{command.label}</h4></div>
        <div className="workspace-command-actions"><button className="secondary-button workspace-command-copy" type="button" onClick={() => onCopy(command)}>{copiedId === command.id ? "Copied" : "Copy"}</button><button className="primary-button" type="button" disabled={Boolean(command.interactive || command.destructive || runningId)} title={command.interactive ? "Interactive execution is not enabled yet." : command.destructive ? "Device-changing commands require a future permission milestone." : undefined} onClick={() => onRun(command)}>{runningId === command.id ? "Running" : "Run"}</button></div>
      </div>
      <code>{command.command}</code>
      <p>{command.description}</p>
      <div className="workspace-command-meta">
        <span>{command.source}</span>
        {command.workingDirectory && <span>cwd: {command.workingDirectory}</span>}
        {command.interactive && <span>interactive</span>}
        {command.destructive && <span>changes device or output</span>}
      </div>
    </article>
  );
}

export function DashboardWidgets({ summary }: DashboardWidgetsProps) {
  const [copiedId, setCopiedId] = useState<string>();
  const [execution, setExecution] = useState<WorkspaceCommandExecution>();
  const [output, setOutput] = useState<WorkspaceCommandOutput[]>([]);
  const [executionError, setExecutionError] = useState<string>();
  const enabledCapabilities = summary.capabilities.filter((capability) => capability.enabled);
  const disabledCapabilities = summary.capabilities.filter((capability) => !capability.enabled);
  const embedded = summary.workspaceAnalysis.embedded;
  const commands = summary.workspaceAnalysis.workspaceCommands;

  async function runCommand(command: WorkspaceCommand) {
    const bridge = window.workflowStudio?.workspace;
    if (!bridge?.runCommand) {
      setExecutionError("Native command execution bridge is unavailable.");
      return;
    }
    setOutput([]);
    setExecutionError(undefined);
    try {
      const next = await bridge.runCommand(summary.rootPath, command.id);
      setExecution(next);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : String(error));
    }
  }

  async function cancelCommand() {
    if (!execution || !window.workflowStudio?.workspace?.cancelCommand) return;
    await window.workflowStudio.workspace.cancelCommand(execution.executionId);
    setExecution((current) => current ? { ...current, status: "cancelled" } : current);
  }

  useEffect(() => {
    const unsubscribe = window.workflowStudio?.workspace?.onCommandOutput?.((entry) => {
      setOutput((current) => current.length >= 500 ? [...current.slice(-450), entry] : [...current, entry]);
      if (entry.stream === "system" && /completed successfully|exited with code|Stopped by/.test(entry.text)) {
        setExecution((current) => current ? { ...current, status: entry.text.includes("completed successfully") ? "completed" : current.status === "cancelled" ? "cancelled" : "failed" } : current);
      }
    });
    return unsubscribe;
  }, []);

  async function copyCommand(command: WorkspaceCommand) {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopiedId(command.id);
      window.setTimeout(() => setCopiedId((current) => current === command.id ? undefined : current), 2200);
    } catch (error) {
      console.warn("Unable to copy workspace command.", error);
    }
  }

  return (
    <>
      <section className="panel-grid">
        <InfoCard title="Workspace Health" value={`${summary.healthScore}%`} detail={summary.healthStatus} />
        <InfoCard title="Project Type" value={summary.projectType} detail={`Toolchain: ${summary.packageManager}`} />
        <InfoCard title="Commands" value={`${commands.length}`} detail="Typed workspace command profiles are available." />
      </section>

      <section className="dashboard-grid">
        <article className="detail-panel workspace-health-panel">
          <h3>Workspace Health</h3>
          <div className="health-meter" aria-label={`Workspace health ${summary.healthScore}%`}><div style={{ width: `${summary.healthScore}%` }} /></div>
          <dl><div><dt>Score</dt><dd>{summary.healthScore}%</dd></div><div><dt>Status</dt><dd>{summary.healthStatus}</dd></div><div><dt>Root</dt><dd>{summary.rootPath}</dd></div></dl>
        </article>

        {embedded?.detected && (
          <article className="detail-panel">
            <h3>Embedded Target</h3>
            <dl>
              <CommandRow label="Platform" command={embedded.platform} />
              <CommandRow label="Board" command={embedded.boardIdentifiers.join(", ") || undefined} />
              <CommandRow label="Framework" command={embedded.frameworks.join(", ") || undefined} />
              <CommandRow label="Firmware" command={embedded.firmwareSourcePath} />
              <CommandRow label="Device Profile" command={embedded.deviceProfile} />
            </dl>
          </article>
        )}

        <article className="detail-panel workspace-commands-panel">
          <div className="section-heading"><div><h3>Workspace Commands</h3><p>Detected commands are copy-only. Native execution is not enabled.</p></div></div>
          <div className="workspace-command-list">
            {commands.map((command) => <WorkspaceCommandCard key={command.id} command={command} onCopy={copyCommand} onRun={runCommand} copiedId={copiedId} runningId={execution?.status === "running" ? execution.commandId : undefined} />)}
          </div>
          {(execution || executionError || output.length > 0) && <section className="command-console" aria-live="polite"><div className="command-console-heading"><div><h4>Command Output</h4><p>{execution ? `${execution.label} — ${execution.status}` : executionError}</p></div>{execution?.status === "running" && <button className="secondary-button" type="button" onClick={cancelCommand}>Cancel</button>}</div><pre>{output.map((entry, index) => <span className={`command-output-${entry.stream}`} key={`${entry.timestamp}-${index}`}>{entry.text}</span>)}</pre></section>}
        </article>

        <article className="detail-panel capabilities-panel"><h3>Enabled Capabilities</h3><div className="capability-list">{enabledCapabilities.map((capability) => <span className="capability-pill enabled" key={capability.id} title={capability.detail}>✓ {capability.label}</span>)}</div></article>
        <article className="detail-panel capabilities-panel"><h3>Needs Attention</h3><div className="capability-list">{disabledCapabilities.length > 0 ? disabledCapabilities.map((capability) => <span className="capability-pill disabled" key={capability.id} title={capability.detail}>! {capability.label}</span>) : <p className="empty-state">No missing capabilities detected.</p>}</div></article>
        <article className="detail-panel status-list-panel"><h3>Detected</h3><ul>{summary.healthSuccesses.map((success) => <li className="success-item" key={success}>{success}</li>)}</ul></article>
        <article className="detail-panel status-list-panel"><h3>Warnings</h3><ul>{summary.healthWarnings.length > 0 ? summary.healthWarnings.map((warning) => <li className="warning-item" key={warning}>{warning}</li>) : <li className="success-item">No warnings detected.</li>}</ul></article>
        <article className="detail-panel next-actions-panel"><h3>Next Actions</h3><ul>{summary.nextActions.map((action) => <li key={action}>{action}</li>)}</ul></article>
      </section>
    </>
  );
}
