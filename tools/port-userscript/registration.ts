import { resolve } from "node:path";
import ts from "typescript";
import { getSourceFile, REPOSITORY_ROOT, stringValue, walk } from "./ast";

const SCRIPT_MANAGER = resolve(REPOSITORY_ROOT, "src/extension/runtime/script-manager.ts");

export interface Registration {
	className: string;
	pages: Set<string> | "all";
}

/** Feature registrations in the extension's script manager, with the page guard they sit under. */
export function readRegistrations(): Registration[] {
	const source = getSourceFile(SCRIPT_MANAGER);
	const pageHelpers = collectPageHelpers(source);
	const registrations: Registration[] = [];

	walk(source, (node) => {
		if (!ts.isNewExpression(node) || !ts.isIdentifier(node.expression)) return;
		if (!isFeatureRegistration(node)) return;

		// The innermost guard that names pages wins; unrelated guards (e.g. `!isRecaptcha(page)`) mean "every page".
		const pages =
			enclosingConditions(node)
				.map((condition) => pagesOf(condition, pageHelpers))
				.find((pages) => pages !== "all") ?? "all";

		registrations.push({ className: node.expression.text, pages });
	});

	return registrations;
}

function isFeatureRegistration(node: ts.Node): boolean {
	for (let parent = node.parent; parent; parent = parent.parent) {
		if (ts.isCallExpression(parent) && ts.isPropertyAccessExpression(parent.expression) && parent.expression.name.text === "registerFeature") {
			return true;
		}
	}

	return false;
}

function enclosingConditions(node: ts.Node): ts.Expression[] {
	const conditions: ts.Expression[] = [];
	let child: ts.Node = node;
	let parent = node.parent;
	while (parent) {
		if (ts.isIfStatement(parent) && child === parent.thenStatement) conditions.push(parent.expression);

		child = parent;
		parent = parent.parent;
	}

	return conditions;
}

function pagesOf(expression: ts.Expression, helpers: Map<string, Set<string>>): Set<string> | "all" {
	if (ts.isParenthesizedExpression(expression)) return pagesOf(expression.expression, helpers);

	if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
		const page = pageComparedTo(expression.left, expression.right) ?? pageComparedTo(expression.right, expression.left);

		return page ? new Set([page.toLowerCase()]) : "all";
	}

	if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === "includes") {
		const [argument] = expression.arguments;
		const list = expression.expression.expression;
		if (ts.isArrayLiteralExpression(list) && argument && ts.isIdentifier(argument) && argument.text === "page") {
			const pages = new Set(
				list.elements
					.map((element) => stringValue(element))
					.filter((page): page is string => !!page)
					.map((page) => page.toLowerCase()),
			);
			return pages.size ? pages : "all";
		}
	}

	if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
		const pages = helpers.get(expression.expression.text);
		if (pages) return pages;
	}

	return "all";
}

function pageComparedTo(left: ts.Expression, right: ts.Expression): string | undefined {
	return ts.isIdentifier(left) && left.text === "page" ? stringValue(right) : undefined;
}

function collectPageHelpers(source: ts.SourceFile): Map<string, Set<string>> {
	const helpers = new Map<string, Set<string>>();

	walk(source, (node) => {
		if (!ts.isFunctionDeclaration(node) || !node.name || !node.body) return;

		const pages = new Set<string>();
		walk(node.body, (inner) => {
			if (ts.isArrayLiteralExpression(inner)) {
				for (const element of inner.elements) {
					const page = stringValue(element);
					if (page) pages.add(page.toLowerCase());
				}
			} else if (ts.isBinaryExpression(inner) && ts.isIdentifier(inner.left) && inner.left.text === "page") {
				const page = stringValue(inner.right);
				if (page) pages.add(page.toLowerCase());
			}
		});

		if (pages.size) helpers.set(node.name.text, pages);
	});

	return helpers;
}
