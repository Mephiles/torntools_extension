import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.travel.table", value: true },
		{ path: "settings.external.prometheus", value: true },
		{ path: "settings.external.tornintel", value: true },
		{ path: "settings.pages.travel.autoTravelTableCountry", value: true },
		{ path: "settings.apiUsage.user.travel", value: false },
		{ path: "settings.apiUsage.user.perks", value: false },
	],
};

export default settingsManifest;
