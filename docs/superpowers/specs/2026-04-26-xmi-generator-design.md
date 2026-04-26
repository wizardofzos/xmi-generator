# XMI Generator VSCode Extension — Design Spec

**Date:** 2026-04-26

## Overview

A VSCode extension that adds a right-click context menu item ("Generate XMI") to files and folders in the Explorer. It invokes the `createxmi` CLI from the `xmi-reader` Python package to produce a `.XMI` file alongside the source.

## Architecture

Two source files:

- `src/extension.ts` — activates the extension, registers the `xmi-generator.generate` command
- `src/generateXmi.ts` — all logic: sequential prompts, globalState persistence, shell invocation, notifications

## Commands & Menu Registration (package.json)

- Remove the existing `xmi-generator.helloWorld` command
- Register `xmi-generator.generate` with title `"Generate XMI"`
- Add to `explorer/context` menu with no `when` restriction (works on files and folders)

## Prompt Flow

When the command is invoked via right-click:

1. **DSN** — `showInputBox`, placeholder `"MY.PDS"`, no initial default, persisted to `globalState` after use
2. **from-user** — `showInputBox`, default `XMIGEN` on first run, then last-used value from `globalState`
3. **from-system** — `showInputBox`, default `VSCODE` on first run, then last-used value from `globalState`
4. If the user cancels (escapes) any prompt — silently abort with no notification

## Shell Invocation

Build output path: same directory as source, same base name + `.XMI` extension.

```
createxmi <sourcePath> -o <outputPath> --dsn <dsn> --from-user <fromUser> --from-system <fromSystem>
```

Uses Node's `child_process.execFile` (or `exec`) with the resolved source URI path.

## Notifications

- **Success:** info message — `"Generated: /abs/path/to/output.XMI"`
- **Non-zero exit:** error message with stderr content
- **`createxmi` not found in PATH:** error message — `"xmi-reader not found. Install with: pip install xmi-reader"`

## State Persistence

Keys in `context.globalState`:

| Key | First-run default |
|-----|-------------------|
| `xmi-generator.dsn` | `""` (empty) |
| `xmi-generator.fromUser` | `XMIGEN` |
| `xmi-generator.fromSystem` | `VSCODE` |

## Testing

Manual testing via F5 (Extension Development Host). No automated tests — the extension is a thin CLI wrapper.
