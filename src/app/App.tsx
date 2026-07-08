import { useState } from "react";
import { Header } from "../components/Header/Header";
import { Sidebar } from "../components/Sidebar/Sidebar";
import { StatusBar } from "../components/StatusBar/StatusBar";
import { Workspace } from "../components/Workspace/Workspace";
import { navigationItems } from "../data/navigation";
import "./App.css";

function App() {
  const [activePageId, setActivePageId] = useState("dashboard");

  const activePage =
    navigationItems.find((item) => item.id === activePageId) ??
    navigationItems[0];

  return (
    <div className="app-shell">
      <Header activePage={activePage} />
      <Sidebar
        activePageId={activePageId}
        navigationItems={navigationItems}
        onNavigate={setActivePageId}
      />
      <Workspace activePage={activePage} />
      <StatusBar activePage={activePage} />
    </div>
  );
}

export default App;
