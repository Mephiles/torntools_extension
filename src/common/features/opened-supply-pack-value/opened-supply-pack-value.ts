import "./opened-supply-pack-value.css";
import { isUseItem, type TornInternalUseItemSuccess } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, torndata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { convertToNumber, formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPage } from "@common/utils/functions/torn";
import { sleep, TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

const SUPPLY_PACK_ITEMS = [
	364, 365, 370, 588, 815, 817, 818, 1035, 1057, 1078, 1079, 1080, 1081, 1082, 1083, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122, 1293,
	1298,
];

function addListener() {
	if (getPage() !== "item") return;

	let reqXID: string | undefined;
	let itemID: number | undefined;

	addXHRListener(async ({ detail: { xhr, json } }) => {
		if (!FEATURE_MANAGER.isEnabled(OpenedSupplyPackValueFeature)) return;

		const params = new URLSearchParams(xhr.requestBody);
		if (!isUseItem(params.get("step"), json) || !json.success) return;

		if (json?.itemID) itemID = parseInt(json.itemID);
		else if (params.has("id")) itemID = convertToNumber(params.get("id"));
		else if (params.has("itemID")) itemID = convertToNumber(params.get("itemID"));

		if (shouldDisplayOpenedValue(itemID)) {
			reqXID = (await requireElement<HTMLInputElement>(`[data-item="${itemID}"] .pack-open-msg input[type="hidden"]`)).value;
		}

		if ((params.get("XID") === reqXID || isDrugPackUseRequest(params) || SUPPLY_PACK_ITEMS.includes(itemID)) && json.items?.itemAppear) {
			const totalOpenedValue = calculateValueFromResponse(json);

			await showTotalValue(totalOpenedValue, itemID);
		}
	});
}

function calculateValueFromResponse(response: TornInternalUseItemSuccess): number | null {
	if (!response.items?.itemAppear) return null;

	return response.items.itemAppear
		.map((item) => ("isMoney" in item ? convertToNumber(item.moneyGain.substring(1)) : torndata.itemsMap[item.ID].value.market_price * parseInt(item.qty)))
		.reduce((totalValue, value) => totalValue + value, 0);
}

async function showTotalValue(totalOpenedValue: number, itemID: number) {
	await sleep(0.5 * TO_MILLIS.SECONDS);
	const greenMsg = await requireElement(`[data-item="${itemID}"] .cont-wrap form p`);

	removeTotalValueElement();

	const openedValueTextElement = elementBuilder({
		id: "ttOpenedValueText",
		type: "strong",
		class: "tt-opened-supply-pack-value-text",
		text: `TornTools total value: ${formatNumber(totalOpenedValue, { currency: true })}`,
	});

	greenMsg.insertAdjacentElement("beforeend", openedValueTextElement);
}

export function calculateAndShowTotalValueInQuickItems(response: TornInternalUseItemSuccess, responseWrap: HTMLElement) {
	if (!FEATURE_MANAGER.isEnabled(OpenedSupplyPackValueFeature)) return;

	const totalOpenedValue = calculateValueFromResponse(response);
	if (!totalOpenedValue) return;

	const openedValueTextElement = elementBuilder({
		id: "ttOpenedValueText",
		type: "strong",
		class: "tt-opened-supply-pack-value-text",
		text: `TornTools total value: ${formatNumber(totalOpenedValue, { currency: true })}`,
	});

	responseWrap.appendChild(openedValueTextElement);
}

export function shouldDisplayOpenedValue(itemID: number) {
	return SUPPLY_PACK_ITEMS.includes(itemID) && !isDrugPack(itemID);
}

function isDrugPack(itemID: number) {
	return itemID === 370;
}

function isDrugPackUseRequest(params: URLSearchParams) {
	return convertToNumber(params.get("item")) === 370 || convertToNumber(params.get("itemID")) === 370;
}

function removeTotalValueElement() {
	document.getElementById("ttOpenedValueText")?.remove();
}

export default class OpenedSupplyPackValueFeature extends Feature {
	constructor() {
		super("Opened Supply Pack Value", "items");
	}

	isEnabled() {
		return settings.pages.items.openedSupplyPackValue;
	}

	initialise() {
		addListener();
	}

	cleanup() {
		removeTotalValueElement();
	}

	storageKeys() {
		return ["settings.pages.items.openedSupplyPackValue"];
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}
}
