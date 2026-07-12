# Workflow Studio v1.5.3 — Package Safety and Export Polish

This milestone makes package generation transparent and predictable.

## Shared eligibility

The same Electron-side classifier now drives package readiness, replacement-file preview, and final export. A file shown as packageable is the exact file copied into the generated package.

## Excluded paths

Generated and protected paths are skipped, including Workflow Studio snapshot state, `_packages`, `_backup`, `dist`, `dist-electron`, `node_modules`, coverage, caches, logs, temporary output, and PlatformIO build output.

## Transparency

The Package Builder shows packageable files, categorized skipped files, reasons for each exclusion, and summary counts before export.
