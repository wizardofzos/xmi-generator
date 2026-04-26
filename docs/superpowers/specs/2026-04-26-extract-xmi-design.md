# Extract XMI — Design Spec (v0.0.2)

**Date:** 2026-04-26

## Overview

Add an "Extract XMI" right-click context menu entry to the Explorer for `.xmi`, `.aws`, and `.het` files. It previews the file's message (if any) and contents listing in an Output Channel, asks the user to confirm, then extracts to a folder alongside the source file. Uses the bundled `xmi-reader` Python package (`extractxmi` / `xmi.cli.extract_main`).

## Architecture

Two new files:
- `python/run_extractxmi.py` — wrapper that injects `python/lib` into sys.path and calls `xmi.cli.extract_main`
- `src/extractXmi.ts` — command handler: output channel, preview steps, confirmation, folder logic, extraction

Existing files modified:
- `package.json` — new command + context menu entry with file-extension `when` clause; version bumped to `0.0.2`
- `src/extension.ts` — register `xmi-generator.extract` command

## Commands & Menu Registration

- Command ID: `xmi-generator.extract`, title: `"Extract XMI"`
- Added to `explorer/context` with:
  ```
  "when": "resourceExtname =~ /\\.(xmi|aws|het)/i"
  ```
- Existing `Generate XMI` entry unchanged (no `when` restriction)

## Command Flow

1. Create or reuse a named Output Channel `"XMI Generator"` and show it
2. Run `python3 run_extractxmi.py --message FILE`:
   - If stdout is non-empty → write to channel with header:
     ```
     === Message ===
     <content>
     ===============
     ```
   - If empty → skip (no output)
3. Run `python3 run_extractxmi.py -l FILE` → write full listing to channel
4. Show Yes/No modal: `"Extract these contents?"` — if No, abort silently
5. Derive stem folder: strip extension from filename, use same directory
   - e.g. `/path/to/MY.XMI` → `/path/to/MY`
   - If folder does **not** exist → use it as `--outputdir`
   - If folder **already exists** → open a folder picker (`showOpenDialog`) for the user to choose; if cancelled, abort silently
6. Run `python3 run_extractxmi.py FILE --outputdir <folder> -q`
7. On success → info notification: `"Extracted to: <folder>"`
8. On error → error notification with stderr content

## Error Handling

- `python3` not in PATH (ENOENT) → `"python3 not found. Please install Python 3."`
- Non-zero exit from any step → error notification with stderr
- User cancels confirm dialog → silently abort
- User cancels folder picker → silently abort

## Version

`package.json` version bumped from `0.0.1` → `0.0.2`.

## Testing

Manual via F5. No automated tests — thin CLI wrapper.
