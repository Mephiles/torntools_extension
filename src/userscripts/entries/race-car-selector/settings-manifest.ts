import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.racing.carSelector", value: true },
		{ path: "settings.apiUsage.user.enlistedcars", value: true },
	],
};

export default settingsManifest;
