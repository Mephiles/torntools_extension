import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.global.miniProfileLastAction", value: true }],
};

export default settingsManifest;
