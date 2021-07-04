"use strict";

(async () => {
	featureManager.registerFeature(
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
		await requireElement(".info-msg-cont .msg a[href]");
		const bazaarUserId = getSearchParameters().get("userId");

		if (ttCache.hasValue("bazaar", bazaarUserId)) {
			handleBazaar(ttCache.get("bazaar", bazaarUserId));
		} else {
			fetchData("torn", { section: "user", id: bazaarUserId, selections: ["bazaar"] })
				.then((result) => {
					handleBazaar(result.bazaar);

					ttCache.set({ [bazaarUserId]: result.bazaar }, TO_MILLIS.SECONDS * 30, "bazaar");
				})
				.catch((error) => {
					document.find(".info-msg-cont .msg").appendChild(
						document.newElement({
							type: "div",
							class: "tt-bazaar-text",
							text: "TORN API returned error:" + error.toString(),
						})
					);
					console.log("TT - Bazaar Worth API Error:", error);
				});
		}

		function handleBazaar(bazaar) {
			let total = 0;

			for (const item of bazaar) {
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
		}
	}

	function removeWorth() {
		document.find(".tt-bazaar-text").remove();
	}
})();
