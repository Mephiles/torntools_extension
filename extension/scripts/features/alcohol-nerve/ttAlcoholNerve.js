"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Alcohol Nerve",
		"items",
		() => settings.pages.items.nerveGains,
		initialiseAddGains,
		addNerveGains,
		removeNerveGains,
		{
			storage: ["settings.pages.items.nerveGains"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function initialiseAddGains() {
		const listener = () => {
			if (feature.enabled()) addNerveGains();
		};
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(listener);
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(listener);
	}

	function addNerveGains() {
		const factionPerk = parseInt(userdata.faction_perks.filter((x) => /alcohol/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
		const companyPerk = parseInt(userdata.job_perks.filter((x) => /alcohol boost|consumable boost/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);

		document.findAll("[data-category='Alcohol']").forEach((alcoholicDrink) => {
			if (alcoholicDrink.find(".tt-alcohol-gains")) return;

			// noinspection JSCheckFunctionSignatures
			let totalNerve = parseInt(
				torndata.items[alcoholicDrink.dataset.item].effect
					.split(" ")
					.map((x) => parseInt(x))
					.filter((x) => !isNaN(x))[0]
			);
			if (!isNaN(factionPerk)) totalNerve *= 1 + factionPerk / 100;
			if (!isNaN(companyPerk)) totalNerve *= 1 + companyPerk / 100;
			const maxNerve = Math.ceil(totalNerve);
			const minNerve = Math.floor(totalNerve);
			const nerveRange = maxNerve === minNerve ? maxNerve : `${minNerve} - ${maxNerve}`;
			alcoholicDrink
				.find(".name-wrap")
				.insertAdjacentElement("beforeend", document.newElement({ type: "span", class: "tt-alcohol-gains", text: `${nerveRange} N` }));
		});
	}

	function removeNerveGains() {
		document.findAll(".tt-alcohol-gains").forEach((x) => x.remove());
	}
})();
