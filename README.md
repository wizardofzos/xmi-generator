# XMI Generator

Generate TSO XMIT (`.XMI`) mainframe files from any file or folder — right from the VS Code Explorer.

## Features

Right-click any file or folder in the Explorer and select **Generate XMI**. You'll be prompted for three values, all remembered for next time:

| Prompt | Description | Default |
|--------|-------------|---------|
| Dataset name (DSN) | Mainframe dataset name embedded in the XMI metadata | _(empty)_ |
| from-user | Originating user ID recorded in ISPF stats | `XMIGEN` |
| from-node | Originating node name | `VSCODE` |

The `.XMI` file is created alongside the source — `myfile.jcl` → `myfile.XMI`, `myfolder/` → `myfolder.XMI`.

## Requirements

- **Python 3** must be available as `python3` on your PATH.
- The `xmi-reader` Python package and its dependencies are **bundled inside the extension** — no `pip install` needed by end users.

## Development

### Setup

```bash
pnpm install
pnpm run install-python   # bundles xmi-reader into python/lib/
```

### Run / Debug

Press `F5` to launch the Extension Development Host with the extension loaded.

### Build

```bash
make compile      # type-check, lint, and build dist/
make package      # create xmi-generator-x.x.x.vsix
make install      # install the .vsix into VS Code
```

Or directly with pnpm:

```bash
pnpm run compile
pnpm exec vsce package
```

## Publishing to the Marketplace

### One-time setup

1. Create a publisher at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
2. Add your publisher ID to `package.json`:
   ```json
   "publisher": "your-publisher-id"
   ```
3. Create a Personal Access Token at [dev.azure.com](https://dev.azure.com) with **Marketplace → Manage** scope
4. Log in:
   ```bash
   make login PUBLISHER=your-publisher-id
   ```

### Publish

```bash
make publish
```

## Release Notes

### 0.0.1

Initial release — Generate XMI from file or folder via Explorer context menu.
