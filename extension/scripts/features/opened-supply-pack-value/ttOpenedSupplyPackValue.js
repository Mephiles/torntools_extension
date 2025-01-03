"use strict";

(async () => {
	const page = getPage();

	const feature = featureManager.registerFeature(
		"Opened supply pack total value",
		"items",
		() => settings.pages.items.openedSupplyPackValue,
		addListener,
		undefined,
		removeTotalValueElement,
		{ storage: ["settings.pages.items.openedSupplyPackValue"] },
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	const SUPPLY_PACK_ITEMS = [
		364, 365, 370, 588, 815, 817, 818, 1035, 1057, 1078, 1079, 1080, 1081, 1082, 1083, 1112, 1113, 1114, 1115, 1116, 1117, 1118, 1119, 1120, 1121, 1122,
		1293, 1298,
	];

	function addListener() {
		if (page !== "item") return;

		let reqXID = 0;
		let itemID = 0;

		addXHRListener(async ({ detail: { xhr, json } }) => {
			if (!feature.enabled()) return;

			const params = new URLSearchParams(xhr.requestBody);
			if (params.get("action") !== "use" && params.get("step") !== "useItem") return;

			itemID = params.get("id")?.getNumber() ?? itemID;
			if (isXIDRequestSupplyPack(itemID)) {
				reqXID = (await requireElement(`[data-item="${itemID}"] .pack-open-msg input[type="hidden"]`)).value;
			}

			if ((params.get("XID") === reqXID || isDrugPackUseRequest(params)) && json?.items?.itemAppear) {
				const totalOpenedValue = json.items.itemAppear
					.map((item) => (item.isMoney ? item.moneyGain.substring(1).getNumber() : torndata.items[item.ID].market_value * item.qty))
					.reduce((totalValue, value) => totalValue + value, 0);

				await showTotalValue(totalOpenedValue, itemID);
			}
		});
	}

	async function showTotalValue(totalOpenedValue, itemID) {
		await sleep(0.1 * TO_MILLIS.SECONDS);
		const greenMsg = await requireElement(`[data-item="${itemID}"] .cont-wrap form p`);

		removeTotalValueElement();

		const openedValueTextElement = document.newElement({
			id: "ttOpenedValueText",
			type: "strong",
			class: "tt-opened-supply-pack-value-text",
			text: `TornTools total value: ${formatNumber(totalOpenedValue, { currency: true })}`,
		});

		greenMsg.insertAdjacentElement("beforeend", openedValueTextElement);
	}

	function isXIDRequestSupplyPack(itemID) {
		return SUPPLY_PACK_ITEMS.includes(itemID) && !isDrugPack(itemID);
	}

	function isDrugPack(itemID) {
		return itemID === 370;
	}

	function isDrugPackUseRequest(params) {
		return params.get("item")?.getNumber() === 370 || params.get("itemID")?.getNumber() === 370;
	}

	function removeTotalValueElement() {
		document.getElementById("ttOpenedValueText")?.remove();
	}
})();
