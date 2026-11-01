import type { DatabaseApi, DatabaseSettings, RecursivePartial } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import type { PreferenceStoragePath } from "@common/utils/data/preference-storage";
import { logger } from "@common/utils/functions/logger.ts";
import type { RegisteredScript, SettingsManifest, SettingsManifestOverride } from "@userscripts/settings/settings-manifest";

const SHARED_SETTINGS_KEY = "tt_shared_settings";
const REGISTRATION_KEY_PREFIX = "tt_script_registration_";
const REGISTRATION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const SHARED_SETTINGS_VERSION = 1;
const LEGACY_API_KEY = "tt_scripts_key";

const DEFAULT_SETTINGS = getDefaultStorage(DEFAULT_STORAGE.settings) as DatabaseSettings;
const DEFAULT_API = getDefaultStorage(DEFAULT_STORAGE.api) as DatabaseApi;

interface SharedSettingsData {
	version: number;
	settings: Record<string, unknown>;
	api: Record<string, unknown>;
}

function emptySharedSettings(): SharedSettingsData {
	return { version: SHARED_SETTINGS_VERSION, settings: {}, api: {} };
}

function readSharedSettings(): SharedSettingsData {
	try {
		const parsed = JSON.parse(localStorage.getItem(SHARED_SETTINGS_KEY) ?? "null") as Partial<SharedSettingsData> | null;
		if (!isPlainObject(parsed)) return emptySharedSettings();

		return {
			version: typeof parsed.version === "number" ? parsed.version : SHARED_SETTINGS_VERSION,
			settings: isPlainObject(parsed.settings) ? parsed.settings : {},
			api: isPlainObject(parsed.api) ? parsed.api : {},
		};
	} catch {
		return emptySharedSettings();
	}
}

function writeSharedSettings(data: SharedSettingsData) {
	localStorage.setItem(SHARED_SETTINGS_KEY, JSON.stringify(data));
}

export function mergeDefaults<T>(defaults: T, patch: unknown): T {
	if (patch === undefined) return defaults;
	if (!isPlainObject(defaults) || !isPlainObject(patch)) return patch as T;

	const result: Record<string, unknown> = { ...defaults };
	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) continue;
		result[key] = mergeDefaults(result[key], value);
	}

	return result as T;
}

export function applyManifestOverrides<T>(value: T, overrides: readonly SettingsManifestOverride[] | undefined, root: "settings" | "api"): T {
	let result = value;

	for (const override of overrides ?? []) {
		const [overrideRoot, ...segments] = override.path.split(".");
		if (overrideRoot !== root) continue;
		result = setAtPath(result, segments, override.value);
	}

	return result;
}

export function getEffectiveSettings(manifest?: SettingsManifest): DatabaseSettings {
	const merged = mergeDefaults(DEFAULT_SETTINGS, readSharedSettings().settings);
	return applyManifestOverrides(merged, manifest?.overrides, "settings");
}

export function getEffectiveApi(manifest?: SettingsManifest): DatabaseApi {
	migrateLegacyApiKey();

	const merged = mergeDefaults(DEFAULT_API, readSharedSettings().api);
	return applyManifestOverrides(merged, manifest?.overrides, "api");
}

export async function applySettingsPatch(patch: RecursivePartial<DatabaseSettings>): Promise<void> {
	const data = readSharedSettings();
	data.settings = mergeDefaults(data.settings, patch);
	writeSharedSettings(data);
}

/** Seeds settings the user has never touched, so a script can ship enabled without locking the setting. */
export async function applySettingsDefaults(defaults: RecursivePartial<DatabaseSettings>): Promise<void> {
	const data = readSharedSettings();
	data.settings = mergeDefaults(defaults, data.settings);
	writeSharedSettings(data);
}

export async function applyApiPatch(patch: RecursivePartial<DatabaseApi>): Promise<void> {
	const data = readSharedSettings();
	data.api = mergeDefaults(data.api, patch);
	writeSharedSettings(data);
}

export function updateSharedPreference(path: PreferenceStoragePath, value: unknown): Promise<void> {
	const [root, ...segments] = path.split(".");
	const patch = buildPatch(segments, value);

	if (root === "settings") return applySettingsPatch(patch as RecursivePartial<DatabaseSettings>);
	if (root === "api") return applyApiPatch(patch as RecursivePartial<DatabaseApi>);

	return Promise.reject(new Error(`Unsupported shared setting path: ${path}`));
}

