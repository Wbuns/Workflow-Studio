import type { NavigationItem } from "../../types/navigation";

type PackagesPageProps = {
  activePage: NavigationItem;
};

export function PackagesPage({ activePage }: PackagesPageProps) {
  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.description}</h2>
        <p>
          The package manager connects Workflow Studio's package tooling to the
          desktop interface. This module will grow into package creation,
          installation, validation, rollback, and package history.
        </p>
      </section>

      <section className="panel-grid">
        <article className="info-panel">
          <h3>Package Tools</h3>
          <p>Ready</p>
          <span>PowerShell package tooling exists under tools/package.</span>
        </article>

        <article className="info-panel">
          <h3>Package Folder</h3>
          <p>_packages</p>
          <span>Generated and installed packages are stored locally.</span>
        </article>

        <article className="info-panel">
          <h3>Next Step</h3>
          <p>Package UI</p>
          <span>Create buttons for package creation, validation, and install.</span>
        </article>
      </section>
    </>
  );
}