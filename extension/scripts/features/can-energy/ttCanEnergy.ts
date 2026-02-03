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

			return true;
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
		const totalPerkMultiplier = [...userdata.faction_perks, ...userdata.job_perks, ...userdata.book_perks]
			.filter((x) => /energy drinks/i.test(x) || /consumable gain/i.test(x))
			.map((x) => x.replace(/\D+/g, ""))
			.map((x) => 1 + parseInt(x) / 100)
			.reduce((totalMultiplier, perkMultiplier) => totalMultiplier * perkMultiplier, 1);

		findAllElements("[data-category='Energy Drink']").forEach((eCanElement) => {
			if (eCanElement.find(".tt-e-gains")) return;

			const baseEnergy = parseInt(
				torndata.items[eCanElement.dataset.item].effect
					.split(" ")
					.map((x) => parseInt(x))
					.filter((x) => !isNaN(x))[0]
					.toString()
			);
			let totalEnergy = Math.round(baseEnergy * totalPerkMultiplier);
			// Apply the doubling effect of the energy can event here. It only applies the doubling after the initial perk multiplier + rounding.
			if (isEventActive(TORN_EVENTS.CAFFEINE_CON, true)) {
				totalEnergy *= 2;
			}

			eCanElement.find(".name-wrap").insertAdjacentElement("beforeend", elementBuilder({ type: "span", class: "tt-e-gains", text: `${totalEnergy}E` }));
		});
	}

	function removeEnergyGains() {
		findAllElements(".tt-e-gains").forEach((x) => x.remove());
	}
})();
