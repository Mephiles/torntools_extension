import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.stocks.filter", value: true },
		{ path: "settings.apiUsage.user.stocks", value: true },
	],
};

export default settingsManifest;
