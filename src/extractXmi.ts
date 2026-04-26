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
