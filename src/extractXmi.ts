import * as vscode from 'vscode';
import * as path from 'path';
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

    const outputDir = path.dirname(filePath);

    try {
        await runPython(pythonScript, [filePath, '--outputdir', outputDir, '-q']);
        vscode.window.showInformationMessage(`Extracted to: ${outputDir}`);
    } catch (e) {
        const { error, stderr } = e as { error: NodeJS.ErrnoException; stderr: string };
        vscode.window.showErrorMessage(`Extraction failed: ${stderr || error.message}`);
    }
}
