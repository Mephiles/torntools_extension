import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.sidebar.cooldownEndTimes", value: true }],
};

export default settingsManifest;
