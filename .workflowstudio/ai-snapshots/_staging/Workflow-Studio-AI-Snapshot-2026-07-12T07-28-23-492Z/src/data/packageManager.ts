import type { ManagedPackage, PackageCommand, PackageSummary } from "../types/package";

export const managedPackages: ManagedPackage[] = [
  {
    id: "workflowstudio-v0.3.0-shell-architecture",
    version: "0.3.0",
    status: "installed",
    description: "Refactored the app shell into reusable components and feature folders.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.3.1-package-tools-foundation",
    version: "0.3.1",
    status: "installed",
    description: "Added package builder, installer, and validation tooling.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.3.2-workspace-metadata-foundation",
    version: "0.3.2",
    status: "installed",
    description: "Added .workflowstudio metadata files for project identity and history.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.4.0-workspace-engine",
    version: "0.4.0",
    status: "installed",
    description: "Added the first workspace metadata engine and dashboard data bridge.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.5.0-workspace-feature-pack",
    version: "0.5.0",
    status: "installed",
    description: "Added real workspace dashboard metadata and next action summaries.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.6.0-workspace-window-polish",
    version: "0.6.0",
    status: "installed",
    description: "Polished Electron startup and maximized the workspace window by default.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.7.0-project-manager-feature-pack",
    version: "0.7.0",
    status: "installed",
    description: "Added Project Manager page, current workspace summary, and recent projects.",
    installedAt: "2026-07-07",
  },
  {
    id: "workflowstudio-v0.8.0-package-manager-feature-pack",
    version: "0.8.0",
    status: "installed",
    description: "Adds Package Manager UI, package history, commands, and package status summaries.",
    installedAt: "2026-07-08",
  },
];

export const packageCommands: PackageCommand[] = [
  {
    label: "Create Package",
    command: '.\\tools\\package\\new-package.ps1 -Name "example" -Version "0.8.1" -Description "Example milestone"',
    description: "Create a new package skeleton in the _packages folder.",
  },
  {
    label: "Validate Package",
    command: '.\\tools\\package\\validate-package.ps1 -PackagePath ".\\_packages\\PACKAGE_NAME"',
    description: "Check that a package has a valid manifest and required files.",
  },
  {
    label: "Install Package",
    command: '.\\tools\\package\\install-package.ps1 -PackagePath ".\\_packages\\PACKAGE_NAME"',
    description: "Install a package with validation and backup support.",
  },
];

export const packageSummary: PackageSummary = {
  totalPackages: managedPackages.length,
  installedPackages: managedPackages.filter((pkg) => pkg.status === "installed").length,
  pendingPackages: managedPackages.filter((pkg) => pkg.status === "pending-install").length,
  packageFolder: "_packages",
};
