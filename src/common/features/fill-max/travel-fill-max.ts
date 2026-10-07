import { markTravelTableColumns } from "@common/pages/travel-abroad-page.ts";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api.ts";
import { elementBuilder } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events.ts";
import { findAllElements, findElement } from "@common/utils/functions/find-elements.ts";
import { convertToNumber, dropDecimals } from "@common/utils/functions/formatting.ts";
import { requireElement } from "@common/utils/functions/requires.ts";
import { getPageStatus, isAbroad, updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./fill-max.module.css";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD, displayFillMaxButtons);
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_REFRESH, displayFillMaxButtons);
	addCustomListener(EVENT_CHANNELS.TRAVEL_ABROAD__ITEM_BOUGHT, displayFillMaxButtons);
}

async function displayFillMaxButtons() {
	await requireElement("[class*='stockTableWrapper___']");
	await markTravelTableColumns();

	findAllElements(`[class*='stockTableWrapper___'] > li:not(:has(.${styles.ttMaxBuyAbroad})):has(li[class*='row___'])`).forEach((row) => {
		const parent = findElement("[data-tt-content-type='buy']", row);

		parent.append(
			elementBuilder({
				type: "button",
				class: [styles.ttMaxBuy, styles.ttMaxBuyAbroad],
				text: "fill max",
				events: {
					click() {
						fillMax(row);
					},
				},
			}),
		);
	});
}

function fillMax(row: HTMLElement) {
	const money = convertToNumber(findElement(".info-msg-cont .msg strong:nth-of-type(2)").textContent);
	if (money === 0) return;

	const capacityText = findElement(".info-msg-cont .msg strong:nth-of-type(3)").textContent.split(" / ");
	const boughtItems = convertToNumber(capacityText[0]);
	let travelCapacity = convertToNumber(capacityText[1]);
	if (
		hasAPIData() &&
		settings.apiUsage.user.perks &&
		userdata.perks.job.some((perk) => perk.includes("5 travel flower capacity") || (perk.includes("+5 plushies") && perk.includes("from abroad")))
	) {
		travelCapacity += 5;
	}

	const leftCapacity = travelCapacity - boughtItems;
	if (leftCapacity === 0) return;

	const stock = convertToNumber(findElement("[data-tt-content-type='stock']", row).textContent);
	if (stock === 0) return;

	const price = convertToNumber(findElement("[data-tt-content-type='type'] + div [class*='displayPrice__']", row).textContent);

	const affordableStock = dropDecimals(money / price);
	if (affordableStock === 0 || affordableStock === 1) return;

	const max = Math.min(stock, affordableStock, leftCapacity).toString();

	findAllElements<HTMLInputElement>("input[placeholder='Qty']", row).forEach((input) => {
		updateReactInput(input, max);
	});
}

export default class TravelFillMaxFeature extends Feature {
	constructor() {
		super("Travel Fill Max", "travel");
	}

	override precondition() {
		return getPageStatus().access && isAbroad();
	}

	override isEnabled(): boolean {
		return settings.pages.travel.fillMax;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await displayFillMaxButtons();
	}

	override storageKeys(): string[] {
		return ["settings.pages.travel.fillMax"];
	}
}
