import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import {
  listWorkspacePackages,
  type WorkspacePackageEntry,
} from "../../services/PackageLibraryService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type PackagesPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

function formatKind(kind: WorkspacePackageEntry["kind"]) {
  if (kind === "package-folder") return "Package";
  if (kind === "backup-folder") return "Backup";
  return "History";
}

export function PackagesPage({ activePage, rootPath }: PackagesPageProps) {
  const [entries, setEntries] = useState<WorkspacePackageEntry[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    listWorkspacePackages(rootPath).then((nextEntries) => {
      if (isMounted) {
        setEntries(nextEntries);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rootPath]);

  async function handleOpenPath(relativePath: string) {
    const result = await openWorkspacePath(rootPath, relativePath);
    setStatus(result.message);
  }

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Packages</h2>
        <p>
          <strong>Package discovery is active.</strong> This page now shows local package
          folders, backup folders, and package history found in the selected workspace.
        </p>
      </section>

      <section className="detail-panel library-panel">
        <div className="library-panel-header">
          <h3>Workspace Package Library</h3>
          {status && <span>{status}</span>}
        </div>

        {entries === null ? (
          <p className="empty-state">Scanning package folders.</p>
        ) : entries.length > 0 ? (
          <div className="library-list">
            {entries.map((entry) => (
              <article className="library-card" key={`${entry.kind}-${entry.path}-${entry.name}`}>
                <div>
                  <strong>{entry.name}</strong>
                  <span>{entry.path}</span>
                  <p>{entry.detail}</p>
                </div>
                <div className="library-card-actions">
                  <mark>{formatKind(entry.kind)}</mark>
                  <button className="secondary-button" onClick={() => handleOpenPath(entry.path)}>
                    Open
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">
            No packages or backups were detected yet. Add packages under _packages or install
            milestone packages to populate this page.
          </p>
        )}
      </section>
    </>
  );
}
