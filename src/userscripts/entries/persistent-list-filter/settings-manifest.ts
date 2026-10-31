import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [
		{ path: "settings.pages.friends.nativeFilter", label: "Friends", description: "Remember Torn's native sort and status filter on the friends list." },
		{ path: "settings.pages.enemies.nativeFilter", label: "Enemies", description: "Remember Torn's native sort and status filter on the enemies list." },
		{ path: "settings.pages.targets.nativeFilter", label: "Targets", description: "Remember Torn's native sort and status filter on the targets list." },
	],
	overrides: [{ path: "settings.pages.customLinks.nativeFilter", value: false }],
};

export default settingsManifest;
