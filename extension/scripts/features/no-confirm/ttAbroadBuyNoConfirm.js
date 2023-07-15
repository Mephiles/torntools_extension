"use strict";

(async () => {
	if (isFlying() || !isAbroad()) return;

	const feature = featureManager.registerFeature(
		"Abroad Buy No Confirm",
		"no confirm",
		() => settings.scripts.noConfirm.abroadItemBuy,
		showConfirmBuy,
		null,
		null,
		null,
		null
	);

	async function showConfirmBuy() {
		const itemsList = await requireElement(".travel-agency-market .users-list");

		[...itemsList.children].forEach((row) => {
			const itemType = row.find(".item-info-wrap .type").lastChild.textContent.trim();
			if (!["Flower", "Plushie"].includes(itemType)) return;

			row.classList.add("expanded");
			row.find(".confirm-buy").style.display = "block";
		});
	}
})();
