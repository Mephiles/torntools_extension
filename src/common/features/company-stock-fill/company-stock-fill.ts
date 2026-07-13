import { isOwnCompany } from "@common/pages/company-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { convertToNumber, dropDecimals } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, REACT_UPDATE_VERSIONS, updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./company-stock-fill.module.css";

function addListener() {
	addCustomListener(EVENT_CHANNELS.COMPANY_STOCK_PAGE, async () => {
		if (!FEATURE_MANAGER.isEnabled(CompanyStockFillFeature)) return;

		await addFillStockButton(true);
	});
}

async function addFillStockButton(add: boolean = false) {
	if (!add && getHashParameters().get("option") !== "stock") return;

	(await requireElement("form[action*='stock'] .order ~ a")).insertAdjacentElement(
		"afterend",
		elementBuilder({
			type: "div",
			class: styles.ttFillStockWrapper,
			children: [elementBuilder({ type: "button", class: ["tt-btn", styles.ttFillStock], text: "FILL STOCK", events: { click: fillStock } })],
		}),
	);
}

async function fillStock() {
	const stockForm = await requireElement("form[action*='stock']");
	const storageCapacity = findAllElements(".storage-capacity > *", stockForm).map((x) => convertToNumber(x.dataset.initial));
	const usableCapacity = storageCapacity[1] - storageCapacity[0];
	const totalSoldDaily = convertToNumber(stockForm.querySelector(".stock-list > li.total .sold-daily")!.textContent);

	findAllElements(".stock-list > li:not(.total):not(.quantity)", stockForm).forEach((stockItem) => {
		const soldDaily = convertToNumber(stockItem.querySelector(".sold-daily")!.lastChild!.textContent);

		let neededStock = dropDecimals((soldDaily / totalSoldDaily) * usableCapacity);
		neededStock = Math.max(0, neededStock);

		updateReactInput(stockItem.querySelector("input")!, neededStock, { version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT });
	});
}

export default class CompanyStockFillFeature extends Feature {
	constructor() {
		super("Company Stock Fill", "companies");
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
		document.querySelector(`.${styles.ttFillStockWrapper}`)?.remove();
	}

	storageKeys() {
		return ["settings.pages.companies.autoStockFill"];
	}

	shouldLiveReload(): boolean {
		return true;
	}
}
