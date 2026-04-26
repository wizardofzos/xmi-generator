# XMI Generator VSCode Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VSCode extension that right-click generates `.XMI` mainframe files from a file or folder using the bundled `xmi-reader` Python package.

**Architecture:** A single `xmi-generator.generate` command registered on `explorer/context` invokes a prompt flow (DSN, from-user, from-system) then shells out to a bundled Python wrapper that calls `xmi.cli:create_main`. The Python package and its dependencies are bundled inside the extension's `python/lib/` directory so users need only Python 3 installed.

**Tech Stack:** TypeScript, VSCode Extension API, Node.js `child_process.execFile`, Python 3, xmi-reader 1.0.1

---

### Task 1: Bundle xmi-reader and its dependencies

**Files:**
- Create: `python/run_createxmi.py`
- Create: `python/lib/` (populated by pip, not hand-written)
- Modify: `package.json` (add `install-python` and `postinstall` scripts)

- [ ] **Step 1: Install xmi-reader into the extension's python/lib directory**

```bash
pip3 install xmi-reader --target ./python/lib
```

Expected output: several packages installed — `xmi`, `ebcdic`, `magic`, `prettytable`, `wcwidth` visible under `python/lib/`.

- [ ] **Step 2: Create the Python wrapper script**

Create `python/run_createxmi.py` with this exact content:

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))
from xmi.cli import create_main
if __name__ == '__main__':
    create_main()
```

- [ ] **Step 3: Verify the wrapper works**

```bash
python3 python/run_createxmi.py --help
```

Expected: usage/help output from createxmi (no import errors).

- [ ] **Step 4: Add install-python script to package.json**

In `package.json`, add to `"scripts"`:

```json
"install-python": "pip3 install xmi-reader --target ./python/lib --upgrade",
"vscode:prepublish": "pnpm run install-python && pnpm run package"
```

And update the existing `"vscode:prepublish"` line (replace it — don't add a duplicate).

- [ ] **Step 5: Add python/lib to .gitignore**

Create `.gitignore` (it shows as untracked in git status, so it exists but may be empty):

Read the current `.gitignore` first, then append:
```
python/lib/
```

- [ ] **Step 6: Commit**

```bash
git add python/run_createxmi.py .gitignore package.json
git commit -m "feat: bundle xmi-reader Python package"
```

---

### Task 2: Update package.json — commands and context menu

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Replace the contributes section in package.json**

Replace the entire `"contributes"` block with:

```json
"contributes": {
  "commands": [
    {
      "command": "xmi-generator.generate",
      "title": "Generate XMI"
    }
  ],
  "menus": {
    "explorer/context": [
      {
        "command": "xmi-generator.generate",
        "group": "navigation"
      }
    ]
  }
}
```

- [ ] **Step 2: Verify package.json is valid JSON**

```bash
node -e "require('./package.json'); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: register generate command and explorer context menu"
```

---

### Task 3: Create src/generateXmi.ts

**Files:**
- Create: `src/generateXmi.ts`

- [ ] **Step 1: Create the file with this exact content**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import { execFile } from 'child_process';

const STATE_KEYS = {
    dsn: 'xmi-generator.dsn',
    fromUser: 'xmi-generator.fromUser',
    fromSystem: 'xmi-generator.fromSystem',
};

const DEFAULTS = {
    dsn: '',
    fromUser: 'XMIGEN',
    fromSystem: 'VSCODE',
};

export async function generateXmi(
    context: vscode.ExtensionContext,
    uri: vscode.Uri
): Promise<void> {
    const sourcePath = uri.fsPath;

    const dsn = await vscode.window.showInputBox({
        prompt: 'Dataset name (DSN)',
        placeHolder: 'MY.PDS',
        value: context.globalState.get<string>(STATE_KEYS.dsn, DEFAULTS.dsn),
    });
    if (dsn === undefined) { return; }

    const fromUser = await vscode.window.showInputBox({
        prompt: 'ISPF owner (from-user)',
        value: context.globalState.get<string>(STATE_KEYS.fromUser, DEFAULTS.fromUser),
    });
    if (fromUser === undefined) { return; }

    const fromSystem = await vscode.window.showInputBox({
        prompt: 'System name (from-system)',
        value: context.globalState.get<string>(STATE_KEYS.fromSystem, DEFAULTS.fromSystem),
    });
    if (fromSystem === undefined) { return; }

    await context.globalState.update(STATE_KEYS.dsn, dsn);
    await context.globalState.update(STATE_KEYS.fromUser, fromUser);
    await context.globalState.update(STATE_KEYS.fromSystem, fromSystem);

    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const outputPath = path.join(path.dirname(sourcePath), baseName + '.XMI');
    const pythonScript = path.join(context.extensionPath, 'python', 'run_createxmi.py');

    execFile('python3', [
        pythonScript,
        sourcePath,
        '-o', outputPath,
        '--dsn', dsn,
        '--from-user', fromUser,
        '--from-system', fromSystem,
    ], (_error, _stdout, stderr) => {
        if (_error) {
            if ((_error as NodeJS.ErrnoException).code === 'ENOENT') {
                vscode.window.showErrorMessage('python3 not found. Please install Python 3.');
            } else {
                vscode.window.showErrorMessage(`XMI generation failed: ${stderr || _error.message}`);
            }
            return;
        }
        vscode.window.showInformationMessage(`Generated: ${outputPath}`);
    });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm run check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/generateXmi.ts
git commit -m "feat: add generateXmi command handler with prompt flow"
```

