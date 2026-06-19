import { injectCityItemsMapListeners } from "@common/features/city-items/city-items-map";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	injectCityItemsMapListeners();

	console.log("Script Injected - City Items Map Hooks");
});
