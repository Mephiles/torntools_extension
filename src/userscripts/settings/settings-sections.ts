import type { RegisteredScript, SettingsManifestEntry } from "@userscripts/settings/settings-manifest";

export interface SharedSettingsEntry {
	entry: SettingsManifestEntry;
	scripts: string[];
}

export interface ScriptSettingsSection {
	script: RegisteredScript;
	entries: SettingsManifestEntry[];
}

export interface SettingsLayout {
	shared: SharedSettingsEntry[];
	scripts: ScriptSettingsSection[];
}

export function getHiddenSettingPaths(scripts: readonly RegisteredScript[]): Set<string> {
	return new Set(scripts.flatMap((script) => script.overrides.map((override) => override.path)));
}

export function buildSettingsLayout(scripts: readonly RegisteredScript[]): SettingsLayout {
	const hiddenPaths = getHiddenSettingPaths(scripts);
	const scriptNames = new Map(scripts.map((script) => [script.id, script.name]));
	const entriesByPath = new Map<string, { entry: SettingsManifestEntry; scriptIds: Set<string> }>();

	for (const script of scripts) {
		for (const entry of script.settings) {
			if (hiddenPaths.has(entry.path)) continue;

			const existing = entriesByPath.get(entry.path);
			if (existing) existing.scriptIds.add(script.id);
			else entriesByPath.set(entry.path, { entry, scriptIds: new Set([script.id]) });
		}
	}

	const shared = Array.from(entriesByPath.values())
		.filter((item) => item.scriptIds.size > 1)
		.map((item) => ({
			entry: item.entry,
			scripts: Array.from(item.scriptIds).map((id) => scriptNames.get(id) ?? id),
		}));

	const sections = scripts
		.map((script) => ({
			script,
			entries: Array.from(entriesByPath.values())
				.filter((item) => item.scriptIds.size === 1 && item.scriptIds.has(script.id))
				.map((item) => item.entry),
		}))
		.filter((section) => section.entries.length > 0);

	return { shared, scripts: sections };
}
