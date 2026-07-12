# Automation History and Operation Log

Workflow Studio records developer-tool operations in the Electron user-data directory.

Each record contains:

- operation type and label,
- active workspace or root path,
- start and finish timestamps,
- duration when available,
- success, failure, or started state,
- package identity and diagnostic details when relevant.

History is capped at 250 records and can be refreshed or cleared from Developer Tools. It is stored independently from project metadata so switching or removing projects does not erase the audit trail.
