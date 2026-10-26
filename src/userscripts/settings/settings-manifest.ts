import type { PreferenceStoragePath, PreferenceStorageValue } from "@common/utils/data/preference-storage.ts";

export type SettingControlType = "switch" | "number" | "text" | "select";

export interface SettingsManifestOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface SettingsManifestEntry {
	path: PreferenceStoragePath;
	label: string;
	description?: string;
	type?: SettingControlType;
	options?: SettingsManifestOption[];
}

export type SettingsManifestOverride = {
	[Path in PreferenceStoragePath]: { path: Path; value: PreferenceStorageValue<Path> };
}[PreferenceStoragePath];

export interface SettingsManifest {
	settings?: SettingsManifestEntry[];
	overrides?: SettingsManifestOverride[];
}

export interface RegisteredScript {
	id: string;
	name: string;
	version: string;
	updatedAt: number;
	settings: SettingsManifestEntry[];
	overrides: SettingsManifestOverride[];
}
