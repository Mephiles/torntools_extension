import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.crimes2.pickpocketingFilter", value: true }],
};

export default settingsManifest;
