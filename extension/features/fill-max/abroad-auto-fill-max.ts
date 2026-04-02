import { Feature } from "@/features/feature-manager";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { convertToNumber, dropDecimals } from "@/utils/common/functions/formatting";
import { isAbroad, updateReactInput } from "@/utils/common/functions/torn";

async function autoFillInputs() {
	await requireElement("[class*='stockTableWrapper___'] [class*='row___'] [data-tt-content-type]");

	const money = convertToNumber((await requireElement(".info-msg-cont .msg strong:nth-of-type(2)")).textContent);
	if (money === 0) return;

	const capacityText = document.querySelector(".info-msg-cont .msg strong:nth-of-type(3)").textContent.split(" / ");
	const boughtItems = convertToNumber(capacityText[0]);
	let travelCapacity = convertToNumber(capacityText[1]);
	if (
		hasAPIData() &&
		settings.apiUsage.user.perks &&
		userdata.job_perks.some((perk) => perk.includes("5 travel flower capacity") || (perk.includes("+5 plushies") && perk.includes("from abroad")))
	) {
		travelCapacity += 5;
	}

	const leftCapacity = travelCapacity - boughtItems;
	if (leftCapacity === 0) return;

	findAllElements("[class*='stockTableWrapper___'] [class*='row___']").forEach((item) => {
		const stock = convertToNumber(item.querySelector("[data-tt-content-type='stock']").textContent);
		if (stock === 0) return;

		const price = convertToNumber(item.querySelector("[data-tt-content-type='type'] + div [class*='displayPrice__']").textContent);

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

	precondition() {
		return isAbroad();
	}

	isEnabled() {
		return settings.pages.travel.autoFillMax;
	}

	async execute() {
		await autoFillInputs();
	}

	storageKeys() {
		return ["settings.pages.travel.autoFillMax"];
	}
}
