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
