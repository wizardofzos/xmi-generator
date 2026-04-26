# Extract XMI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Extract XMI" to the Explorer right-click menu for `.xmi`, `.aws`, and `.het` files — previewing message + listing in an Output Channel, confirming with the user, then extracting to a folder.

**Architecture:** A new `python/run_extractxmi.py` wrapper calls `xmi.cli.extract_main` from the bundled lib. A new `src/extractXmi.ts` handles the full flow: output channel, two sequential python calls (message, listing), Yes/No confirm, output folder logic, extraction. Registered in `src/extension.ts` alongside the existing generate command.

**Tech Stack:** TypeScript, VSCode Extension API, Node.js `child_process.execFile` (promisified), Node.js `fs.existsSync`, Python 3, xmi-reader 1.0.1

---

### Task 1: Create python/run_extractxmi.py

**Files:**
- Create: `python/run_extractxmi.py`

- [ ] **Step 1: Create the wrapper**

```python
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'lib'))
from xmi.cli import extract_main
if __name__ == '__main__':
    extract_main()
```

- [ ] **Step 2: Verify it works**

```bash
cd /Users/henri/repos/xmi-generator && python3 python/run_extractxmi.py --help
```

Expected: usage output showing `FILE`, `--message`, `-l`, `--outputdir`, `-q` options — no import errors.

- [ ] **Step 3: Commit**

```bash
git add python/run_extractxmi.py
git commit -m "feat: add run_extractxmi.py wrapper"
```

---

### Task 2: Update package.json — new command, context menu, version bump

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Read the current package.json**

Read `/Users/henri/repos/xmi-generator/package.json` to see the current state before editing.

- [ ] **Step 2: Bump version to 0.0.2**

Change `"version": "0.0.1"` to `"version": "0.0.2"`.

- [ ] **Step 3: Add the extract command to the commands array**

The `"contributes"` → `"commands"` array currently has one entry. Add a second:

```json
{
  "command": "xmi-generator.extract",
  "title": "Extract XMI"
}
```

- [ ] **Step 4: Add the extract entry to explorer/context menu**

The `"menus"` → `"explorer/context"` array currently has one entry. Add:

```json
{
  "command": "xmi-generator.extract",
  "when": "resourceExtname =~ /\\.(xmi|aws|het)/i",
  "group": "navigation"
}
```

- [ ] **Step 5: Verify valid JSON**

```bash
node -e "require('./package.json'); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 6: Commit**

```bash
git add package.json
git commit -m "feat: add extract command and context menu for v0.0.2"
```

---

### Task 3: Create src/extractXmi.ts

**Files:**
- Create: `src/extractXmi.ts`

- [ ] **Step 1: Create the file**

```typescript
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';

let outputChannel: vscode.OutputChannel | undefined;

function getChannel(): vscode.OutputChannel {
    if (!outputChannel) {
        outputChannel = vscode.window.createOutputChannel('XMI Generator');
    }
    return outputChannel;
}

function runPython(script: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        execFile('python3', [script, ...args], (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
            } else {
                resolve({ stdout, stderr });
            }
        });
    });
}

export async function extractXmi(
    context: vscode.ExtensionContext,
    uri: vscode.Uri
): Promise<void> {
    const filePath = uri.fsPath;
    const pythonScript = path.join(context.extensionPath, 'python', 'run_extractxmi.py');
    const channel = getChannel();
    channel.clear();
    channel.show(true);

    try {
        const { stdout: message } = await runPython(pythonScript, ['--message', filePath]);
        if (message.trim()) {
            channel.appendLine('=== Message ===');
            channel.appendLine(message.trim());
            channel.appendLine('===============');
            channel.appendLine('');
        }
    } catch (e) {
        const { error, stderr } = e as { error: NodeJS.ErrnoException; stderr: string };
        if (error.code === 'ENOENT') {
            vscode.window.showErrorMessage('python3 not found. Please install Python 3.');
        } else {
            vscode.window.showErrorMessage(`Failed to read XMI: ${stderr || error.message}`);
        }
        return;
    }

    try {
        const { stdout: listing } = await runPython(pythonScript, ['-l', filePath]);
        channel.appendLine('=== Contents ===');
        channel.appendLine(listing.trim());
        channel.appendLine('');
    } catch (e) {
        const { error, stderr } = e as { error: NodeJS.ErrnoException; stderr: string };
        vscode.window.showErrorMessage(`Failed to list XMI contents: ${stderr || error.message}`);
        return;
    }

    const confirm = await vscode.window.showInformationMessage(
        'Extract these contents?',
        { modal: true },
        'Yes'
    );
    if (confirm !== 'Yes') { return; }

    const stem = path.basename(filePath, path.extname(filePath));
    const defaultFolder = path.join(path.dirname(filePath), stem);

    let outputDir: string;
    if (!fs.existsSync(defaultFolder)) {
        outputDir = defaultFolder;
    } else {
        const picked = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Extract Here',
            title: `Folder "${stem}" already exists — pick an output folder`,
        });
        if (!picked || picked.length === 0) { return; }
        outputDir = picked[0].fsPath;
    }

    try {
        await runPython(pythonScript, [filePath, '--outputdir', outputDir, '-q']);
        vscode.window.showInformationMessage(`Extracted to: ${outputDir}`);
    } catch (e) {
        const { error, stderr } = e as { error: NodeJS.ErrnoException; stderr: string };
        vscode.window.showErrorMessage(`Extraction failed: ${stderr || error.message}`);
    }
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/henri/repos/xmi-generator && pnpm run check-types
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/extractXmi.ts
git commit -m "feat: add extractXmi command handler"
```

---

### Task 4: Update src/extension.ts

**Files:**
- Modify: `src/extension.ts`

- [ ] **Step 1: Read the current extension.ts**

Read `/Users/henri/repos/xmi-generator/src/extension.ts`.

- [ ] **Step 2: Replace the file content**

```typescript
import * as vscode from 'vscode';
import { generateXmi } from './generateXmi';
import { extractXmi } from './extractXmi';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'xmi-generator.generate',
            (uri: vscode.Uri) => generateXmi(context, uri)
        ),
        vscode.commands.registerCommand(
            'xmi-generator.extract',
            (uri: vscode.Uri) => extractXmi(context, uri)
        )
    );
}

export function deactivate() {}
```

- [ ] **Step 3: Type-check, lint, and build**

```bash
cd /Users/henri/repos/xmi-generator && pnpm run check-types && pnpm run lint && pnpm run compile
```

Expected: no errors, `dist/extension.js` updated.

- [ ] **Step 4: Commit and push**

```bash
git add src/extension.ts
git commit -m "feat: register extract command in extension activate"
git push
```
