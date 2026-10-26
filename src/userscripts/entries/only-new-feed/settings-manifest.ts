import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.forums.onlyNewFeedButton", value: true }],
};

export default settingsManifest;
