import * as vscode from 'vscode';
import * as path from 'path';
import * as ts from 'typescript';

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

        const sourceFile = ts.createSourceFile(
            'extension-check.ts',
            document.getText(),
            ts.ScriptTarget.Latest,
            true
        );

        function findPathnames(node: ts.Node) {
            // Check if the node is a property assignment like pathname: "value"
            if (ts.isPropertyAssignment(node)) {
                const name = node.name.getText(sourceFile);

                // Match the key name (handles both pathname and "pathname")
                if (name === 'pathname' || name === '"pathname"' || name === "'pathname'") {
                    const valueNode = node.initializer;

                    // Check if the value is a string literal
                    if (ts.isStringLiteral(valueNode)) {
                        const value = valueNode.text; // This is your "value"

                        // Get line number for VS Code
                        const { line } = sourceFile.getLineAndCharacterOfPosition(valueNode.getStart());
                        const fullLineText = document.lineAt(line).text;

                        console.log(`Found value: ${value} at line ${line + 1}`);
                    }
                }
            }

            // Continue searching children
            ts.forEachChild(node, findPathnames);
        }

        findPathnames(sourceFile);

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
