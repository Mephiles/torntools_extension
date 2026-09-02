import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber, dropDecimals } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { isAbroad, updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function autoFillInputs() {
	await requireElement("[class*='stockTableWrapper___'] [class*='row___'] [data-tt-content-type]");

	const money = convertToNumber((await requireElement(".info-msg-cont .msg strong:nth-of-type(2)")).textContent);
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

	findAllElements("[class*='stockTableWrapper___'] [class*='row___']").forEach((item) => {
		const stock = convertToNumber(findElement("[data-tt-content-type='stock']", item).textContent);
		if (stock === 0) return;

		const price = convertToNumber(findElement("[data-tt-content-type='type'] + div [class*='displayPrice__']", item).textContent);

		const affordableStock = dropDecimals(money / price);
		if (affordableStock === 0 || affordableStock === 1) return;

		const max = Math.min(stock, affordableStock, leftCapacity).toString();

		findAllElements<HTMLInputElement>("input[placeholder='Qty']", item).forEach((input) => {
			updateReactInput(input, max);
		});
	});
}

export default class AbroadAutoFillMaxFeature extends Feature {
	constructor() {
		super("Abroad Auto Fill Max", "travel");
	}

	override precondition() {
		return isAbroad();
	}

	override isEnabled() {
		return settings.pages.travel.autoFillMax;
	}

	override async execute() {
		await autoFillInputs();
	}

	override storageKeys() {
		return ["settings.pages.travel.autoFillMax"];
	}
}
