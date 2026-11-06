import { findElement } from "@common/utils/functions/find-elements.ts";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	findElement("#api-key").dispatchEvent(new Event("focusout"));
});
