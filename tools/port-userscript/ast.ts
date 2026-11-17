import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import ts from "typescript";

export const REPOSITORY_ROOT = resolve(import.meta.dirname, "../..");

const sources = new Map<string, ts.SourceFile>();

export function getSourceFile(path: string): ts.SourceFile {
	const cached = sources.get(path);
	if (cached) return cached;

	const source = ts.createSourceFile(path, readFileSync(path, "utf-8"), ts.ScriptTarget.Latest, true);
	sources.set(path, source);
	return source;
}

export function walk(node: ts.Node, visit: (node: ts.Node) => boolean | void): void {
	if (visit(node) === false) return;

	ts.forEachChild(node, (child) => walk(child, visit));
}

export function stringValue(node: ts.Node | undefined): string | undefined {
	if (!node) return undefined;
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;

	return undefined;
}

/** `settings.pages.global.alignLeft` for a property access chain rooted at an identifier. */
export function propertyChain(node: ts.Node): string | undefined {
	if (ts.isIdentifier(node)) return node.text;
	if (!ts.isPropertyAccessExpression(node)) return undefined;

	const parent = propertyChain(node.expression);
	return parent ? `${parent}.${node.name.text}` : undefined;
}

export function listFiles(directory: string, extension: string): string[] {
	if (!existsSync(directory)) return [];

	const files: string[] = [];
	const stack = [directory];
	while (stack.length) {
		const current = stack.pop()!;
		for (const entry of readdirSync(current, { withFileTypes: true })) {
			const path = join(current, entry.name);
			if (entry.isDirectory()) stack.push(path);
			else if (entry.name.endsWith(extension)) files.push(path);
		}
	}

	return files.sort((left, right) => left.localeCompare(right));
}

export function findChains(files: string[], roots: string[]): string[] {
	const chains = new Set<string>();
	for (const file of files) {
		walk(getSourceFile(file), (node) => {
			if (!ts.isPropertyAccessExpression(node)) return;
			const parent = node.parent;
			// Only the outermost chain: `settings.pages.x` is recorded once, not also as `settings.pages`.
			if (ts.isPropertyAccessExpression(parent) && parent.expression === node) return;

			const chain = propertyChain(node);
			if (!chain) return;
			if (roots.some((root) => chain.startsWith(`${root}.`))) chains.add(chain);
		});
	}

	return [...chains].sort((left, right) => left.localeCompare(right));
}

export function usedIdentifiers(files: string[]): Set<string> {
	const identifiers = new Set<string>();
	for (const file of files) {
		walk(getSourceFile(file), (node) => {
			if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text !== "this")
				identifiers.add(node.expression.text);
			else if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) identifiers.add(node.expression.text);
		});
	}

	return identifiers;
}
