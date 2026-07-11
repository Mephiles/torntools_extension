import { setRuntimeInformation } from "@common/utils/context";
import { DEFAULT_RUNTIME_INFORMATION } from "@common/utils/functions/context-interfaces";
import { injectXhrListeners, RequestListenerInjector } from "@common/utils/functions/script-injector";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	setRuntimeInformation(DEFAULT_RUNTIME_INFORMATION);
	new RequestListenerInjector(injectXhrListeners).inject();

	console.log("Script Injected - XHR Interception");
});
