import { injectXhrListeners, RequestListenerInjector } from "@/utils/common/functions/request-listener-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	new RequestListenerInjector(injectXhrListeners).inject();

	console.log("Script Injected - XHR Interception");
});
