import * as vscode from 'vscode';

import { isFantomasInstalled, runFantomas } from './utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	let isInstalled: boolean = await isFantomasInstalled();
	if (!isInstalled) {
		return;
	}
	showUserMessage('Extension active');
	let formatting = false;

	let disposable = vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: 'file', language: 'fsharp' },
		{
			async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
				if (formatting) {
					return [];
				}
				formatting = true;
				const config = vscode.workspace.getConfiguration('fantomas');
				const extensionPath = context.extensionPath;
				const selectedText = document.getText();
				const isfsiFile = document.fileName.endsWith(".fsi");
				let formatted: string | null;
				formatted = await runFantomas(selectedText, extensionPath, isfsiFile, config);
				if (formatted) {
					const firstLine = document.lineAt(0);
					const lastLine = document.lineAt(document.lineCount - 1);
					const range = new vscode.Range(firstLine.range.start, lastLine.range.end);
					formatting = false;
					return [vscode.TextEdit.replace(range, formatted)];
				}
				else {
					showUserErrorMessage('formatting failed');
					formatting = false;
					return [];
				}
			}
		}
	);
	context.subscriptions.push(disposable);
}

export function deactivate() { }

function showUserMessage(message: string) {
	vscode.window.showInformationMessage('[fantomas-format] ' + message);
}

function showUserErrorMessage(message: string) {
	vscode.window.showErrorMessage('[fantomas-format] ' + message);
}