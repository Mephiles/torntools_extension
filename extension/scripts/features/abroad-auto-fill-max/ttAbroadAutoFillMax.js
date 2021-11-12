"use strict";

(async () => {
	if (!isAbroad() || getSearchParameters().get("page")) return;

	featureManager.registerFeature(
		"Abroad Auto Fill Max",
		"travel",
		() => settings.pages.travel.autoFillMax,
		null,
		autoFillInputs,
		null,
		{
			storage: ["settings.pages.travel.autoFillMax"],
		},
		null
	);

	async function autoFillInputs() {
		await requireElement(".users-list .last input[id]");

		const money = document.find(".info-msg-cont .msg .bold:nth-of-type(2)").textContent.getNumber();
		if (money === 0) return;
		const usedCapacity = document.find(".info-msg-cont .msg .bold:nth-of-type(3)").textContent.getNumber();
		const maxTravelCapacity = document.find(".info-msg-cont .msg .bold:nth-of-type(4)").textContent.getNumber();
		const travelCapacity = maxTravelCapacity - usedCapacity;
		if (travelCapacity === 0) return;
		document.findAll(".users-list > li").forEach((item) => {
			const stock = item.find(".stck-amount").textContent.getNumber();
			const price = item.find(".c-price").textContent.getNumber();
			const input = item.find("input[id]");

			const buyableStock = (money / price).dropDecimals();
			if (buyableStock === 0 || buyableStock === 1) return;
			const max = Math.min(stock, buyableStock, travelCapacity);
			input.value = max;
			input.setAttribute("value", max);
			input.dispatchEvent(new Event("keyup"));
		});
	}
})();
