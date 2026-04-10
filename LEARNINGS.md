# Learnings

Ongoing notes on non-obvious issues and fixes discovered during development.

---

## VS Code bootloader error in GitHub Codespaces

**Symptom:** Running `claude` (or other Node-based CLI tools) in the terminal throws an error like `Cannot find module '.../bootloader.js'`.

**Cause:** VS Code injects a `NODE_OPTIONS` environment variable that points to its JavaScript debugger bootloader. When running CLI tools outside of a VS Code debug session (e.g., in the integrated terminal), that path doesn't exist and Node fails to start.

**Fix:** Unset the variable before running the affected command:
```bash
unset NODE_OPTIONS
claude setup-token
```

This is a VS Code issue, not a Claude or Node issue. It only affects the current terminal session — opening a new terminal or rebuilding the codespace resets it.
