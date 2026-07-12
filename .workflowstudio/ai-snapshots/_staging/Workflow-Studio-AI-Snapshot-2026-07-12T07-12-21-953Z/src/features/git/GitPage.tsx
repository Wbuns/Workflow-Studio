import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import { getGitStatus, type GitStatus } from "../../services/GitService";

type GitPageProps = {
  activePage: NavigationItem;
  rootPath?: string;
};

function getStatusLabel(status: GitStatus["status"]) {
  if (status === "clean") return "Clean";
  if (status === "dirty") return "Changes Detected";
  return "Not a Repository";
}

export function GitPage({ activePage, rootPath }: GitPageProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    getGitStatus(rootPath).then((nextStatus) => {
      if (isMounted) {
        setGitStatus(nextStatus);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [rootPath]);

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Git Status</h2>
        <p>
          <strong>Source control is connected.</strong> Workflow Studio now reads the selected
          workspace instead of showing a placeholder Git page.
        </p>
      </section>

      {gitStatus ? (
        <section className="git-layout">
          <article className="detail-panel">
            <h3>Repository</h3>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>{getStatusLabel(gitStatus.status)}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{gitStatus.branch}</dd>
              </div>
              <div>
                <dt>Summary</dt>
                <dd>{gitStatus.summary}</dd>
              </div>
            </dl>
          </article>

          <article className="detail-panel git-files-panel">
            <h3>Changed Files</h3>
            {gitStatus.changedFiles.length > 0 ? (
              <ul className="file-list">
                {gitStatus.changedFiles.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                {gitStatus.isRepository
                  ? "No changed files detected. This workspace is ready for a clean milestone commit."
                  : "Open a folder with a .git directory to view repository status."}
              </p>
            )}
          </article>
        </section>
      ) : (
        <section className="module-panel">
          <h3>Loading Git Status</h3>
          <p>Checking the selected workspace repository.</p>
        </section>
      )}
    </>
  );
}
