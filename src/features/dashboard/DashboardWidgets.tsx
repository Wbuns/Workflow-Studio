import type { WorkspaceCapability } from "../../types/workspaceAnalysis";
import type { DashboardSummary } from "./DashboardTypes";

type DashboardWidgetsProps = {
  summary: DashboardSummary;
};

type InfoCardProps = {
  title: string;
  value: string;
  detail: string;
};

function InfoCard({ title, value, detail }: InfoCardProps) {
  return (
    <article className="info-panel">
      <h3>{title}</h3>
      <p>{value}</p>
      <span>{detail}</span>
    </article>
  );
}

function CapabilityBadge({ capability }: { capability: WorkspaceCapability }) {
  return (
    <span className={capability.enabled ? "capability-badge enabled" : "capability-badge disabled"}>
      {capability.enabled ? "✓" : "×"} {capability.label}
    </span>
  );
}

export function DashboardWidgets({ summary }: DashboardWidgetsProps) {
  const { workspaceAnalysis } = summary;

  return (
    <>
      <section className="panel-grid">
        <InfoCard
          title="Current Milestone"
          value={summary.currentMilestone}
          detail="Active development target for the current workspace."
        />
        <InfoCard
          title="Workspace Health"
          value={`${workspaceAnalysis.health.score}%`}
          detail="Calculated from workspace files, metadata, documentation, Git, and build setup."
        />
        <InfoCard
          title="Project Type"
          value={summary.projectType}
          detail={`Package manager: ${workspaceAnalysis.packageManager}`}
        />
      </section>

      <section className="module-panel workspace-health-panel">
        <div className="section-heading-row">
          <div>
            <h3>Workspace Intelligence</h3>
            <p>
              Workflow Studio scanned this workspace and detected its core development capabilities.
            </p>
          </div>
          <strong>{workspaceAnalysis.rootPath}</strong>
        </div>

        <div className="capability-list">
          {workspaceAnalysis.capabilities.map((capability) => (
            <CapabilityBadge capability={capability} key={capability.id} />
          ))}
        </div>

        <div className="health-columns">
          <article>
            <h4>Successes</h4>
            <ul>
              {workspaceAnalysis.health.successes.map((success) => (
                <li key={success}>{success}</li>
              ))}
            </ul>
          </article>

          <article>
            <h4>Warnings</h4>
            {workspaceAnalysis.health.warnings.length > 0 ? (
              <ul>
                {workspaceAnalysis.health.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p>No workspace warnings detected.</p>
            )}
          </article>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="detail-panel">
          <h3>Project</h3>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{summary.projectName}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{summary.projectType}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{summary.description}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-panel">
          <h3>Workspace</h3>
          <dl>
            <div>
              <dt>Git</dt>
              <dd>{workspaceAnalysis.hasGit ? "Detected" : "Not detected"}</dd>
            </div>
            <div>
              <dt>README</dt>
              <dd>{workspaceAnalysis.hasReadme ? "Detected" : "Missing"}</dd>
            </div>
            <div>
              <dt>Documentation</dt>
              <dd>{workspaceAnalysis.documentationPath ?? "Not detected"}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-panel">
          <h3>Development</h3>
          <dl>
            <div>
              <dt>Dev</dt>
              <dd>{summary.devCommand}</dd>
            </div>
            <div>
              <dt>Build</dt>
              <dd>{summary.buildCommand}</dd>
            </div>
            <div>
              <dt>Test</dt>
              <dd>{summary.testCommand}</dd>
            </div>
          </dl>
        </article>

        <article className="detail-panel next-actions-panel">
          <h3>Next Actions</h3>
          <ul>
            {summary.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}