---

### Task 4: Update src/extension.ts

**Files:**
- Modify: `src/extension.ts`

- [ ] **Step 1: Replace the file content**

```typescript
import * as vscode from 'vscode';
import { generateXmi } from './generateXmi';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'xmi-generator.generate',
        (uri: vscode.Uri) => generateXmi(context, uri)
    );
    context.subscriptions.push(disposable);
}

export function deactivate() {}
```

- [ ] **Step 2: Type-check and lint**

```bash
pnpm run check-types && pnpm run lint
```

Expected: no errors.

- [ ] **Step 3: Build**

```bash
pnpm run compile
```

Expected: `dist/extension.js` is created with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/extension.ts
git commit -m "feat: wire generate command into extension activate"
```

---

### Task 5: Update .vscodeignore

**Files:**
- Modify: `.vscodeignore`

The current `.vscodeignore` does not exclude `python/`, which means it will be included in the packaged extension. We need to make sure `python/lib/` is included but the dist-info metadata can be trimmed to reduce size.

- [ ] **Step 1: Read the current .vscodeignore**

Read `/Users/henri/repos/xmi-generator/.vscodeignore` and verify `python/` is NOT in the ignore list.

- [ ] **Step 2: Add exclusions for Python cache files only**

Append to `.vscodeignore`:

```
python/lib/**/__pycache__/**
python/lib/**/*.pyc
python/lib/**/*.pyi
python/lib/**/*.dist-info/RECORD
```

This keeps the Python source files (needed at runtime) while dropping compiled bytecode and type stubs.

- [ ] **Step 3: Commit**

```bash
git add .vscodeignore
git commit -m "chore: exclude Python bytecode from packaged extension"
```

---

### Task 6: Manual end-to-end test

- [ ] **Step 1: Open the extension in Extension Development Host**

Press `F5` in VSCode (or run `code --extensionDevelopmentPath=.` from the project root).

- [ ] **Step 2: Create a test file**

In the Extension Development Host window, create a file `test.jcl` with any content.

- [ ] **Step 3: Right-click the file in the Explorer**

You should see **"Generate XMI"** in the context menu.

- [ ] **Step 4: Fill in the prompts**

- DSN: `MY.TEST`
- from-user: `XMIGEN` (pre-filled)
- from-system: `VSCODE` (pre-filled)

- [ ] **Step 5: Verify output**

`test.XMI` should appear next to `test.jcl` in the Explorer. An info notification should show `Generated: /path/to/test.XMI`.

- [ ] **Step 6: Re-run to verify defaults are remembered**

Right-click again — all three fields should be pre-filled with the values from Step 4.

- [ ] **Step 7: Test with a folder**

Right-click a folder → Generate XMI → fill prompts → verify `<foldername>.XMI` appears next to the folder.
