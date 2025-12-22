import { vi } from "vitest";
import ts from "typescript";
import { chrome } from "vitest-chrome";

vi.stubGlobal("chrome", chrome);

const ORDERED_FILES = [
	"./extension/scripts/global/functions/utilities.ts",
	"./extension/scripts/global/functions/extension.ts",
	"./extension/scripts/global/globalClasses.ts",
	"./extension/scripts/global/globalData.ts",
	"./extension/scripts/global/functions/api.ts",
	"./extension/scripts/global/functions/formatting.ts",
];

const coreModulesRaw = import.meta.glob(["./extension/scripts/global/**/*.ts", "!**/*.test.ts"], {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

function getGlobalNames(code: string) {
	const sourceFile = ts.createSourceFile("temp.ts", code, ts.ScriptTarget.ES2020, true);
	const names: string[] = [];

	ts.forEachChild(sourceFile, (node) => {
		if (ts.isVariableStatement(node)) {
			if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword)) return;
			node.declarationList.declarations.forEach((declaration) => {
				if (ts.isIdentifier(declaration.name)) {
					names.push(declaration.name.text);
				}
			});
		} else if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node)) {
			if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DeclareKeyword)) return;
			names.push(node.name.text);
		}
	});

	return names;
}

function loadScript(path: string, code: string) {
	try {
		const globalNames = getGlobalNames(code);
		const exposures = globalNames.map((name) => `vi.stubGlobal("${name}", ${name});`).join("\n");
		code += "\n" + exposures;

		const result = ts.transpileModule(code, {
			compilerOptions: {
				module: ts.ModuleKind.None,
				target: ts.ScriptTarget.ES2020,
			},
		});
		eval(result.outputText);
	} catch (e) {
		console.error(`Failed to load script ${path}:`, e);
		throw e;
	}
}

const loadCore = (path: string) => loadScript(path, coreModulesRaw[path]);

ORDERED_FILES.forEach(loadCore);

const allModules = import.meta.glob(["./extension/scripts/global/**/*.ts", "!**/*.test.ts"]);

for (const path in allModules) {
	if (ORDERED_FILES.includes(path)) continue;

	try {
		await allModules[path]();
	} catch (e) {
		console.warn(`Failed to dynamic import ${path}. This might be due to missing dependencies in legacy scripts.`, e);
	}
}
