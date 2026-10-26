import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.attack.weaponExperience", value: true },
		{ path: "settings.apiUsage.user.weaponexp", value: true },
	],
};

export default settingsManifest;
