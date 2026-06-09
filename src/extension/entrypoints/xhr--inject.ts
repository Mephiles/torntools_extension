import { setScriptInjector } from "@common/utils/context";
import { injectXhrListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	setScriptInjector({
		getWindow: () => window,
		injectXHR: () => {},
		injectFetch: () => {},
	});
	new RequestListenerInjector(injectXhrListeners).inject();

	console.log("Script Injected - XHR Interception");
});
