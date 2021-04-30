"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Alcoholic Nerve",
		"items",
		() => settings.pages.items.nerveGains,
		initialiseAddGains,
		addNerveGains,
		removeNerveGains,
		{
			storage: ["settings.pages.items.nerveGains"],
		},
		null,
	);

	function initialiseAddGains() {
		const listener = () => {
			if (feature.enabled()) addNerveGains();
		};
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(listener);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(listener);
	}

	function addNerveGains() {
		const facAlcoholGainPerk = parseInt(
			userdata.faction_perks
				.filter((x) => /alcohol/i.test(x))
				.map((x) => {
					x.replace(/\D+/g, "");
				})[0]
		);
		const jobAlcoholGainPerc = parseInt(
			userdata.company_perks
				.filter((x) => /boost/i.test(x))
				.map((x) => {
					x.replace(/\D+/g, "");
				})[0]
		);
		document.findAll("[data-category='Alcohol']").forEach((alcoholicDrink) => {
			if (!alcoholicDrink.find(".tt-alcohol-gains")) {
				const baseNerve = parseInt(
					torndata.items[alcoholicDrink.dataset.item].effect
						.split(" ")
						.map((x) => parseInt(x))
						.filter((x) => !isNaN(x))[0]
				);
				let totalNerve = baseNerve;
				if (!isNaN(facAlcoholGainPerk)) totalNerve += (facAlcoholGainPerk / 100) * baseNerve;
				if (!isNaN(jobAlcoholGainPerc)) totalNerve += (jobAlcoholGainPerc / 100) * baseNerve;
				const maxNerve = Math.ceil(totalNerve);
				const minNerve = Math.floor(totalNerve);
				const nerveRange = maxNerve === minNerve ? maxNerve : `${minNerve} - ${maxNerve}`;
				const rawHTML = `<span class="tt-alcohol-gains">${nerveRange} N</span>`;
				alcoholicDrink.find(".name-wrap .qty.bold.t-hide").insertAdjacentHTML("beforeend", rawHTML);
			}
		});
	}

	function removeNerveGains() {
		document.findAll(".tt-alcohol-gains").forEach((x) => x.remove());
	}
})();
