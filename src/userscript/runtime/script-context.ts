import type { Feature, FeatureManager } from "@features/feature";
import { TTScriptStorage } from "@userscript/runtime/script-storage";
import { UserscriptBadgeManager, UserscriptRuntimeEnvironment } from "@userscript/runtime/userscript-runtime";
import { setBadgeManager, setFeatureManager, setRuntimeEnvironment, setScriptInjector, setTTStorage, ttStorage } from "@utils/context";
import { type DatabaseLocaldata, setLocaldata } from "@utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@utils/data/default-database";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector } from "@utils/functions/request-listener-injector";
import type { ScriptInjector } from "@utils/functions/script-injector";

export async function registerUserscriptContext() {
	setTTStorage(new TTScriptStorage());
	setRuntimeEnvironment(UserscriptRuntimeEnvironment);
	setBadgeManager(UserscriptBadgeManager);
	setFeatureManager(new ScriptFeatureManager());
	setScriptInjector(UserscriptScriptInjector);

	const [localdata] = await ttStorage.get(["localdata"]);

	if (localdata) {
		setLocaldata(localdata);
	} else {
		const defaultLocaldata = getDefaultStorage(DEFAULT_STORAGE.localdata) as DatabaseLocaldata;
		await ttStorage.set({ localdata: defaultLocaldata });
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
