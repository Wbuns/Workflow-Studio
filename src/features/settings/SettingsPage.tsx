import type { NavigationItem } from "../../types/navigation";

type SettingsPageProps = {
  activePage: NavigationItem;
};

export function SettingsPage({ activePage }: SettingsPageProps) {
  return (
    <>
      <section className="hero-panel">
        <p className="eyebrow">{activePage.eyebrow}</p>
        <h2>Settings</h2>
        <p>
          <strong>Settings are planned for a later milestone.</strong> For now, this page records
          the highest-value options we already know we want.
        </p>
      </section>

      <section className="settings-grid">
        <article className="detail-panel">
          <h3>Display</h3>
          <dl>
            <div>
              <dt>UI Scale</dt>
              <dd>Planned — useful for reducing scroll on dense pages and large monitors.</dd>
            </div>
            <div>
              <dt>Compact Mode</dt>
              <dd>Planned — tighter cards, smaller spacing, and more information above the fold.</dd>
            </div>
          </dl>
        </article>

        <article className="detail-panel">
          <h3>Workspace</h3>
          <dl>
            <div>
              <dt>Recent Workspaces</dt>
              <dd>Active — stored locally and selectable from the header.</dd>
            </div>
            <div>
              <dt>Open Folder</dt>
              <dd>Active — uses the Electron folder picker and scans the chosen project.</dd>
            </div>
          </dl>
        </article>
      </section>
    </>
  );
}
