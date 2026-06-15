import { setScriptInjector } from "@common/utils/context";
import { injectFetchListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	setScriptInjector({
		getWindow: () => window,
		injectXHR: () => {},
		injectFetch: () => {},
	});
	new RequestListenerInjector(injectFetchListeners).inject();

	console.log("Script Injected - Fetch Interception");
});
