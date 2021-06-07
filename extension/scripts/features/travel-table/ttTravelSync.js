"use strict";

(async () => {
	if (!isAbroad()) return;

	featureManager.registerFeature(
		"Travel Sync",
		"travel",
		() => settings.pages.travel.table,
		updatePrices,
		null,
		null,
		{
			storage: ["settings.pages.travel.table", "settings.external.yata"],
		},
		() => {
			if (!settings.external.yata) return "YATA not enabled";
		}
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
			const quantity = parseInt(item.find(".stck-amount").innerText.replaceAll(",", ""));
			const cost = parseInt(item.find(".cost .c-price").innerText.replace("$", "").replaceAll(",", ""));

			data.items.push({ id, quantity, cost });
		}

		fetchData("yata", { section: "travel/import/", method: "POST", body: data, relay: true })
			.then((response) => {
				console.log("TT - Updated YATA abroad prices.", response);
			})
			.catch((error) => {
				console.warn("TT - Failed to update YATA abroad prices.", error);
			});

		function getCountryName() {
			return document.find("#skip-to-content").innerText.slice(0, 3).toLowerCase();
		}
	}
})();
