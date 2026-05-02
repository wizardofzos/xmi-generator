# XMI Generator

Generate and extract TSO XMIT (`.XMI`) mainframe files right from the VS Code Explorer.

## Requirements

- **Python 3** must be available as `python3` on your PATH.
- The `xmi-reader` Python package and its dependencies are **bundled inside the extension** — no `pip install` needed.

## Generate XMI

Right-click any file or folder in the Explorer and select **Generate XMI**. You'll be prompted for three values, all remembered for next time:

| Prompt | Description | Default |
|--------|-------------|---------|
| Dataset name (DSN) | Mainframe dataset name embedded in the XMI metadata | _(empty)_ |
| from-user | Originating user ID recorded in ISPF stats | `XMIGEN` |
| from-node | Originating node name | `VSCODE` |

The `.XMI` file is created alongside the source — `myfile.jcl` → `myfile.XMI`, `myfolder/` → `myfolder.XMI`.

## Extract XMI

Right-click any `.XMI`, `.AWS`, or `.HET` file and select **Extract XMI**.

The Output Channel shows:
- The embedded message (if any)
- The full contents listing

Confirm to extract. The contents are extracted into the same folder as the source file, using the PDS dataset name as the folder name (e.g. `TEST.XMI` → `TEST.PDS/`).

## Release Notes

### 0.0.9

Updated to xmi-reader 1.0.3 for fixing some PDS edge case errors.

### 0.0.8

Fixed Python 3.14 crash on startup — properly patched `prettytable` type alias incompatibility.

### 0.0.7

Fixed compatibility with Python 3.14 — patched bundled `prettytable` to use lazy annotation evaluation.

### 0.0.6

Fixed extraction failing silently on machines without `libmagic` — now shows a clear install hint for macOS, Ubuntu, Fedora, and Windows.

### 0.0.5

Bumped bundled `xmi-reader` to 1.0.2.

### 0.0.4

Fixed `libmagic` error on machines without it installed — bundled `python-magic-bin` where available and added a clear per-platform install hint for all other systems.

### 0.0.3

Fixed extraction folder — contents now land in the PDS dataset name folder directly alongside the source file.

### 0.0.2

Added **Extract XMI** — right-click `.XMI`, `.AWS`, `.HET` files to preview and extract contents.

### 0.0.1

Initial release — **Generate XMI** from file or folder via Explorer context menu.
