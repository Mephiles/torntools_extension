import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.travel.cooldownWarnings", value: true },
		{ path: "settings.apiUsage.user.bars", value: true },
		{ path: "settings.apiUsage.user.cooldowns", value: true },
		{ path: "settings.apiUsage.user.education", value: true },
		{ path: "settings.apiUsage.user.money", value: true },
	],
};

export default settingsManifest;