export function registerScript(fallbackId: string, manifest: SettingsManifest): void {
	const info = getScriptInfo();
	const registration: RegisteredScript = {
		id: info.namespace ?? fallbackId,
		name: info.name,
		version: info.version,
		updatedAt: Date.now(),
		settings: manifest.settings ?? [],
		overrides: manifest.overrides ?? [],
	};

	try {
		localStorage.setItem(REGISTRATION_KEY_PREFIX + registration.id, JSON.stringify(registration));
	} catch (e) {
		logger.warn("Registration of this script failed. As a result the settings for it won't be available.", e);
	}
}

export function getRegisteredScripts(now = Date.now()): RegisteredScript[] {
	const keys: string[] = [];
	for (let index = 0; index < localStorage.length; index++) {
		const key = localStorage.key(index);
		if (key?.startsWith(REGISTRATION_KEY_PREFIX)) keys.push(key);
	}

	const scripts: RegisteredScript[] = [];
	for (const key of keys) {
		const script = parseRegistration(localStorage.getItem(key));
		if (!script || !isRegistrationFresh(script, now)) {
			localStorage.removeItem(key);
			continue;
		}

		scripts.push(script);
	}

	return scripts.sort((first, second) => first.name.localeCompare(second.name));
}

export function forgetScript(id: string): void {
	localStorage.removeItem(REGISTRATION_KEY_PREFIX + id);
}

export function isRegistrationFresh(script: RegisteredScript, now = Date.now()): boolean {
	return now - script.updatedAt <= REGISTRATION_TTL_MS;
}

function migrateLegacyApiKey() {
	const data = readSharedSettings();
	const torn = data.api.torn;
	if (isPlainObject(torn) && "key" in torn) return;

	const legacyKey = localStorage.getItem(LEGACY_API_KEY);
	if (!legacyKey) return;

	data.api = mergeDefaults(data.api, { torn: { key: legacyKey } });
	try {
		writeSharedSettings(data);
	} catch {
		// Keep using the defaults; the key will be picked up on the next read.
	}
}

function getScriptInfo(): { name: string; version: string; namespace?: string } {
	// Baked in at build time, because TornPDA exposes GM.info.script as an empty object.
	if (typeof __TT_SCRIPT_NAME__ !== "undefined") {
		return {
			name: __TT_SCRIPT_NAME__.replace(/^TORN: TornTools - /, ""),
			version: __TT_SCRIPT_VERSION__,
			namespace: __TT_SCRIPT_NAMESPACE__,
		};
	}

	try {
		const info = typeof GM !== "undefined" ? GM.info : undefined;
		const name = info?.script?.name ?? "TornTools userscript";

		return { name: name.replace(/^TORN: TornTools - /, ""), version: info?.version ?? "0.0.0", namespace: info?.script?.namespace };
	} catch {
		return { name: "TornTools userscript", version: "0.0.0" };
	}
}

function parseRegistration(raw: string | null): RegisteredScript | null {
	if (!raw) return null;

	try {
		const value = JSON.parse(raw) as Partial<RegisteredScript>;
		if (typeof value.id !== "string" || typeof value.name !== "string" || typeof value.version !== "string") return null;
		if (typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) || !Array.isArray(value.settings) || !Array.isArray(value.overrides))
			return null;

		return {
			id: value.id,
			name: value.name,
			version: value.version,
			updatedAt: value.updatedAt,
			settings: value.settings.filter(isSettingsEntry),
			overrides: value.overrides.filter(isOverride),
		};
	} catch {
		return null;
	}
}

function isSettingsEntry(value: unknown): value is RegisteredScript["settings"][number] {
	return (
		isPlainObject(value) &&
		typeof value.path === "string" &&
		typeof value.label === "string" &&
		(value.description === undefined || typeof value.description === "string") &&
		(value.type === undefined || typeof value.type === "string") &&
		(value.options === undefined || Array.isArray(value.options))
	);
}

function isOverride(value: unknown): value is RegisteredScript["overrides"][number] {
	return isPlainObject(value) && typeof value.path === "string" && "value" in value;
}

function buildPatch(segments: string[], value: unknown): unknown {
	const [key, ...remaining] = segments;
	if (!key) return value;

	return { [key]: buildPatch(remaining, value) };
}

function setAtPath(value: unknown, segments: string[], next: unknown): any {
	const [key, ...remaining] = segments;
	if (!key) return next;

	const source = isPlainObject(value) ? value : {};
	return { ...source, [key]: setAtPath(source[key], remaining, next) };
}

function isPlainObject(value: unknown): value is Record<string, any> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
