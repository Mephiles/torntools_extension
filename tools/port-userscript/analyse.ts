import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import ts from "typescript";
import { findChains, getSourceFile, listFiles, propertyChain, REPOSITORY_ROOT, stringValue, usedIdentifiers, walk } from "./ast";
import { readRegistrations } from "./registration";
import {
	existingStoragePrefixes,
	hostOf,
	knownSettingPath,
	PAGE_MATCHES,
	platformOfExternalSetting,
	readFetchPlatforms,
	readPreferences,
	readSettingSchema,
	readSharedEntries,
	sharedEntriesFor,
} from "./tables";

const FEATURES_DIRECTORY = resolve(REPOSITORY_ROOT, "src/common/features");
const byText = (left: string, right: string) => left.localeCompare(right);

export type PortFile = "metadata" | "settings-manifest" | "user";

export interface PortTodo {
	file: PortFile;
	message: string;
}

export interface SettingsEntry {
	path: string;
	label: string;
	description?: string;
	todo?: string;
}

export interface SettingsOverride {
	path: string;
	value: boolean;
}

export interface FeatureClass {
	className: string;
	file: string;
	name: string;
	immediate: boolean;
	namedExport: boolean;
}

export interface PortAnalysis {
	name: string;
	description: string;
	version: string;
	matches: string[];
	runAt: "document-start" | "document-end";
	connect: string[];
	storagePrefix: string;
	classes: FeatureClass[];
	settings: SettingsEntry[];
	sharedEntries: { constant: string; path: string }[];
	overrides: SettingsOverride[];
	network: boolean;
	injector: boolean;
	loadItems: boolean;
	apiKey?: "required" | "optional";
	todos: PortTodo[];
	warnings: string[];
}

export function analyseFeature(feature: string): PortAnalysis {
	const directory = resolve(FEATURES_DIRECTORY, feature);
	if (!existsSync(directory)) throw new Error(`No feature directory at src/common/features/${feature}.`);

	const files = listFiles(directory, ".ts");
	if (!files.length) throw new Error(`No TypeScript files in src/common/features/${feature}.`);

	const todos: PortTodo[] = [];
	const warnings: string[] = [];
	const preferences = readPreferences();
	const schema = readSettingSchema();
	const shared = readSharedEntries();

	const classes = featureClasses(files);
	if (!classes.length) throw new Error(`No class extending Feature in src/common/features/${feature}.`);
	if (classes.length > 1) warnings.push(`Contains ${classes.length} feature classes; all of them are registered. Review the entry file.`);

	const primary = classes.find((klass) => basename(klass.file, ".ts") === feature) ?? classes[0];
	const name = primary.name;

	const identifiers = usedIdentifiers(files);
	const chains = readSettingPaths(files, schema);
	const enabledPaths = readEnabledPaths(files, schema);

	const { settings, sharedEntries, overrides } = classifySettings(chains, enabledPaths, schema, preferences, shared, todos, warnings);

	const platforms = readFetchPlatformsUsed(files);
	for (const path of chains) if (path.startsWith("settings.external.")) platforms.add(platformOfExternalSetting(path));

	const loadItems = identifiers.has("ITEM_RESOLVER") || identifiers.has("ScriptItemResolver");
	if (loadItems) platforms.add("playground_torntools");
	if (identifiers.has("hasAPIData") || chains.some((path) => path.startsWith("api.torn."))) platforms.add("tornv2");

	const fetchPlatforms = readFetchPlatforms();
	const connect = new Set<string>();
	for (const platform of [...platforms].sort(byText)) {
		if (platform === "torn_direct") continue;
		if (platform === "tornv2" || platform === "torn") {
			connect.add("api.torn.com");
			continue;
		}

		const host = hostOf(fetchPlatforms, platform);
		if (!host) {
			todos.push({ file: "metadata", message: `Unknown external platform "${platform}"; add the connection to @connect manually.` });
			continue;
		}

		connect.add(host);
	}

	const network =
		loadItems || identifiers.has("DATA_FETCHER") || identifiers.has("OFFLOAD_SERVICE") || identifiers.has("fetchData") || identifiers.has("getApiUrl");
	// `addFetchListener`/`addXHRListener` are thin wrappers around SCRIPT_INJECTOR.
	const injector = ["SCRIPT_INJECTOR", "addFetchListener", "addXHRListener"].some((identifier) => identifiers.has(identifier));

	const matches = readMatches(classes, todos);
	const runAt = primary.immediate ? "document-start" : "document-end";

	return {
		name,
		description: describe(enabledPaths, preferences, todos),
		version: "1.0.0",
		matches,
		runAt,
		connect: [...connect].sort(byText),
		storagePrefix: storagePrefix(name, feature),
		classes,
		settings,
		sharedEntries,
		overrides,
		network,
		injector,
		loadItems,
		apiKey: apiKeyMode(files, { network, touchedAPI: chains.some((path) => path.startsWith("api.") || path.startsWith("settings.apiUsage.")) }),
		todos,
		warnings,
	};
}

