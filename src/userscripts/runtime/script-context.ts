import { setFeatureManager, setScriptInjector, setTTStorage, ttStorage } from "@common/utils/context";
import { type DatabaseLocaldata, setLocaldata } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector, type ScriptInjector } from "@common/utils/functions/script-injector";
import type { Feature } from "@features/feature";
import type { FeatureManager } from "@features/feature-manager";
import { TTScriptStorage } from "@userscripts/runtime/script-storage";

export async function registerUserscriptContext() {
	setTTStorage(new TTScriptStorage());
	setFeatureManager(new ScriptFeatureManager());
	setScriptInjector(UserscriptScriptInjector);

	const [localdata] = await ttStorage.get(["localdata"]);

	if (localdata) {
		setLocaldata(localdata);
	} else {
		const defaultLocaldata = getDefaultStorage(DEFAULT_STORAGE.localdata) as DatabaseLocaldata;
		setLocaldata(defaultLocaldata);
	}
}

class ScriptFeatureManager implements FeatureManager {
	createPopup() {}

	isEnabled(): boolean {
		return true;
	}

	registerFeature(feature: Feature): void {
		feature.initialise();
		feature.execute();
	}
}

const fetchListenerInjector = new RequestListenerInjector(injectFetchListeners);
const xhrListenerInjector = new RequestListenerInjector(injectXhrListeners);

export const UserscriptScriptInjector: ScriptInjector = {
	injectFetch() {
		fetchListenerInjector.inject();
	},
	injectXHR() {
		xhrListenerInjector.inject();
	},
};
