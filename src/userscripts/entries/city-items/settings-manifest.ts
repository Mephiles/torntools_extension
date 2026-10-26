import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [
		{ path: "settings.pages.city.combineDuplicates", label: "Combine duplicate city map items" },
		{ path: "settings.pages.city.groupByPeriod", label: "Group items by period" },
		{
			path: "settings.pages.city.groupByPeriodUnit",
			label: "Group period unit",
			options: [
				{ value: "day", label: "Days" },
				{ value: "week", label: "Weeks" },
				{ value: "month", label: "Months" },
				{ value: "year", label: "Years" },
			],
		},
	],
	overrides: [{ path: "settings.pages.city.items", value: true }],
};

export default settingsManifest;
