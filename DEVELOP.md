# Development Guide

## Setup

```bash
npm install               # or: pnpm install
npm run install-python    # bundles xmi-reader into python/lib/
```

## Run / Debug

Press `F5` to launch the Extension Development Host with the extension loaded.

## Build & Package

```bash
make compile      # type-check, lint, and build dist/
make package      # create xmi-generator-x.x.x.vsix
make install      # install the .vsix into VS Code locally
```

Or directly with npm:

```bash
npm run compile
npm exec vsce package
```

## Publishing (VSIX)

Attach the `.vsix` from `make package` to a GitHub Release. Users install it via:

- Extensions panel → `⋯` → **Install from VSIX…**
- or `code --install-extension xmi-generator-x.x.x.vsix`

## Bumping the Version

Update `"version"` in `package.json` and add a release note to `README.md`.
