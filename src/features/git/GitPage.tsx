import { useEffect, useState } from "react";
import type { NavigationItem } from "../../types/navigation";
import type { GitStatus } from "../../types/git";
import { getGitStatus } from "../../services/GitService";
import "./GitPage.css";

type GitPageProps = {
  activePage: NavigationItem;
};

export function GitPage({ activePage }: GitPageProps) {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);

  useEffect(() => {
    getGitStatus().then(setGitStatus);
  }, []);

  const workingTreeLabel = gitStatus?.clean ? "Clean" : "Changes Detected";

  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>{activePage.description}</h2>
        <p>
          Git Assistant is not meant to replace Git. It gives quick visibility
          into project status so every milestone stays clean before commit.
        </p>
      </section>

      <section className="git-grid">
        <article className="info-panel">
          <h3>Branch</h3>
          <p>{gitStatus?.branch ?? "Loading..."}</p>
          <span>Current working branch.</span>
        </article>

        <article className="info-panel">
          <h3>Working Tree</h3>
          <p>{gitStatus ? workingTreeLabel : "Loading..."}</p>
          <span>
            {gitStatus?.clean
              ? "No pending changes detected after the last commit."
              : "Pending changes are waiting to be reviewed."}
          </span>
        </article>

        <article className="info-panel">
          <h3>Last Commit</h3>
          <p>{gitStatus?.lastCommit || "No commit detected"}</p>
          <span>Most recent milestone commit.</span>
        </article>
      </section>

      <section className="git-layout">
        <article className="module-panel">
          <h3>Repository Summary</h3>
          <div className="module-checklist">
            <span>Modified files: {gitStatus?.modified ?? 0}</span>
            <span>Staged files: {gitStatus?.staged ?? 0}</span>
            <span>Untracked files: {gitStatus?.untracked ?? 0}</span>
            <span>Status: {gitStatus ? workingTreeLabel : "Loading..."}</span>
          </div>
        </article>

        <article className="module-panel">
          <h3>Suggested Commit</h3>
          <p>Add Git Assistant foundation</p>
        </article>
      </section>
    </>
  );
}