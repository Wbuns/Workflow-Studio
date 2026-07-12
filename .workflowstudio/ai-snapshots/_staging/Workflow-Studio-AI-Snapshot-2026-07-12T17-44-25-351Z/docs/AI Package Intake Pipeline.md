# AI Package Intake Pipeline

**Milestone:** v2.0.5.3

The Package Builder can import a generated Workflow Studio package as either a ZIP archive or an extracted package folder.

## Intake flow

1. Select or drop a generated package.
2. Extract ZIP archives into `.workflowstudio/temp/package-intake`.
3. Locate and parse `manifest.json`.
4. Verify replacement file sources and target paths.
5. Display package metadata, validation notes, and copy-ready install/build/commit commands.
6. Keep installation manual until the Development Pipeline milestone.

## Safety

Package intake does not install files. Missing sources, empty manifests, malformed entries, and unsafe target paths are blocking validation failures. Existing package installation and backup validation remain authoritative.
