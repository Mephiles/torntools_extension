"use strict";

(async () => {
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Armory Filter",
		"faction",
		() => settings.pages.faction.armoryFilter,
		addListener,
		addFilter,
		removeFilter,
		{
			storage: ["settings.pages.faction.armoryFilter"],
		},
		null,
		{ liveReload: true }
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_ARMORY_TAB].push(({ section }) => {
			if (!feature.enabled()) return;

			if (["weapons", "armour"].includes(section)) addFilter(section);
			else hideFilter();
		});
	}

	let cbHideUnavailable;

	async function addFilter(section) {
		if (!section) return;

		const presentFilter = findContainer("Armory Filter");
		if (presentFilter) {
			presentFilter.classList.remove("tt-hidden");

			await applyFilters();
			return;
		}

		const { options } = createContainer("Armory Filter", {
			class: "mt10",
			nextElement: document.find("#faction-armoury hr"),
			onlyHeader: true,
		});

		cbHideUnavailable = createCheckbox({ description: "Hide Unavailable" });
		options.appendChild(cbHideUnavailable.element);
		cbHideUnavailable.setChecked(filters.factionArmory.hideUnavailable);
		cbHideUnavailable.onChange(applyFilters);
		await applyFilters();

		async function applyFilters() {
			await requireElement(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.last");
			// Get the set filters
			const hideUnavailable = cbHideUnavailable.isChecked();

			// Save the filters
			await ttStorage.change({ filters: { factionArmory: { hideUnavailable } } });

			document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").forEach((li) => {
				if (hideUnavailable && li.find(":scope > .loaned a")) {
					hideRow(li);
				} else {
					showRow(li);
				}
			});

			function hideRow(li) {
				li.classList.add("tt-hidden");
			}

			function showRow(li) {
				li.classList.remove("tt-hidden");
			}
		}
	}

	function hideFilter() {
		const presentFilter = findContainer("Armory Filter");
		if (presentFilter) presentFilter.classList.add("tt-hidden");
	}

	function removeFilter() {
		cbHideUnavailable = undefined;
		removeContainer("Armory Filter");
		document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();
