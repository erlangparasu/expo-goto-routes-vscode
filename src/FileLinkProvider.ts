import * as vscode from 'vscode';
import * as path from 'path';

export class FileLinkProvider implements vscode.CodeLensProvider {
    private regex: RegExp;

    constructor() {
        // This regex looks for relative paths in quotes, requiring at least one '/'
        // this.regex = /(['"])((?:\.\/|\.\.\/|\/)?[\w-]+\/[\w\-\/]+)(['"])/g;
        this.regex = /(pathname)[:]{1}/g;
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
        const lenses: vscode.CodeLens[] = [];
        const text = document.getText();
        let matches;

        while ((matches = this.regex.exec(text)) !== null) {
            const startPos = document.positionAt(matches.index + 1);
            const endPos = document.positionAt(matches.index + matches[0].length - 1);
            const range = new vscode.Range(startPos, endPos);

            const lineData = document.lineAt(startPos.line);
            const fullLineText = lineData.text;
            console.log({ fullLineText });

            const filePath = matches[2];

            if (range) {
                const command: vscode.Command = {
                    title: "Go to file",
                    command: "expo-goto-routes-vscode.openFile",
                    arguments: [filePath],
                };
                lenses.push(new vscode.CodeLens(range, command));
            }
        }

        return lenses;
    }
}
