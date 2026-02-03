(async () => {
	if (!isAbroad()) return;

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
		await requireElement("[class*='stockTableWrapper___'] [class*='row___'] [data-tt-content-type]");

		const money = (await requireElement(".info-msg-cont .msg strong:nth-of-type(2)")).textContent.getNumber();
		if (money === 0) return;

		const capacityText = document.find(".info-msg-cont .msg strong:nth-of-type(3)").textContent.split(" / ");
		const boughtItems = capacityText[0].getNumber();
		let travelCapacity = capacityText[1].getNumber();
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
			const stock = item.find("[data-tt-content-type='stock']").textContent.getNumber();
			if (stock === 0) return;

			const price = item.find("[data-tt-content-type='type'] + div [class*='displayPrice__']").textContent.getNumber();

			const affordableStock = (money / price).dropDecimals();
			if (affordableStock === 0 || affordableStock === 1) return;

			const max = Math.min(stock, affordableStock, leftCapacity).toString();

			findAllElements<HTMLInputElement>("input[placeholder='Qty']", item).forEach((input) => {
				updateReactInput(input, max);
			});
		});
	}
})();
