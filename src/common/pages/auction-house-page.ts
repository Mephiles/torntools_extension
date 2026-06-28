import { findAllElements } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { requireDOMContentLoaded } from "@common/utils/functions/requires";

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
