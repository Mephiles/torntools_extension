import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.jail.filter", value: true },
		{ path: "settings.apiUsage.user.perks", value: false },
	],
};

export default settingsManifest;
