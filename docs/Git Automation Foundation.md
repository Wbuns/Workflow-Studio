# Git Automation Foundation

Developer Tools can now prepare reviewed commits and push the active branch.

## Safety rules

- The active workspace must be a Git repository.
- A successful Developer Tools build is required before committing.
- The working tree must contain changes.
- A non-empty commit message is required.
- Push requires an `origin` remote.
- Existing upstream branches use `git push`.
- Branches without an upstream use `git push -u origin <branch>`.

Commit and push remain separate actions so the developer keeps control.
