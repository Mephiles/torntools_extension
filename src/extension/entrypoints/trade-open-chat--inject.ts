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

	// For Chat v3, copied from Torn's mini profiles code.
	window.dispatchEvent(new CustomEvent("chat.openChannel", { detail: { userId: traderID } }));
});
