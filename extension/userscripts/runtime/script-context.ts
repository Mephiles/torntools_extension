import type { Feature, FeatureManager } from "@/features/feature-manager";
import { TTScriptStorage } from "@/userscripts/runtime/script-storage";
import { type DatabaseLocaldata, setLocaldata } from "@/utils/common/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@/utils/common/data/default-database";
import { ttStorage } from "@/utils/common/data/storage";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector } from "@/utils/common/functions/request-listener-injector";
import type { ScriptInjector } from "@/utils/common/functions/script-injector";
import { setFeatureManager, setScriptInjector, setTTStorage } from "@/utils/context";

export async function registerUserscriptContext() {
	setTTStorage(new TTScriptStorage());
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
