import { injectFetchListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	new RequestListenerInjector(injectFetchListeners).inject();

	console.log("Script Injected - Fetch Interception");
});
