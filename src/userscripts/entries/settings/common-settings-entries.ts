import type { SettingsManifestEntry } from "@userscripts/settings/settings-manifest.ts";

export const EXTERNAL_CONNECTION__TORNSTATS: SettingsManifestEntry = {
	path: "settings.external.tornstats",
	label: "TornStats Connection",
	description: "Allow a connection to TornStats. Shared with all userscripts that use this",
};

export const EXTERNAL_CONNECTION__TORNSTATS__API_KEY: SettingsManifestEntry = {
	path: "api.tornstats.key",
	label: "TornStats API key",
	description: "Leave blank to use your Torn API key. Shared with all userscripts that use this.",
};
