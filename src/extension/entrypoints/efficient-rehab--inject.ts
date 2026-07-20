import { injectEfficientRehabListeners } from "@features/efficient-rehab/efficient-rehab-listeners";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	injectEfficientRehabListeners();
});
