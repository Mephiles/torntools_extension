import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { requireElementOptionally } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.AUCTION_SWITCH_TYPE, movePagination);
}

async function movePagination() {
	const pagination = await requireElementOptionally(".tabContent[aria-expanded='true'] .pagination-wrap");
	if (!pagination?.previousElementSibling) return;

	pagination.parentElement!.insertBefore(pagination, pagination.parentElement!.firstElementChild!);
}

export default class AuctionHouseMovePaginationFeature extends Feature {
	constructor() {
		super("Auction House Move Pagination", "auction");
	}

	override isEnabled() {
		return settings.pages.auction.movePagination;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await movePagination();
	}

	override storageKeys() {
		return ["settings.pages.auction.movePagination"];
	}
}
