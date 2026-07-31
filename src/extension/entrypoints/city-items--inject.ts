import { injectCityItemsMapListeners } from "@common/features/city-items/city-items-map";
import { registerExtensionInjectedScriptContext } from "@/runtime/extension-context.ts";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	registerExtensionInjectedScriptContext();

	injectCityItemsMapListeners();

	console.log("Script Injected - City Items Map Hooks");
});
