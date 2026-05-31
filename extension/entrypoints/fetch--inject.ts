import { injectFetchListeners, RequestListenerInjector } from "@/utils/common/functions/request-listener-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	new RequestListenerInjector(injectFetchListeners).inject();

	console.log("Script Injected - Fetch Interception");
});
