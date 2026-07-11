import { packageCommands, packageSummary, managedPackages } from "../../data/packageManager";
import type { NavigationItem } from "../../types/navigation";
import type { ManagedPackage } from "../../types/package";

type PackageManagerPageProps = {
  activePage: NavigationItem;
};

function getStatusLabel(pkg: ManagedPackage) {
  switch (pkg.status) {
    case "installed":
      return "Installed";
    case "pending-install":
      return "Pending";
    case "available":
      return "Available";
    case "planned":
      return "Planned";
    default:
      return pkg.status;
  }
}

export function PackageManagerPage({ activePage }: PackageManagerPageProps) {
  return (
    <>
      <section className="hero-panel package-hero">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Package Manager</h2>
        <p>
          Manage milestone packages as documented, installable, reversible units
          of work. This page connects the package workflow to the desktop shell.
        </p>
      </section>

      <section className="package-summary-grid">
        <article className="info-panel">
          <h3>Total Packages</h3>
          <p>{packageSummary.totalPackages}</p>
          <span>Tracked milestone packages in this workspace.</span>
        </article>
        <article className="info-panel">
          <h3>Installed</h3>
          <p>{packageSummary.installedPackages}</p>
          <span>Packages already applied to the current project.</span>
        </article>
        <article className="info-panel">
          <h3>Pending</h3>
          <p>{packageSummary.pendingPackages}</p>
          <span>Packages waiting for validation or installation.</span>
        </article>
        <article className="info-panel">
          <h3>Package Folder</h3>
          <p>{packageSummary.packageFolder}</p>
          <span>Default local folder for generated packages.</span>
        </article>
      </section>

      <section className="package-layout">
        <article className="module-panel package-history-panel">
          <h3>Package History</h3>
          <div className="package-list">
            {managedPackages.map((pkg) => (
              <article className="package-card" key={pkg.id}>
                <div>
                  <strong>{pkg.id}</strong>
                  <span>{pkg.description}</span>
                </div>
                <dl>
                  <div>
                    <dt>Version</dt>
                    <dd>{pkg.version}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{getStatusLabel(pkg)}</dd>
                  </div>
                  <div>
                    <dt>Installed</dt>
                    <dd>{pkg.installedAt ?? "Not recorded"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </article>

        <article className="module-panel package-commands-panel">
          <h3>Package Commands</h3>
          <div className="command-list">
            {packageCommands.map((command) => (
              <article className="command-card" key={command.label}>
                <strong>{command.label}</strong>
                <code>{command.command}</code>
                <span>{command.description}</span>
              </article>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
