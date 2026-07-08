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

export function DashboardWidgets({ summary }: DashboardWidgetsProps) {
  return (
    <>
      <section className="panel-grid">
        <InfoCard
          title="Current Milestone"
          value={summary.currentMilestone}
          detail="Active development target for the current workspace."
        />
        <InfoCard
          title="Project Version"
          value={summary.version}
          detail={summary.projectType}
        />
        <InfoCard
          title="Git"
          value={summary.gitEnabled ? "Enabled" : "Disabled"}
          detail="Source control awareness for safer milestone commits."
        />
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
              <dt>Packages</dt>
              <dd>{summary.packageFolder}</dd>
            </div>
            <div>
              <dt>Backups</dt>
              <dd>{summary.backupFolder}</dd>
            </div>
            <div>
              <dt>Documentation Paths</dt>
              <dd>{summary.documentationCount}</dd>
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
