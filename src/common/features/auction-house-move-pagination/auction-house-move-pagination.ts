import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.AUCTION_SWITCH_TYPE, async () => {
		if (!FEATURE_MANAGER.isEnabled(AuctionHouseMovePaginationFeature)) return;

		await movePagination();
	});
}

async function movePagination() {
	const pagination = await requireElement(".tabContent[aria-expanded='true'] .pagination-wrap").catch<HTMLElement | null>(() => null);
	if (!pagination?.previousElementSibling) return;

	pagination.parentElement!.insertBefore(pagination, pagination.parentElement!.firstElementChild!);
}

export default class AuctionHouseMovePaginationFeature extends Feature {
	constructor() {
		super("Auction House Move Pagination", "auction");
	}

	isEnabled() {
		return settings.pages.auction.movePagination;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await movePagination();
	}

	storageKeys() {
		return ["settings.pages.auction.movePagination"];
	}
}
