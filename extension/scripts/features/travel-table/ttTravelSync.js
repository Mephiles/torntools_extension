"use strict";

(async () => {
	if (!isAbroad()) return;
	if (!getPageStatus().access) return;
	if (getSearchParameters().has("page")) return;

	featureManager.registerFeature(
		"Travel Sync",
		"travel",
		() => settings.pages.travel.table,
		updatePrices,
		null,
		null,
		{
			storage: ["settings.pages.travel.table", "settings.external.yata", "settings.external.prometheus"],
		},
		() => {
			if (!settings.external.yata && !settings.external.prometheus) return "YATA and Prometheus not enabled";
		},
	);

	function updatePrices() {
		if (document.find(".info-msg-cont.red")) return;

		const data = {
			client: "TornTools",
			version: chrome.runtime.getManifest().version,
			author_name: "Mephiles",
			author_id: 2087524,
			country: getCountryName(),
			items: [],
		};

		for (const item of document.findAll(".users-list > li")) {
			const id = parseInt(item.find(".details").getAttribute("itemid"));
			const quantity = parseInt(item.find(".stck-amount").textContent.replaceAll(",", ""));
			const cost = parseInt(item.find(".cost .c-price").textContent.replace("$", "").replaceAll(",", ""));

			data.items.push({ id, quantity, cost });
		}

		if (settings.external.yata) {
			fetchData("yata", { section: "travel/import/", method: "POST", body: data, relay: true })
				.then((response) => {
					console.log("TT - Updated YATA abroad prices.", response);
				})
				.catch((error) => {
					console.warn("TT - Failed to update YATA abroad prices.", error);
				});
		}
		if (settings.external.prometheus) {
			fetchData("prometheus", { section: "travel", method: "POST", body: data, relay: true })
				.then((response) => {
					console.log("TT - Updated Prometheus abroad prices.", response);
				})
				.catch((error) => {
					console.warn("TT - Failed to update Prometheus abroad prices.", error);
				});
		}

		function getCountryName() {
			return document.find("#skip-to-content").textContent.trim().slice(0, 3).toLowerCase();
		}
	}
})();
