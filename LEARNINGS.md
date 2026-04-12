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

---

## Node version mismatch (Claude Code environment runs Node 22, repo requires >=24)

**Symptom:** `npm install` fails with a Node engine version error, preventing devDependencies from being installed. This breaks the pre-commit hook (lefthook + biome), which allows lint errors to reach CI undetected.

**Cause:** Claude Code's execution environment runs **Node 22**. The repo's `package.json` declares `"engines": { "node": ">=24" }`. When `.npmrc` contained `engine-strict=true`, npm hard-failed on version mismatch.

**Fix applied:** Removed `engine-strict=true` from `.npmrc`. The `engines` field in `package.json` is retained as documentation of the intended Node version, but no longer blocks installation.

**Secondary issue — biome not on `$PATH`:** The `lefthook.yml` pre-commit hook runs `biome check --write {staged_files} || true`. In this environment, biome is only available at `node_modules/.bin/biome`, not as a global. The `|| true` means the hook silently no-ops instead of blocking the commit. To manually lint before committing:
```bash
node_modules/.bin/biome check --write .
```
