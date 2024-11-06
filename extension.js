const vscode = require('vscode');
const exec = require('child_process').exec;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	context.subscriptions.push(vscode.commands.registerCommand('close-unmodified-editors.closeAllButModifiedFiles', async (uri) => {
		const editor        = vscode.window.activeTextEditor;
		if(!editor) return;
		const document      = editor.document;
		const vscodeExePath = vscode.env.appRoot.replace(/\/resources\/app$/, '').replace(/\.app.*$/, '.app');
		let   absolutePath  = document.uri.fsPath;
			  absolutePath  = absolutePath.substring(0, absolutePath.lastIndexOf('/'));
		let   modFileCount  = 0;
		
		return new Promise((resolve, reject) => {
			exec(`cd ${absolutePath}; git status -s | grep -cE "."`, async (err, stdout, stderr) => {
				if (err) return console.error(`exec error: ${err}`);
				await (modFileCount = +(stdout.trim()));
				resolve(modFileCount);
			});
		})
		.then(async () => {
			const userInput = await vscode.window.showQuickPick(["Yes", "No"], { placeHolder: `Close all saved files except the ${modFileCount} modified in this branch?` });
			if (userInput === "No") return false;
			await vscode.commands.executeCommand("workbench.action.closeUnmodifiedEditors");
			return;
		})
		.then(async () => {
			await exec(`cd ${absolutePath}; git status -s --ignore-submodules | sed -E "s/^[ A-Z]{3}//" | xargs open -a "${vscodeExePath}"`, (err, stdout, stderr) => {
				if (err) return console.error(`exec error: ${err}\n ${stderr}`);
			});
			return;
		})
		.catch((err) => {
			console.error(err);
		});
	}));
}

module.exports = {
	activate
}

