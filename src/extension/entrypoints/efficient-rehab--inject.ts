import { injectEfficientRehabListeners } from "@features/efficient-rehab/efficient-rehab-listeners";
import { registerExtensionInjectedScriptContext } from "@/runtime/extension-context.ts";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	registerExtensionInjectedScriptContext();

	injectEfficientRehabListeners();
});