export function entryPath(feature: string): string {
	return resolve(REPOSITORY_ROOT, "src/userscripts/entries", feature);
}

export function entryFile(feature: string): string {
	return `${feature}.user.ts`;
}

export function entryImportPath(klass: FeatureClass): string {
	return `@features/${basename(dirname(klass.file))}/${basename(klass.file, ".ts")}`;
}

export function entryImportBinding(klass: FeatureClass): string {
	return klass.namedExport ? `{ ${klass.className} }` : klass.className;
}

function featureClasses(files: string[]): FeatureClass[] {
	const classes: FeatureClass[] = [];

	for (const file of files) {
		walk(getSourceFile(file), (node) => {
			if (!ts.isClassDeclaration(node) || !node.name) return;

			const bases = (node.heritageClauses ?? []).flatMap((clause) => clause.types).map((type) => type.expression.getText());
			if (!bases.some((base) => base === "Feature" || base === "DisabledUntilNoticeFeature")) return;

			const args = superCall(node)?.arguments ?? [];

			classes.push({
				className: node.name.text,
				file,
				name: stringValue(args[0]) ?? node.name.text,
				immediate: args.some((argument) => ts.isPropertyAccessExpression(argument) && argument.name.text === "IMMEDIATELY"),
				namedExport: ts.getCombinedModifierFlags(node) === ts.ModifierFlags.Export,
			});
		});
	}

	return classes;
}

function superCall(node: ts.ClassDeclaration): ts.CallExpression | undefined {
	const constructor = node.members.find((member) => ts.isConstructorDeclaration(member));
	for (const statement of constructor?.body?.statements ?? []) {
		if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) continue;
		if (statement.expression.expression.kind === ts.SyntaxKind.SuperKeyword) return statement.expression;
	}

	return undefined;
}

function readSettingPaths(files: string[], schema: Map<string, string>): string[] {
	const paths = new Set<string>();

	for (const chain of findChains(files, ["settings", "api"])) {
		const path = knownSettingPath(chain, schema);
		if (path) paths.add(path);
	}

	// Settings returned by `storageKeys()` are plain strings, e.g. `"settings.pages.x.option"`.
	for (const file of files) {
		walk(getSourceFile(file), (node) => {
			const literal = stringValue(node);
			if (!literal?.startsWith("settings.")) return;

			const path = knownSettingPath(literal, schema);
			if (path) paths.add(path);
		});
	}

	return Array.from(paths).sort(byText);
}

const GUARD_METHODS = ["isEnabled", "precondition", "requirements"];

/** Bodies of the methods a feature uses to decide whether (and under what conditions) it runs. */
function guardMethods(files: string[]): ts.Node[] {
	const bodies: ts.Node[] = [];

	for (const file of files) {
		walk(getSourceFile(file), (node) => {
			if (!ts.isMethodDeclaration(node) || !ts.isIdentifier(node.name) || !node.body) return;
			if (GUARD_METHODS.includes(node.name.text)) bodies.push(node.body);
		});
	}

	return bodies;
}

function readEnabledPaths(files: string[], schema: Map<string, string>): Map<string, boolean> {
	const enabled = new Map<string, boolean>();

	for (const body of guardMethods(files)) {
		walk(body, (inner) => {
			if (!ts.isPropertyAccessExpression(inner)) return;
			if (ts.isPropertyAccessExpression(inner.parent) && inner.parent.expression === inner) return;

			const chain = propertyChain(inner);
			const path = chain && knownSettingPath(chain, schema);
			if (!path) return;

			enabled.set(path, forcedValue(inner));
		});
	}

	return enabled;
}

function forcedValue(node: ts.Node): boolean {
	const parent = node.parent;
	if (ts.isPrefixUnaryExpression(parent) && parent.operator === ts.SyntaxKind.ExclamationToken) return false;

	if (ts.isBinaryExpression(parent)) {
		const other = parent.left === node ? parent.right : parent.right === node ? parent.left : undefined;
		if (other && (other.kind === ts.SyntaxKind.TrueKeyword || other.kind === ts.SyntaxKind.FalseKeyword)) {
			const equality =
				parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken;
			if (equality) return other.kind === ts.SyntaxKind.TrueKeyword;
		}
	}

	return true;
}

