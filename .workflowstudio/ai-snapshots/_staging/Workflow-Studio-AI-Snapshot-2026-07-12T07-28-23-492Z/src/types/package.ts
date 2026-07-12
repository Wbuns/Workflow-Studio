export type PackageStatus = "installed" | "available" | "pending-install" | "planned";

export type ManagedPackage = {
  id: string;
  version: string;
  status: PackageStatus;
  description: string;
  installedAt?: string;
  commitHash?: string;
};

export type PackageCommand = {
  label: string;
  command: string;
  description: string;
};

export type PackageSummary = {
  totalPackages: number;
  installedPackages: number;
  pendingPackages: number;
  packageFolder: string;
};
