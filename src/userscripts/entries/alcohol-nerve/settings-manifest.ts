import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.items.nerveGains", value: true },
		{ path: "settings.apiUsage.user.perks", value: true },
	],
};

export default settingsManifest;
