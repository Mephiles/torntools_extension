"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Nerve Gains beside Alcoholic Drinks",
		"items",
		() => settings.pages.items.nerveGains,
		initialiseAddGains,
		addNerveGains,
		removeNerveGains,
		{
			storage: ["settings.pages.items.nerveGains"],
		},
		async () => {
			await requireElement("[data-category='Alcohol']");
		}
	);

	function initialiseAddGains() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(() => {
			if (feature.enabled()) addNerveGains();
		});
	}

	function addNerveGains() {
		const facAlcoholGainPerc = parseInt(
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
				if (!isNaN(facAlcoholGainPerc)) totalNerve += (facAlcoholGainPerc / 100) * baseNerve;
				if (!isNaN(jobAlcoholGainPerc)) totalNerve += (jobAlcoholGainPerc / 100) * baseNerve;
				const maxNerve = Math.ceil(totalNerve);
				const minNerve = Math.floor(totalNerve);
				const nerveRange = maxNerve === minNerve ? maxNerve : `${minNerve} - ${maxNerve}`;
				const rawHTML = `<span class="tt-alcohol-gains">${nerveRange} N</span>`;
				alcoholicDrink.find(".name-wrap .qty.bold.t-hide").insertAdjacentHTML("beforeEnd", rawHTML);
			}
		});
	}

	function removeNerveGains() {
		document.findAll(".tt-alcohol-gains").forEach((x) => x.remove());
	}
})();
