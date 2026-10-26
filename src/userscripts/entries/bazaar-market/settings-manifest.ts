import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.pages.itemmarket.bazaarItemHighlightScroll", label: "Scroll to the highlighted item" }],
	overrides: [
		{ path: "settings.external.tornw3b", value: true },
		{ path: "settings.pages.itemmarket.bazaars", value: true },
		{ path: "settings.pages.itemmarket.bazaarItemHighlight", value: true },
	],
};

export default settingsManifest;
