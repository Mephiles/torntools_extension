import { setScriptInjector } from "@common/utils/context";
import { DEFAULT_SCRIPT_INJECTOR, injectFetchListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	setScriptInjector(DEFAULT_SCRIPT_INJECTOR);
	new RequestListenerInjector(injectFetchListeners).inject();

	console.log("Script Injected - Fetch Interception");
});