function classifySettings(
	paths: string[],
	enabled: Map<string, boolean>,
	schema: Map<string, string>,
	preferences: ReturnType<typeof readPreferences>,
	shared: Map<string, string>,
	todos: PortTodo[],
	warnings: string[],
): { settings: SettingsEntry[]; sharedEntries: { constant: string; path: string }[]; overrides: SettingsOverride[] } {
	const settings: SettingsEntry[] = [];
	const overrides: SettingsOverride[] = [];
	const sharedEntries: { constant: string; path: string }[] = [];

	for (const path of paths) {
		if (enabled.has(path) && schema.get(path) === "boolean") {
			overrides.push({ path, value: enabled.get(path)! });
			continue;
		}

		if (enabled.has(path)) warnings.push(`${path} gates the feature but isn't a boolean; it's left user-configurable.`);

		if (path.startsWith("settings.apiUsage.")) {
			overrides.push({ path, value: true });
			continue;
		}

		if (path.startsWith("settings.external.")) {
			const constants = sharedEntriesFor(platformOfExternalSetting(path), shared);
			if (constants.length) sharedEntries.push(...constants);
			else overrides.push({ path, value: true });

			continue;
		}

		if (path === "api.torn.key") continue;

		if (path.startsWith("api.") || path.startsWith("settings.")) {
			const preference = preferences.get(path);
			if (preference) settings.push({ path, label: preference.label, description: preference.description });
			else {
				settings.push({ path, label: `TODO: label for ${path}`, todo: `No label found in PREFERENCE_SEARCH_DATA for ${path}.` });
				todos.push({ file: "settings-manifest", message: `No label found for ${path}.` });
			}

			continue;
		}
	}

	return { settings, sharedEntries: dedupeShared(sharedEntries), overrides };
}

function dedupeShared(entries: { constant: string; path: string }[]): { constant: string; path: string }[] {
	return [...new Map(entries.map((entry) => [entry.constant, entry])).values()].sort((left, right) => byText(left.constant, right.constant));
}

function readFetchPlatformsUsed(files: string[]): Set<string> {
	const platforms = new Set<string>();

	for (const file of files) {
		walk(getSourceFile(file), (node) => {
			if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return;
			if (node.expression.text !== "fetchData" && node.expression.text !== "getApiUrl") return;

			const platform = stringValue(node.arguments[0]);
			if (platform) platforms.add(platform);
		});
	}

	return platforms;
}

function readMatches(classes: FeatureClass[], todos: PortTodo[]): string[] {
	const registrations = readRegistrations();
	const matches = new Set<string>();

	for (const klass of classes) {
		const own = registrations.filter((registration) => registration.className === klass.className);
		if (!own.length) {
			matches.add("https://*.torn.com/*");
			todos.push({ file: "metadata", message: `Couldn't find where ${klass.className} is registered; @match falls back to every Torn page.` });
			continue;
		}

		for (const registration of own) {
			if (registration.pages === "all") {
				matches.add("https://*.torn.com/*");
				continue;
			}

			for (const page of registration.pages) {
				const patterns = PAGE_MATCHES[page];
				if (!patterns) {
					matches.add("https://*.torn.com/*");
					todos.push({ file: "metadata", message: `Unknown page "${page}"; add it to PAGE_MATCHES in tools/port-userscript/tables.ts.` });
					continue;
				}

				for (const pattern of patterns) matches.add(pattern);
			}
		}
	}

	return [...matches].sort(byText);
}

function describe(enabled: Map<string, boolean>, preferences: ReturnType<typeof readPreferences>, todos: PortTodo[]): string {
	const [first] = Array.from(enabled.keys());
	const preference = first ? preferences.get(first) : undefined;
	if (!preference) {
		todos.push({ file: "metadata", message: "No preference label to derive the description from." });
		return "TODO: one-line description.";
	}

	return sentence(preference.label);
}

function sentence(text: string): string {
	const trimmed = text.trim();
	if (!trimmed) return trimmed;

	const upper = trimmed[0].toUpperCase() + trimmed.slice(1);
	return upper.endsWith(".") ? upper : `${upper}.`;
}

function storagePrefix(name: string, feature: string): string {
	const initials = name
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
		.map((word) => word[0].toLowerCase())
		.join("");

	return uniqueStoragePrefix(`tt_${initials || name.toLowerCase()}`, existingStoragePrefixes(feature));
}

export function uniqueStoragePrefix(base: string, taken: Set<string>): string {
	if (!taken.has(base)) return base;

	let index = 2;
	while (taken.has(`${base}${index}`)) index += 1;

	return `${base}${index}`;
}

function apiKeyMode(files: string[], { network, touchedAPI }: { network: boolean; touchedAPI: boolean }): "required" | "optional" | undefined {
	const requiresKey = guardMethods(files).some((body) => {
		let required = false;
		walk(body, (inner) => {
			if (ts.isIdentifier(inner) && inner.text === "hasAPIData") required = true;
		});

		return required;
	});

	if (requiresKey) return "required";
	if (network || touchedAPI) return "optional";

	return undefined;
}
