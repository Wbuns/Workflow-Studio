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
      <section className="module-panel continue-panel">
        <h3>Continue Development</h3>
        <p>
          Resume <strong>{summary.session.activeProject}</strong> at{" "}
          <strong>{summary.session.currentTask}</strong>.
        </p>

        <div className="module-checklist">
          <span>Milestone: {summary.session.activeMilestone}</span>
          <span>Next: {summary.session.nextTask}</span>
          <span>Build: {summary.session.lastBuild}</span>
          <span>Git: {summary.session.gitStatus}</span>
        </div>
      </section>

      <section className="panel-grid">
        <InfoCard
          title="Current Task"
          value={summary.session.currentTask}
          detail="Active development session focus."
        />
        <InfoCard
          title="Next Task"
          value={summary.session.nextTask}
          detail="Suggested follow-up after the current session."
        />
        <InfoCard
          title="Git"
          value={summary.session.gitStatus}
          detail="Session-level source control status."
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
          <h3>Session Notes</h3>
          <ul>
            {summary.session.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      </section>
    </>
  );
}