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
