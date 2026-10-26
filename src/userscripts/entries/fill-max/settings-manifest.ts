import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	overrides: [
		{ path: "settings.pages.bazaar.fillMax", value: true },
		{ path: "settings.pages.bazaar.maxBuyIgnoreCash", value: false },
		{ path: "settings.pages.itemmarket.fillMax", value: true },
		{ path: "settings.pages.shops.fillMax", value: true },
		{ path: "settings.pages.shops.maxBuyIgnoreCash", value: false },
		{ path: "settings.pages.travel.fillMax", value: true },
		{ path: "settings.apiUsage.user.perks", value: false },
	],
};

export default settingsManifest;
