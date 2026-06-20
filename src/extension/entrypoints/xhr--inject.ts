import { setScriptInjector } from "@common/utils/context";
import { DEFAULT_SCRIPT_INJECTOR, injectXhrListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	setScriptInjector(DEFAULT_SCRIPT_INJECTOR);
	new RequestListenerInjector(injectXhrListeners).inject();

	console.log("Script Injected - XHR Interception");
});
