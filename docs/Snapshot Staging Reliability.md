# Snapshot Staging Reliability

Workflow Studio now isolates AI snapshot staging folders from Vite file watching and removes temporary folders with Windows-friendly retry handling. If a preferred staging folder remains locked, snapshot creation uses a unique fallback folder rather than failing. Cleanup is attempted after every compression operation.

This milestone changes no snapshot archive format or user interface behavior.
