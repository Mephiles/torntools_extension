import type { FeatureManager } from "@/features/feature-manager";
import type { TornToolsStorage } from "@/utils/common/data/storage";
import type { ScriptInjector } from "@/utils/common/functions/script-injector";

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
