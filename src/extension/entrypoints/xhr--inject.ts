import { injectXhrListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	new RequestListenerInjector(injectXhrListeners).inject();

	console.log("Script Injected - XHR Interception");
});
