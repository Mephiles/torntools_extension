import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.faction.warOnlineStatus", value: true }],
};

export default settingsManifest;
