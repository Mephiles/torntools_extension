import { findAllElements } from "@/utils/common/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireDOMContentLoaded } from "@/utils/common/functions/requires";

export async function setupAuctionHousePage() {
	await requireDOMContentLoaded();

	let previousType = "";

	for (const list of findAllElements(".items-list")) {
		new MutationObserver((mutations) => {
			if (mutations.every((mutation) => mutation.addedNodes.length === 2)) {
				return;
			}

			const type = list.parentElement.parentElement.dataset.itemtype;

			if (type === previousType) {
				triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
			} else {
				triggerCustomListener(EVENT_CHANNELS.AUCTION_SWITCH_TYPE, { type: type });
			}

			previousType = type;
		}).observe(list, { childList: true });
	}
}
