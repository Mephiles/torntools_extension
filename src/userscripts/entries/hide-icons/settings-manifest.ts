import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [
		{ path: "settings.hideIcons", label: "Hidden Sidebar Icons", description: "Select Torn icons that should be hidden in the sidebar.", type: "icons" },
	],
};

export default settingsManifest;
