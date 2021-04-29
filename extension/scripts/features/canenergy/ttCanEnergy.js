"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Can Energy",
		"items",
		() => settings.pages.items.canGains,
		initialiseAddEGains,
		addEnergyGains,
		removeEnergyGains,
		{
			storage: ["settings.pages.items.canGains"],
		},
		async () => {
			await requireElement("[data-category='Energy Drink']");
		}
	);

	function initialiseAddEGains() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(() => {
			if (feature.enabled()) addEnergyGains();
		});
	}

	function addEnergyGains() {
		const facECanPerc = parseInt(
			userdata.faction_perks
				.filter((x) => /energy drinks/i.test(x))
				.map((x) => {
					x.replace(/\D+/g, "");
				})[0]
		);
		const jobECanPerc = parseInt(
			userdata.company_perks
				.filter((x) => /boost/i.test(x))
				.map((x) => {
					x.replace(/\D+/g, "");
				})[0]
		);
		document.findAll("[data-category='Energy Drink']").forEach((eCanElement) => {
			if (!eCanElement.find(".tt-e-gains")) {
				const baseE = parseInt(
					torndata.items[eCanElement.dataset.item].effect
						.split(" ")
						.map((x) => parseInt(x))
						.filter((x) => !isNaN(x))[0]
				);
				let totalEnergy = baseE;
				if (!isNaN(facECanPerc)) totalEnergy += (facECanPerc / 100) * baseE;
				if (!isNaN(jobECanPerc)) totalEnergy += (jobECanPerc / 100) * baseE;
				const rawHTML = `<span class='tt-e-gains'>${totalEnergy}E</span>`;
				eCanElement.find(".name-wrap").insertAdjacentHTML("beforeend", rawHTML);
			}
		});
	}

	function removeEnergyGains() {
		document.findAll(".tt-e-gains").forEach((x) => x.remove());
	}
})();
