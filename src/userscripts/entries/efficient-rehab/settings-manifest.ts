import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.pages.travel.efficientRehabSelect", label: "Automatically set rehab slider to the current amount" }],
	overrides: [
		{ path: "settings.pages.travel.efficientRehab", value: true },
		{ path: "settings.apiUsage.user.personalstats", value: true },
	],
};

export default settingsManifest;
