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

---

## `npm ci` fails with missing optional platform-specific transitive deps

**Symptom:** `npm ci` fails with `Missing: @emnapi/runtime@x.x.x from lock file` (or similar packages like `@emnapi/core`).

**Cause:** npm 11 bug — optional platform-specific packages (e.g. `@rolldown/binding-wasm32-wasi`, a Vite 8 / Rolldown wasm32 binding) have their dependencies written into the lock file even when the package itself is not installed on the current platform. `npm ci` then sees unresolved entries and fails. Regenerating the lock file with `npm install` does not fix this.

**Fix:** Explicitly add the missing packages as `devDependencies` (not `optionalDependencies`):
```bash
npm install --save-dev @emnapi/core@1.9.2 @emnapi/runtime@1.9.2
```

Using `--save-optional` does NOT work — npm won't resolve optional packages it deems unneeded for the current platform, so the lock file entries still won't be created. Using `--save-dev` forces npm to resolve and install them unconditionally, creating the required lock file entries. They are tiny pure-JS packages with no platform restrictions, so installing them as devDependencies has no meaningful cost.
