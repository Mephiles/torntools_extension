"use strict";

(async () => {
	await featureManagerLoaded();

	featureManager.registerFeature(
		"Bazaar Worth",
		"bazaar",
		() => settings.pages.bazaar.worth,
		addListener,
		addWorth,
		removeWorth,
		{
			storage: ["settings.pages.bazaar.worth"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		},
		{ liveReload: true }
	);

	function addListener() {
		addFetchListener(({ detail: { page, json, fetch } }) => {
			if (page === "bazaar" && json) {
				if (json.list) {
					if (json.list.length === 0) addWorth(true, []);
					else if (json.list.length === json.total) addWorth(true, json.list);
					else if (json.list.length < json.total) addWorth(true, false);
				} else if (new URLSearchParams(fetch.url).get("step") === "getBazaarItems") {
					addWorth(true, false);
				}
			}
		});
	}

	async function addWorth(liveReload, list) {
		if (!liveReload) return;

		const bazaarUserId = parseInt(getSearchParameters().get("userId"));

		if (!bazaarUserId || bazaarUserId === userdata.profile.id) await requireElement(".info-msg-cont:not(.red) .msg");
		else await requireElement(".info-msg-cont .msg a[href]");

		if (list && Array.isArray(list)) {
			handleBazaar(list).catch(console.error);
			return;
		}

		if (ttCache.hasValue("bazaar", bazaarUserId)) {
			handleBazaar(ttCache.get("bazaar", bazaarUserId)).catch(console.error);
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

		async function handleBazaar(bazaar) {
			let total = 0;

			for (const item of bazaar) {
				total += (item.market_price ?? item.averageprice) * (item.quantity ?? item.amount);
			}

			await requireElement("[class*='preloader___']", { invert: true });
			const text = document.find(".tt-bazaar-text span");
			if (text) text.textContent = formatNumber(total, { currency: true });
			else
				document.find(".info-msg-cont .msg")?.appendChild(
					document.newElement({
						type: "div",
						class: "tt-bazaar-text",
						text: "This bazaar is worth ",
						children: [document.newElement({ type: "span", text: formatNumber(total, { currency: true }) }), "."],
					})
				);
		}
	}

	function removeWorth() {
		document.find(".tt-bazaar-text")?.remove();
	}
})();
