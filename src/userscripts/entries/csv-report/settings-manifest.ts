import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.csvDelimiter", label: "CSV delimiter" }],
	overrides: [
		{ path: "settings.pages.faction.csvChainReport", value: true },
		{ path: "settings.pages.faction.csvChallengeContributions", value: true },
		{ path: "settings.pages.faction.csvRaidReport", value: true },
		{ path: "settings.pages.faction.csvRankedWarReport", value: true },
		{ path: "settings.pages.faction.csvWarReport", value: true },
	],
};

export default settingsManifest;
