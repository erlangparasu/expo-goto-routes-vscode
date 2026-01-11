import * as vscode from 'vscode';
import { FileLinkProvider } from './FileLinkProvider';

export function activate(context: vscode.ExtensionContext) {
    const fileLinkProvider = new FileLinkProvider();

    const disposableProvider = vscode.languages.registerCodeLensProvider(
        { scheme: 'file' }, // NOTE: Apply to all files
        fileLinkProvider
    );

    const disposableCommand = vscode.commands.registerCommand('expo-goto-routes-vscode.openFile', async (filePath: string) => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const extensionsToTry = ['', '.js', '.ts', '.jsx', '.tsx', '/index.js', '/index.ts', '/index.jsx', '/index.tsx'];
        let fileFound = false;

        for (const folder of workspaceFolders) {
            for (const ext of extensionsToTry) {
                const absolutePath = vscode.Uri.joinPath(folder.uri, filePath + ext);
                try {
                    await vscode.workspace.fs.stat(absolutePath);
                    await vscode.window.showTextDocument(absolutePath);
                    fileFound = true;
                    break;
                } catch (error) {
                    // NOTE: Not found, try next extension
                }
            }
            if (fileFound) {
                break;
            }
        }

        if (!fileFound) {
            vscode.window.showErrorMessage(`File not found: ${filePath}`);
        }
    });

    context.subscriptions.push(disposableProvider, disposableCommand);
}

export function deactivate() {}
