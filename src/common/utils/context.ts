import type { FeatureManager } from "@features/feature";
import type { TornToolsStorage } from "@utils/data/storage";
import type { BadgeManager, RuntimeEnvironment } from "@utils/functions/runtime";
import type { ScriptInjector } from "@utils/functions/script-injector";

export let FEATURE_MANAGER: FeatureManager;
export let ttStorage: TornToolsStorage;
export let SCRIPT_INJECTOR: ScriptInjector;
export let RUNTIME_ENVIRONMENT: RuntimeEnvironment;
export let BADGE_MANAGER: BadgeManager;

export function setFeatureManager(featureManager: FeatureManager) {
	FEATURE_MANAGER = featureManager;
}

export function setTTStorage(storage: TornToolsStorage) {
	ttStorage = storage;
}

export function setScriptInjector(scriptInjector: ScriptInjector) {
	SCRIPT_INJECTOR = scriptInjector;
}

export function setRuntimeEnvironment(runtimeEnvironment: RuntimeEnvironment) {
	RUNTIME_ENVIRONMENT = runtimeEnvironment;
}

export function setBadgeManager(badgeManager: BadgeManager) {
	BADGE_MANAGER = badgeManager;
}
