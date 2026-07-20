import { setScriptInjector } from "@common/utils/context";
import { injectFetchListeners, injectXhrListeners, RequestListenerInjector, type ScriptInjector } from "@common/utils/functions/script-injector";
import { injectCityItemsMapListeners } from "@features/city-items/city-items-map";
import { injectEfficientRehabListeners } from "@features/efficient-rehab/efficient-rehab-listeners";

export function registerInjectorUserscriptContext() {
	setScriptInjector(UserscriptScriptInjector);
}

function injectUserscriptCityItemsMapListeners() {
	injectCityItemsMapListeners(unsafeWindow);
}

function injectUserscriptEfficientRehabListeners() {
	injectEfficientRehabListeners(unsafeWindow);
}

const fetchListenerInjector = new RequestListenerInjector(injectFetchListeners);
const xhrListenerInjector = new RequestListenerInjector(injectXhrListeners);
const cityItemsMapListenerInjector = new RequestListenerInjector(injectUserscriptCityItemsMapListeners);
const efficientRehabInjector = new RequestListenerInjector(injectUserscriptEfficientRehabListeners);

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
	injectEfficientRehab() {
		efficientRehabInjector.inject();
	},
};
