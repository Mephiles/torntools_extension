"use strict";

(async () => {
	if (!getPageStatus().access) return;

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
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function initialiseAddEGains() {
		const listener = () => {
			if (feature.enabled()) addEnergyGains();
		};
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(listener);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(listener);
	}

	function addEnergyGains() {
		const factionPerk = parseInt(userdata.faction_perks.filter((x) => /energy drinks/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
		const companyPerk = parseInt(userdata.job_perks.filter((x) => /consumable boost/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
		document.findAll("[data-category='Energy Drink']").forEach((eCanElement) => {
			if (eCanElement.find(".tt-e-gains")) return;

			// noinspection JSCheckFunctionSignatures,DuplicatedCode
			const baseEnergy = parseInt(
				torndata.items[eCanElement.dataset.item].effect
					.split(" ")
					.map((x) => parseInt(x))
					.filter((x) => !isNaN(x))[0]
			);
			let totalEnergy = baseEnergy;
			if (!isNaN(factionPerk)) totalEnergy += (factionPerk / 100) * baseEnergy;
			if (!isNaN(companyPerk)) totalEnergy += (companyPerk / 100) * baseEnergy;
			eCanElement
				.find(".name-wrap")
				.insertAdjacentElement("beforeend", document.newElement({ type: "span", class: "tt-e-gains", text: `${totalEnergy}E` }));
		});
	}

	function removeEnergyGains() {
		document.findAll(".tt-e-gains").forEach((x) => x.remove());
	}
})();
