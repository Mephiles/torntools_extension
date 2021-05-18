"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Bazaar Worth",
		"bazaar",
		() => settings.pages.bazaar.worth,
		null,
		addWorth,
		removeWorth,
		{
			storage: ["settings.pages.bazaar.worth"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	async function addWorth() {
		await requireElement(".info-msg-cont .msg");
		const bazaarUserId = getSearchParameters().get("userId");
		fetchApi("torn", { section: "user", id: bazaarUserId, selections: ["bazaar"] })
			.then((result) => {
				let total = 0;

				for (const item of result.bazaar) {
					total += item.market_price * item.quantity;
				}

				document.find(".info-msg-cont .msg").appendChild(
					document.newElement({
						type: "div",
						class: "tt-bazaar-text",
						text: "This bazaar is worth ",
						children: [document.newElement({ type: "span", text: formatNumber(total, { currency: true }) + "." })],
					})
				);
			})
			.catch((err) => {
				console.log("ERROR", err);
			});
	}

	function removeWorth() {
		document.find(".tt-bazaar-text").remove();
	}
})();
