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

			return true;
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

		findAllElements("[data-category='Alcohol']").forEach((alcoholicDrink) => {
			if (alcoholicDrink.querySelector(".tt-alcohol-gains")) return;

			const id = parseInt(alcoholicDrink.dataset.item);
			let totalNerve = parseInt(
				torndata.items[alcoholicDrink.dataset.item].effect
					.split(" ")
					.map((x) => parseInt(x))
					.filter((x) => !isNaN(x))[0]
					.toString()
			);
			if (!isNaN(factionPerk)) totalNerve *= 1 + factionPerk / 100;
			if (!isNaN(companyPerk)) totalNerve *= 1 + companyPerk / 100;

			if (isEventActive(TORN_EVENTS.ST_PATRICKS_DAY, true)) {
				totalNerve *= 2;
			}
			if (isEventActive(TORN_EVENTS.INTERNATIONAL_BEER_DAY, true) && [180, 816].includes(id)) {
				totalNerve *= 5;
			}

			const maxNerve = Math.ceil(totalNerve);
			const minNerve = Math.floor(totalNerve);

			const nerveRange = maxNerve === minNerve ? maxNerve : `${minNerve} - ${maxNerve}`;
			alcoholicDrink
				.querySelector(".name-wrap")
				.insertAdjacentElement("beforeend", elementBuilder({ type: "span", class: "tt-alcohol-gains", text: `${nerveRange} N` }));
		});
	}

	function removeNerveGains() {
		findAllElements(".tt-alcohol-gains").forEach((x) => x.remove());
	}
})();
