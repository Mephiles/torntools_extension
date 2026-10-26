import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.home.networthDetails", value: true },
		{ path: "settings.apiUsage.user.networth", value: true },
		{ path: "settings.apiUsage.user.personalstats", value: true },
	],
};

export default settingsManifest;
