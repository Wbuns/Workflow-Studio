import { useEffect, useState } from "react";
import type { WorkspaceCommand, WorkspaceCommandExecution, WorkspaceCommandOutput } from "../../types/workspaceAnalysis";
import type { DashboardSummary } from "./DashboardTypes";

type DashboardWidgetsProps = { summary: DashboardSummary; onNavigate: (pageId: string) => void };

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="workspace-stat"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function DashboardWidgets({ summary, onNavigate }: DashboardWidgetsProps) {
  const [copiedId, setCopiedId] = useState<string>();
  const [execution, setExecution] = useState<WorkspaceCommandExecution>();
  const [output, setOutput] = useState<WorkspaceCommandOutput[]>([]);
  const [executionError, setExecutionError] = useState<string>();
  const commands = summary.workspaceAnalysis.workspaceCommands;

  useEffect(() => {
    const unsubscribe = window.workflowStudio?.workspace?.onCommandOutput?.((entry) => {
      setOutput((current) => current.length >= 300 ? [...current.slice(-250), entry] : [...current, entry]);
      if (entry.stream === "system" && /completed successfully|exited with code|Stopped by/.test(entry.text)) {
        setExecution((current) => current ? { ...current, status: entry.text.includes("completed successfully") ? "completed" : current.status === "cancelled" ? "cancelled" : "failed" } : current);
      }
    });
    return unsubscribe;
  }, []);

  async function copyCommand(command: WorkspaceCommand) {
    await navigator.clipboard.writeText(command.command);
    setCopiedId(command.id);
    window.setTimeout(() => setCopiedId((current) => current === command.id ? undefined : current), 1800);
  }

  async function runCommand(command: WorkspaceCommand) {
    const bridge = window.workflowStudio?.workspace;
    if (!bridge?.runCommand) return setExecutionError("Native command execution bridge is unavailable.");
    let approvedPermission: "interactive" | "device-changing" | undefined;
    if (command.permission === "device-changing" && !window.confirm(`Run device-changing command?\n\n${command.command}`)) return;
    if (command.permission === "interactive" && !window.confirm(`Start interactive command?\n\n${command.command}`)) return;
    if (command.permission === "device-changing") approvedPermission = "device-changing";
    if (command.permission === "interactive") approvedPermission = "interactive";
    setOutput([]);
    setExecutionError(undefined);
    try { setExecution(await bridge.runCommand(summary.rootPath, command.id, approvedPermission)); }
    catch (error) { setExecutionError(error instanceof Error ? error.message : String(error)); }
  }

  async function cancelCommand() {
    if (!execution || !window.workflowStudio?.workspace?.cancelCommand) return;
    await window.workflowStudio.workspace.cancelCommand(execution.executionId);
  }

  return (
    <div className="project-workspace-layout">
      <section className="workspace-status-grid" aria-label="Workspace status">
        <Stat label="Project" value={summary.projectName} detail={summary.projectType} />
        <Stat label="Milestone" value={summary.currentMilestone} detail={summary.lifecyclePhase} />
        <Stat label="Readiness" value={summary.readinessStatus} detail="Milestone readiness overview" />
        <Stat label="Git" value={summary.gitEnabled ? "Connected" : "Not detected"} detail={summary.healthWarnings.length ? `${summary.healthWarnings.length} notices` : "Workspace clean"} />
      </section>

      <section className="project-workspace-main">
        <article className="workspace-card workspace-recommendations-card">
          <div className="workspace-card-heading"><div><p className="eyebrow">Next Best Work</p><h3>Recommended Actions</h3></div><button className="text-button" type="button" onClick={() => onNavigate("ai-workspace")}>Open AI Workspace</button></div>
          <div className="workspace-recommendation-list">
            {summary.recommendations.filter((item) => item.targetPageId !== "dashboard").slice(0, 4).map((item) => (
              <article className={`workspace-recommendation priority-${item.priority}`} key={item.id}>
                <div><span>{item.category}</span><h4>{item.title}</h4><p>{item.detail}</p></div>
                {item.targetPageId && <button className="secondary-button" type="button" onClick={() => onNavigate(item.targetPageId!)}>{item.actionLabel ?? "Open"}</button>}
              </article>
            ))}
          </div>
        </article>

        <aside className="workspace-card workspace-quick-actions-card">
          <p className="eyebrow">Start Here</p><h3>Quick Actions</h3>
          <div className="workspace-action-grid">
            <button className="primary-button" type="button" onClick={() => onNavigate("ai-workspace")}>AI Workspace</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("timeline")}>Timeline</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("packages")}>Packages</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("git")}>Git</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("documentation")}>Documentation</button>
            <button className="secondary-button" type="button" onClick={() => onNavigate("projects")}>Projects</button>
          </div>
        </aside>
      </section>

      <section className="workspace-card">
        <div className="workspace-card-heading"><div><p className="eyebrow">Project Readiness</p><h3>Milestone Progress</h3></div><span className="workspace-phase-badge">{summary.lifecyclePhase}</span></div>
        <div className="workspace-readiness-grid">
          {summary.readinessCategories.map((category) => {
            const score = category.score ?? 0;
            return <article key={category.id}><div className="workspace-readiness-heading"><span>{category.label}</span><strong>{category.status}</strong></div><div className="workspace-readiness-track" aria-label={`${category.label} ${score}% ready`}><span style={{ width: `${score}%` }} /></div><p>{category.detail}</p></article>;
          })}
        </div>
      </section>

      <section className="project-workspace-secondary">
        <article className="workspace-card"><p className="eyebrow">Workspace Signals</p><h3>Current State</h3><dl className="workspace-signal-list"><div><dt>Documentation</dt><dd>{summary.documentationCount} paths</dd></div><div><dt>Build</dt><dd>{summary.buildCommand}</dd></div><div><dt>Tests</dt><dd>{summary.testCommand}</dd></div><div><dt>Commands</dt><dd>{commands.length} available</dd></div></dl></article>
        <article className="workspace-card"><p className="eyebrow">Recent Guidance</p><h3>What Needs Attention</h3><ul className="workspace-guidance-list">{summary.guidance.slice(0, 5).map((item, index) => <li key={`${item.label}-${index}`} className={`guidance-${item.kind}`}>{item.label}</li>)}</ul></article>
      </section>

      <section className="workspace-developer-tools-heading"><p className="eyebrow">Developer Tools</p><h3>Advanced Workspace Controls</h3><p>Build commands, environment details, and raw workspace capabilities.</p></section>
      <details className="workspace-card workspace-technical-details">
        <summary><span>Technical Details and Workspace Commands</span><small>{commands.length} commands available</small></summary>
        <div className="workspace-command-grid">
          {commands.map((command) => <article className="workspace-command-card" key={command.id}><div><span>{command.category}</span><h4>{command.label}</h4></div><code>{command.command}</code><p>{command.description}</p><div className="workspace-command-actions"><button className="secondary-button" type="button" onClick={() => copyCommand(command)}>{copiedId === command.id ? "Copied" : "Copy"}</button><button className="primary-button" type="button" disabled={command.permission === "blocked" || Boolean(execution?.status === "running")} onClick={() => runCommand(command)}>Run</button></div></article>)}
        </div>
        {(execution || executionError || output.length > 0) && <div className="workspace-command-console"><div><strong>{execution?.label ?? "Command Console"}</strong>{execution?.status === "running" && <button className="secondary-button" type="button" onClick={cancelCommand}>Stop</button>}</div>{executionError && <p>{executionError}</p>}<pre>{output.map((entry) => entry.text).join("")}</pre></div>}
      </details>
    </div>
  );
}
