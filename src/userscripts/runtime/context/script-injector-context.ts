import { setScriptInjector } from "@common/utils/context";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector, type ScriptInjector } from "@common/utils/functions/script-injector";
import { injectCityItemsMapListeners } from "@features/city-items/city-items-map";

export function registerInjectorUserscriptContext() {
	setScriptInjector(UserscriptScriptInjector);
}

function injectUserscriptCityItemsMapListeners() {
	injectCityItemsMapListeners(unsafeWindow);
}

const fetchListenerInjector = new RequestListenerInjector(injectFetchListeners);
const xhrListenerInjector = new RequestListenerInjector(injectXhrListeners);
const cityItemsMapListenerInjector = new RequestListenerInjector(injectUserscriptCityItemsMapListeners);

const UserscriptScriptInjector: ScriptInjector = {
	injectFetch() {
		fetchListenerInjector.inject();
	},
	injectXHR() {
		xhrListenerInjector.inject();
	},
	injectCityItemsMap() {
		cityItemsMapListenerInjector.inject();
	},
};
