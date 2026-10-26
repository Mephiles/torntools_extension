import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.faction.rankedWarFilter", value: true },
		{ path: "settings.scripts.ffScouter.gauge", value: false },
		{ path: "settings.scripts.statsEstimate.global", value: false },
		{ path: "settings.scripts.statsEstimate.rankedWars", value: false },
		{ path: "settings.external.ffScouter", value: false },
		{ path: "api.ffScouter.key", value: "" },
	],
};

export default settingsManifest;
