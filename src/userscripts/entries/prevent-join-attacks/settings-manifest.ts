import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [{ path: "settings.pages.profile.preventJoinAttacksSkipNpcs", label: "Skip the warning for attackable NPCs" }],
	overrides: [{ path: "settings.pages.profile.preventJoinAttacks", value: true }],
};

export default settingsManifest;
