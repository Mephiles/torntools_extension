import { isOwnCompany } from "@common/pages/company-page";
import { Feature } from "@features/feature";
import { FEATURE_MANAGER } from "@utils/context";

import { settings } from "@utils/data/database";
import { elementBuilder, findAllElements, getHashParameters } from "@utils/functions/dom";
import { convertToNumber, dropDecimals } from "@utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";
import { getPageStatus, REACT_UPDATE_VERSIONS, updateReactInput } from "@utils/functions/torn";
import "./auto-stock-fill.css";

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_STOCK_PAGE].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(AutoStockFillFeature)) return;

		await addFillStockButton(true);
	});
}

async function addFillStockButton(add: boolean) {
	if (!add && getHashParameters().get("option") !== "stock") return;

	(await requireElement("form[action*='stock'] .order ~ a")).insertAdjacentElement(
		"afterend",
		elementBuilder({
			type: "div",
			class: "tt-fill-stock-wrapper",
			children: [elementBuilder({ type: "button", class: "tt-btn tt-fill-stock", text: "FILL STOCK", events: { click: fillStock } })],
		}),
	);
}

async function fillStock() {
	const stockForm: Element = await requireElement("form[action*='stock']");
	const storageCapacity = findAllElements(".storage-capacity > *", stockForm).map((x) => convertToNumber(x.dataset.initial));
	const usableCapacity = storageCapacity[1] - storageCapacity[0];
	const totalSoldDaily = convertToNumber(stockForm.querySelector(".stock-list > li.total .sold-daily").textContent);
	console.log(storageCapacity, usableCapacity, totalSoldDaily);

	findAllElements(".stock-list > li:not(.total):not(.quantity)", stockForm).forEach((stockItem) => {
		const soldDaily = convertToNumber(stockItem.querySelector(".sold-daily").lastChild.textContent);

		let neededStock = dropDecimals((soldDaily / totalSoldDaily) * usableCapacity);
		neededStock = Math.max(0, neededStock);

		console.log(soldDaily, neededStock);

		updateReactInput(stockItem.querySelector("input"), neededStock, { version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT });
	});
}

export default class AutoStockFillFeature extends Feature {
	constructor() {
		super("Auto Fill Stock", "companies");
	}

	precondition() {
		return getPageStatus().access && isOwnCompany;
	}

	isEnabled() {
		return settings.pages.companies.autoStockFill;
	}

	initialise() {
		addListener();
	}

	async execute(liveReload?: boolean) {
		await addFillStockButton(liveReload);
	}

	cleanup() {
		findAllElements(".tt-fill-stock").forEach((x) => x.remove());
	}

	storageKeys() {
		return ["settings.pages.companies.autoStockFill"];
	}

	shouldLiveReload(): boolean {
		return true;
	}
}
