import type { JQuery } from "@common/utils/type-helper";

declare const $: (selector: string) => JQuery;

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	$("#api_key").focusout();
});
