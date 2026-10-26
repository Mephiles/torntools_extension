import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.pages.faction.memberFilterRevivable", label: "Filter on revivable status" }],
	overrides: [
		{ path: "settings.pages.faction.memberFilter", value: true },
		{ path: "settings.scripts.ffScouter.factionList", value: false },
		{ path: "settings.scripts.ffScouter.gauge", value: false },
		{ path: "settings.scripts.lastAction.factionMember", value: false },
		{ path: "settings.external.ffScouter", value: false },
		{ path: "api.ffScouter.key", value: "" },
	],
};

export default settingsManifest;
