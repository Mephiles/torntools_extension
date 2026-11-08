import { EXTERNAL_CONNECTION__TORNSTATS, EXTERNAL_CONNECTION__TORNSTATS__API_KEY } from "@userscripts/entries/settings/common-settings-entries.ts";
import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [EXTERNAL_CONNECTION__TORNSTATS, EXTERNAL_CONNECTION__TORNSTATS__API_KEY],
	overrides: [{ path: "settings.pages.companies.specials", value: true }],
};

export default settingsManifest;
