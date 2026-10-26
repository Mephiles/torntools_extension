import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.profile.avgpersonalstats", value: true }],
};

export default settingsManifest;
