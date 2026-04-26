import * as vscode from 'vscode';
import * as path from 'path';
import { execFile } from 'child_process';

const STATE_KEYS = {
    dsn: 'xmi-generator.dsn',
    fromUser: 'xmi-generator.fromUser',
    fromNode: 'xmi-generator.fromNode',
};

const DEFAULTS = {
    dsn: '',
    fromUser: 'XMIGEN',
    fromNode: 'VSCODE',
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

    const fromNode = await vscode.window.showInputBox({
        prompt: 'Node name (from-node)',
        value: context.globalState.get<string>(STATE_KEYS.fromNode, DEFAULTS.fromNode),
    });
    if (fromNode === undefined) { return; }

    await context.globalState.update(STATE_KEYS.dsn, dsn);
    await context.globalState.update(STATE_KEYS.fromUser, fromUser);
    await context.globalState.update(STATE_KEYS.fromNode, fromNode);

    const baseName = path.basename(sourcePath, path.extname(sourcePath));
    const outputPath = path.join(path.dirname(sourcePath), baseName + '.XMI');
    const pythonScript = path.join(context.extensionPath, 'python', 'run_createxmi.py');

    execFile('python3', [
        pythonScript,
        sourcePath,
        '-o', outputPath,
        '--dsn', dsn,
        '--from-user', fromUser,
        '--from-node', fromNode,
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
