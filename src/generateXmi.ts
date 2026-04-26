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
