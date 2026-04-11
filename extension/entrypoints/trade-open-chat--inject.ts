import type { JQuery } from "@/utils/common/type-helper";

declare const $: (selector: string) => JQuery;

declare global {
	interface Window {
		chat?: {
			r(tradeID: string): void;
		};
	}
}

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(async () => {
	const playerID = (await cookieStore.get("uid")).value;
	const traderID = $(`#trade-container .log > li .desc a:not([href*="${playerID}"])`)
		.attr("href")
		.match(/XID=(\d*)/i)[1];

	if (window.chat && typeof window.chat === "object")
		// For Chat 2.0.
		window.chat.r(traderID);
	// For Chat 3.0, copied from Torn's mini profiles code.
	else
		window.dispatchEvent(
			new CustomEvent("chat.openChannel", {
				detail: {
					userId: String(traderID),
				},
			}),
		);
});
