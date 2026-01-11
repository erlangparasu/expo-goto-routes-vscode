import * as vscode from 'vscode';
import * as path from 'path';
import * as ts from 'typescript';
import * as fs from 'fs';

function isValidFileSystemPath(value: string, documentUri: vscode.Uri): boolean {
    // NOTE: Handle relative paths (e.g., "./images/logo.png")
    // We must resolve them relative to the current file's directory
    // const currentDir = path.dirname(documentUri.fsPath);

    const fullPath = path.resolve(documentUri.fsPath, value);
    console.log({fullPath});

    // NOTE: Check if the path exists
    return fs.existsSync(fullPath);
}

export class FileLinkProvider implements vscode.CodeLensProvider {
    private regex: RegExp;

    constructor() {
        // NOTE: This regex looks for relative paths in quotes, requiring at least one '/'
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
            // NOTE: Check if the node is a property assignment like pathname: "value"
            if (ts.isPropertyAssignment(node)) {
                const name = node.name.getText(sourceFile);

                // NOTE: Match the key name (handles both pathname and "pathname")
                if (name === 'pathname' || name === '"pathname"' || name === "'pathname'") {
                    const valueNode = node.initializer;

                    // NOTE: Check if the value is a string literal
                    if (ts.isStringLiteral(valueNode)) {
                        const value = valueNode.text; // This is your "value"

                        // NOTE: Get line number for VS Code
                        const { line } = sourceFile.getLineAndCharacterOfPosition(valueNode.getStart());
                        const fullLineText = document.lineAt(line).text;

                        console.log(`Found value: ${value} at line ${line + 1}`);

                        let selectedFilePath = "";
                        const filePath1 = "./app/" + value + "/index.tsx";
                        const filePath2 = "./app/" + value + ".tsx";

                        const rootDoc = vscode.workspace.getWorkspaceFolder(document.uri);
                        const plainRoot = rootDoc?.uri.fsPath;

                        if (isValidFileSystemPath(filePath1, vscode.Uri.file(plainRoot!))) {
                            selectedFilePath = filePath1;
                        }
                        if (isValidFileSystemPath(filePath2, vscode.Uri.file(plainRoot!))) {
                            selectedFilePath = filePath2;
                        }

                        console.log({
                            filePath1: filePath1,
                            filePath2: filePath2,
                            rootDoc: rootDoc?.uri.fsPath,
                            selectedFilePath: selectedFilePath,
                        });

                        const ll = document.lineAt(line);

                        const command: vscode.Command = {
                            title: "Go to file",
                            command: "expo-goto-routes-vscode.openFile",
                            arguments: [selectedFilePath],
                        };
                        lenses.push(new vscode.CodeLens(ll.range, command));
                    }
                }
            }

            // NOTE: Continue searching children
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

            // if (range) {
            //     const command: vscode.Command = {
            //         title: "Go to file",
            //         command: "expo-goto-routes-vscode.openFile",
            //         arguments: [filePath],
            //     };
            //     lenses.push(new vscode.CodeLens(range, command));
            // }
        }

        return lenses;
    }
}
