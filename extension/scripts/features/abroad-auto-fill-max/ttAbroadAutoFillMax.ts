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

		const money = convertToNumber((await requireElement(".info-msg-cont .msg strong:nth-of-type(2)")).textContent);
		if (money === 0) return;

		const capacityText = document.find(".info-msg-cont .msg strong:nth-of-type(3)").textContent.split(" / ");
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
			const stock = convertToNumber(item.find("[data-tt-content-type='stock']").textContent);
			if (stock === 0) return;

			const price = convertToNumber(item.find("[data-tt-content-type='type'] + div [class*='displayPrice__']").textContent);

			const affordableStock = dropDecimals(money / price);
			if (affordableStock === 0 || affordableStock === 1) return;

			const max = Math.min(stock, affordableStock, leftCapacity).toString();

			findAllElements<HTMLInputElement>("input[placeholder='Qty']", item).forEach((input) => {
				updateReactInput(input, max);
			});
		});
	}
})();
