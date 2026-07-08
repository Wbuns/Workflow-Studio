import type { NavigationItem } from "../../types/navigation";

type PlaceholderPageProps = {
    activePage: NavigationItem;
};

export function PlaceholderPage({ activePage }: PlaceholderPageProps) {
    return (
        <>
            <section className="hero-panel">
                <p className="eyebrow">{activePage.eyebrow}</p>
                <h2>{activePage.description}</h2>
                <p>
                    This page is a stable placeholder for the future{" "}
                    <strong>{activePage.label}</strong> module. Functionality will be
                    added milestone by milestone.
                </p>
            </section>

            <section className="module-panel">
                <h3>{activePage.label} Module</h3>
                <p>
                    The {activePage.label} page is connected to the main navigation. Its
                    backend behavior will be implemented after the shell architecture is
                    complete.
                </p>
                <div className="module-checklist">
                    <span>Navigation connected</span>
                    <span>Placeholder page ready</span>
                    <span>Feature boundary established</span>
                </div>
            </section>
        </>
    );
}