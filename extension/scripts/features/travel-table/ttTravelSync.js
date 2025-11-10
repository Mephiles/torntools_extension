"use strict";

(async () => {
	if (!isAbroad()) return;
	if (!getPageStatus().access) return;
	if (getSearchParameters().has("page")) return;

	const feature = featureManager.registerFeature(
		"Travel Sync",
		"travel",
		() => settings.pages.travel.table,
		initialise,
		updatePrices,
		null,
		{
			storage: ["settings.pages.travel.table", "settings.external.yata", "settings.external.prometheus"],
		},
		() => {
			if (!settings.external.yata && !settings.external.prometheus) return "YATA and Prometheus not enabled";
		}
	);

	function initialise() {
		addFetchListener(({ detail: { page, json, fetch } }) => {
			if (!feature.enabled()) return;
			if (page !== "page" || !json) return;

			const params = new URL(fetch.url).searchParams;
			const sid = params.get("sid");
			if (sid !== "travelData") return;

			const step = params.get("step");
			if (step !== "shop") return;

			const items = json.stock.map((s) => ({ id: s.ID, quantity: s.stock, cost: s.price }));
			const country = json.country;

			syncData(items, country);
		});
	}

	async function updatePrices() {
		if (document.getElementById("travel-root")) {
			// If the root is present, we'll be relying on the request interceptor.
			return;
		}

		const items = Array.from(document.findAll(".users-list > li")).map((item) => ({
			id: parseInt(item.find(".details").getAttribute("itemid")),
			quantity: parseInt(item.find(".stck-amount").textContent.replaceAll(",", "")),
			cost: parseInt(item.find(".cost .c-price").textContent.replace("$", "").replaceAll(",", "")),
		}));
		const country = document.find("#skip-to-content").textContent;

		syncData(items, country);
	}

	function syncData(items, country) {
		const data = {
			client: "TornTools",
			version: chrome.runtime.getManifest().version,
			author_name: "Mephiles",
			author_id: 2087524,
			country: country.trim().slice(0, 3).toLowerCase(),
			items,
		};

		if (settings.external.yata) {
			fetchData("yata", { section: "travel/import/", method: "POST", body: data, relay: true })
				.then((response) => console.log("TT - Updated YATA abroad prices.", response))
				.catch((error) => console.warn("TT - Failed to update YATA abroad prices.", error));
		}
		if (settings.external.prometheus) {
			fetchData("prometheus", { section: "travel", method: "POST", body: data, relay: true })
				.then((response) => console.log("TT - Updated Prometheus abroad prices.", response))
				.catch((error) => console.warn("TT - Failed to update Prometheus abroad prices.", error));
		}
	}
})();
