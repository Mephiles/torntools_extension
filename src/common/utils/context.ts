import type { TornToolsStorage } from "@common/utils/data/storage";
import type { ScriptInjector } from "@common/utils/functions/script-injector";
import type { FeatureManager } from "@features/feature-manager";

export let FEATURE_MANAGER: FeatureManager;
export let ttStorage: TornToolsStorage;
export let SCRIPT_INJECTOR: ScriptInjector;

export function setFeatureManager(featureManager: FeatureManager) {
	FEATURE_MANAGER = featureManager;
}

export function setTTStorage(storage: TornToolsStorage) {
	ttStorage = storage;
}

export function setScriptInjector(scriptInjector: ScriptInjector) {
	SCRIPT_INJECTOR = scriptInjector;
}
