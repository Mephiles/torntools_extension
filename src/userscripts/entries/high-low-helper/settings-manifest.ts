import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.pages.casino.highlowMovement", label: "Move high-low buttons to make it easier to click through" }],
	overrides: [{ path: "settings.pages.casino.highlow", value: true }],
};

export default settingsManifest;
