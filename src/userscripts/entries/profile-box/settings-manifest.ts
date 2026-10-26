import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.pages.profile.boxFetch", label: "Profile box: automatically fetch data from the API" }],
	overrides: [
		{ path: "settings.pages.profile.box", value: true },
		{ path: "settings.pages.profile.boxStats", value: true },
		{ path: "settings.pages.profile.boxSpy", value: false },
		{ path: "settings.pages.profile.boxStakeout", value: false },
		{ path: "settings.pages.profile.boxAttackHistory", value: false },
		{ path: "settings.pages.global.keepAttackHistory", value: false },
		{ path: "settings.apiUsage.user.battlestats", value: false },
		{ path: "settings.apiUsage.user.crimes", value: true },
		{ path: "settings.apiUsage.user.personalstats", value: true },
	],
};

export default settingsManifest;
