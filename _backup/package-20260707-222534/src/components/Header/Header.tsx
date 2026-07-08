import type { NavigationItem } from "../../types/navigation";

type HeaderProps = {
    activePage: NavigationItem;
};

export function Header({ activePage }: HeaderProps) {
    return (
        <header className="app-header">
            <div>
                <p className="eyebrow">Workflow Studio</p>
                <h1>{activePage.title}</h1>
            </div>
            <button className="primary-button" type="button">
                {activePage.actionLabel}
            </button>
        </header>
    );
}