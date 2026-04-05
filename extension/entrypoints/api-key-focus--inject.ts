import type { JQuery } from "@/utils/common/type-helper";

declare const $: (selector: string) => JQuery;

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	$("#api_key").focusout();
});
