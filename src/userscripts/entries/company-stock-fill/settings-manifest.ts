import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [{ path: "settings.pages.companies.autoStockFill", value: true }],
};

export default settingsManifest;
