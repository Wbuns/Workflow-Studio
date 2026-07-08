import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import {
  listDocumentation,
  type DocumentationEntry,
} from "../../services/DocumentationService";
import { openWorkspacePath } from "../../services/WorkspaceOpenService";

type DocumentationPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

function formatKind(kind: DocumentationEntry["kind"]) {
  if (kind === "readme") return "README";
  if (kind === "docs") return "Docs";
  if (kind === "metadata") return "Metadata";
  if (kind === "prompt") return "Prompt";
  return "Template";
}

export function DocumentationPage({ activePage, rootPath }: DocumentationPageProps) {
  const [entries, setEntries] = useState<DocumentationEntry[] | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isMounted = true;

    listDocumentation(rootPath).then((nextEntries) => {
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
        <h2>Documentation</h2>
        <p>
          <strong>Documentation discovery is active.</strong> This page lists Markdown
          knowledge files found in the selected workspace and can open them in the operating
          system default editor.
        </p>
      </section>

      <section className="detail-panel documentation-panel">
        <div className="library-panel-header">
          <h3>Detected Documents</h3>
          {status && <span>{status}</span>}
        </div>

        {entries === null ? (
          <p className="empty-state">Scanning documentation paths.</p>
        ) : entries.length > 0 ? (
          <div className="documentation-list">
            {entries.map((entry) => (
              <article className="documentation-card" key={`${entry.kind}-${entry.path}`}>
                <div>
                  <strong>{entry.title}</strong>
                  <span>{entry.path}</span>
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
            No Markdown documentation was detected yet. Add README.md or docs/*.md to make this
            workspace easier to resume.
          </p>
        )}
      </section>
    </>
  );
}
