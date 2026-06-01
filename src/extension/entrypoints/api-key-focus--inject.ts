import type { JQuery } from "@utils/type-helper";

declare const $: (selector: string) => JQuery;

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	$("#api_key").focusout();
});
