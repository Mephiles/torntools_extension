import { getTraderID } from "@features/trade-open-chat/trade-open-chat.ts";

declare global {
	interface Window {
		chat?: {
			r(tradeID: string): void;
		};
	}
}

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(async () => {
	const traderID = String(await getTraderID());

	if (window.chat && typeof window.chat === "object")
		// For Chat 2.0.
		window.chat.r(traderID);
	else
		// For Chat 3.0, copied from Torn's mini profiles code.
		window.dispatchEvent(new CustomEvent("chat.openChannel", { detail: { userId: traderID } }));
});
