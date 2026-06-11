import type { TornToolsStorage } from "@common/utils/data/storage";
import type { RuntimeInformation, RuntimeStorage } from "@common/utils/functions/context-interfaces";
import type { ScriptInjector } from "@common/utils/functions/script-injector";
import type { StaticItemResolver } from "@common/utils/torn-api/items";
import type { FeatureManager } from "@features/feature-manager";

export let FEATURE_MANAGER: FeatureManager;
export let ttStorage: TornToolsStorage;
export let SCRIPT_INJECTOR: ScriptInjector;
export let RUNTIME_INFORMATION: RuntimeInformation;
export let RUNTIME_STORAGE: RuntimeStorage;
export let OFFLOAD_SERVICE: OffloadService;
export let DATA_FETCHER: DataFetcher;
export let STATIC_ITEM_RESOLVER: StaticItemResolver;

export interface OffloadService {
	fetchRelay<R = any>(location: string, options: Record<string, any>): Promise<R>;
	initialize(): Promise<{ success: boolean; error?: any }>;
}

export interface FetchResponse {
	text: string;
	status: number;
	ok: boolean;
}

export interface DataFetcher {
	fetch(url: string, options?: { method?: string; headers?: Record<string, string>; body?: any; timeout?: number }): Promise<FetchResponse>;
}

export function setFeatureManager(featureManager: FeatureManager) {
	FEATURE_MANAGER = featureManager;
}

export function setTTStorage(storage: TornToolsStorage) {
	ttStorage = storage;
}

export function setScriptInjector(scriptInjector: ScriptInjector) {
	SCRIPT_INJECTOR = scriptInjector;
}

export function setRuntimeInformation(runtimeInformation: RuntimeInformation) {
	RUNTIME_INFORMATION = runtimeInformation;
}

export function setRuntimeStorage(runtimeStorage: RuntimeStorage) {
	RUNTIME_STORAGE = runtimeStorage;
}

export function setOffloadService(offloadService: OffloadService) {
	OFFLOAD_SERVICE = offloadService;
}

export function setDataFetcher(dataFetcher: DataFetcher) {
	DATA_FETCHER = dataFetcher;
}

export function setStaticItemResolver(staticItemResolver: StaticItemResolver) {
	STATIC_ITEM_RESOLVER = staticItemResolver;
}
