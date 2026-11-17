import type { PortAnalysis, PortTodo, SettingsEntry, SettingsOverride } from "./analyse";
import { entryImportBinding, entryImportPath } from "./analyse";

export interface RenderedPort {
	metadata: string;
	settingsManifest: string;
	user: string;
}

export function renderPort(analysis: PortAnalysis): RenderedPort {
	return {
		metadata: renderMetadata(analysis),
		settingsManifest: renderSettingsManifest(analysis),
		user: renderEntry(analysis),
	};
}

function renderMetadata(analysis: PortAnalysis): string {
	return joinLines([
		...todoBlock(analysis.todos, "metadata"),
		'import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";',
		"",
		"const metadata: UserscriptMetadata = {",
		`\tname: ${literal(analysis.name)},`,
		`\tdescription: ${literal(analysis.description)},`,
		`\tversion: ${literal(analysis.version)},`,
		`\tmatches: ${literalArray(analysis.matches)},`,
		`\trunAt: ${literal(analysis.runAt)},`,
		...(analysis.connect.length ? [`\tconnect: ${literalArray(analysis.connect)},`] : []),
		"};",
		"",
		"export default metadata;",
	]);
}

function renderSettingsManifest(analysis: PortAnalysis): string {
	const settings = [...analysis.settings.flatMap(settingsEntry), ...analysis.sharedEntries.map((entry) => `\t\t${entry.constant},`)];
	const overrides = analysis.overrides.map(settingsOverride);

	return joinLines([
		...todoBlock(analysis.todos, "settings-manifest"),
		...(analysis.sharedEntries.length
			? [
					`import { ${analysis.sharedEntries.map((entry) => entry.constant).join(", ")} } from "@userscripts/entries/settings/common-settings-entries.ts";`,
				]
			: []),
		'import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";',
		"",
		"const settingsManifest: SettingsManifest = {",
		...(settings.length ? ["\tsettings: [", ...settings, "\t],"] : []),
		...(overrides.length ? ["\toverrides: [", ...overrides, "\t],"] : []),
		"};",
		"",
		"export default settingsManifest;",
	]);
}

function settingsEntry(entry: SettingsEntry): string[] {
	const fields = [`path: ${literal(entry.path)}`, `label: ${literal(entry.label)}`];
	if (entry.description) fields.push(`description: ${literal(entry.description)}`);

	return [...(entry.todo ? [`\t\t// TODO(port): ${entry.todo}`] : []), `\t\t{ ${fields.join(", ")} },`];
}

function settingsOverride(override: SettingsOverride): string {
	return `\t\t{ path: ${literal(override.path)}, value: ${override.value} },`;
}

function renderEntry(analysis: PortAnalysis): string {
	return joinLines([
		...todoBlock(analysis.todos, "user"),
		'import { FEATURE_MANAGER } from "@common/utils/context";',
		...analysis.classes.map((klass) => `import ${entryImportBinding(klass)} from ${literal(entryImportPath(klass))};`),
		'import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";',
		'import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";',
		...(analysis.injector ? ['import { registerInjectorUserscriptContext } from "@userscripts/runtime/context/script-injector-context";'] : []),
		...(analysis.network ? ['import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";'] : []),
		...(analysis.apiKey === "required" ? ['import { requiresAPIKey } from "@userscripts/runtime/script-fetch";'] : []),
		...(analysis.apiKey === "optional" ? ['import { optionalAPIKey } from "@userscripts/runtime/script-fetch";'] : []),
		...(analysis.loadItems ? ['import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";'] : []),
		'import settingsManifest from "./settings-manifest.ts";',
		"",
		"(async () => {",
		"\tregisterCoreUserscriptContext();",
		`\tawait registerDatabaseUserscriptContext(${literal(analysis.storagePrefix)}, settingsManifest);`,
		...(analysis.network ? ["\tregisterNetworkUserscriptContext();"] : []),
		...(analysis.injector ? ["\tregisterInjectorUserscriptContext();"] : []),
		...(analysis.loadItems ? ["\tawait ScriptItemResolver.loadItems();"] : []),
		...(analysis.apiKey === "required" ? ["\tawait requiresAPIKey();"] : []),
		...(analysis.apiKey === "optional" ? ["\toptionalAPIKey();"] : []),
		"",
		...analysis.classes.map((klass) => `\tFEATURE_MANAGER.registerFeature(new ${klass.className}());`),
		"})();",
	]);
}

function todoBlock(todos: PortTodo[], file: PortTodo["file"]): string[] {
	return [...new Set(todos.filter((todo) => todo.file === file).map((todo) => todo.message))].map((message) => `// TODO(port): ${message}`);
}

function joinLines(lines: string[]): string {
	return `${lines.join("\n")}\n`;
}

function literal(value: string): string {
	return JSON.stringify(value);
}

function literalArray(values: string[]): string {
	return `[${values.map(literal).join(", ")}]`;
}
