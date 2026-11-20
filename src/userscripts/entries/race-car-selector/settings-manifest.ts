import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [
		{
			path: "settings.pages.racing.trackCars",
			label: "Preferred car for each track",
			description: "Leave a track on auto to use the recommended car.",
			type: "race-cars",
		},
	],
	overrides: [
		{ path: "settings.pages.racing.carSelector", value: true },
		{ path: "settings.apiUsage.user.enlistedcars", value: true },
	],
};

export default settingsManifest;
