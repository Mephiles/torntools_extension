import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements, isElement } from "@/utils/common/functions/dom";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function addListener() {
	document.addEventListener("click", async (event) => {
		if (
			FEATURE_MANAGER.isEnabled(MuseumAutoFillFeature) &&
			isElement(event.target) &&
			event.target.closest(".museum-map > .pinpoint, .museum #tabs .boxes > .box")
		) {
			await autoFill();
		}
	});
}

async function autoFill() {
	await requireElement("[aria-hidden*='false'] .item-amount.qty");

	const quantities: number[] = [];
	findAllElements("[aria-hidden*='false'] .item-amount.qty").forEach((qty) => quantities.push(convertToNumber(qty.textContent) || 0));
	const leastQuantity = !quantities.includes(0) ? quantities.sort((a, b) => a - b)[0] : null;
	if (!leastQuantity) return;

	const input = document.querySelector<HTMLInputElement>("[aria-hidden*='false'] .set-description input[type*='tel']");
	if (!input.disabled) {
		input.value = leastQuantity.toString();
		input.dispatchEvent(new Event("keyup"));
	}
}

export default class MuseumAutoFillFeature extends Feature {
	constructor() {
		super("Museum Auto Fill", "museum");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.museum.autoFill;
	}

	initialise() {
		addListener();
	}

	async execute() {
		await autoFill();
	}

	storageKeys() {
		return ["settings.pages.museum.autoFill"];
	}
}
