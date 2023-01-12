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
		{ liveReload: true },
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_ARMORY_TAB].push(({ section }) => {
			if (!feature.enabled()) return;

			if (["weapons", "armour"].includes(section)) addFilter(section);
			else hideFilter();
		});
	}

	let cbHideUnavailable;
	let localFilters = {};

	async function addFilter(section) {
		if (!section) return;

		const presentFilter = findContainer("Armory Filter");
		if (presentFilter) {
			presentFilter.classList.remove("tt-hidden");

			await applyFilters();
			return;
		}

		const { options, content } = createContainer("Armory Filter", {
			class: "mt10",
			nextElement: document.find("#faction-armoury hr"),
			filter: true,
		});

		cbHideUnavailable = createCheckbox({ description: "Hide Unavailable" });
		options.appendChild(cbHideUnavailable.element);
		cbHideUnavailable.setChecked(filters.factionArmory.hideUnavailable);
		cbHideUnavailable.onChange(applyFilters);

		const statistics = createStatistics("items");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const bonusFilter = createFilterSection({
			type: "Weapon Bonus",
			callback: applyFilters,
			defaults: filters.factionArmory.weaponBonus,
		});
		filterContent.appendChild(bonusFilter.element);
		localFilters.weaponBonus = { getValues: bonusFilter.getValues };

		content.appendChild(filterContent);

		await applyFilters();

		async function applyFilters() {
			await requireElement(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.last");

			// Get the set filters
			const hideUnavailable = cbHideUnavailable.isChecked();
			const weaponBonus = localFilters.weaponBonus.getValues();

			// Save the filters
			await ttStorage.change({ filters: { factionArmory: { hideUnavailable, weaponBonus } } });

			document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").forEach((li) => filterRow(li, { hideUnavailable, weaponBonus }));

			localFilters["Statistics"].updateStatistics(
				document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li:not(.tt-hidden)").length,
				document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").length,
				content,
			);
		}
	}

	function filterRow(row, filters) {
		if (filters.hideUnavailable) {
			if (row.find(":scope > .loaned a")) {
				hide("unavailable");
				return;
			}
		}
		const toFilterBonus = filters.weaponBonus?.filter(({ bonus }) => bonus);
		if (toFilterBonus && toFilterBonus.length) {
			const foundBonuses = [...row.findAll(".bonuses .bonus > i:not(.bonus-attachment-blank-bonus-25)")]
				.map((icon) => icon.getAttribute("title"))
				.map((title) => title.split("<br/>"))
				.map(([bonus, description]) => ({
					bonus: bonus.substring(3, bonus.length - 4).toLowerCase(),
					value: description.getNumber(),
				}));

			const hasBonuses = toFilterBonus.every(
				({ bonus, value }) => foundBonuses.filter((found) => found.bonus === bonus && (!value || found.value >= value)).length > 0,
			);

			if (!hasBonuses) {
				hide("weapon-bonus");
				return;
			}
		}

		show();

		function show() {
			row.classList.remove("tt-hidden");
			row.removeAttribute("data-hide-reason");
		}

		function hide(reason) {
			row.classList.add("tt-hidden");
			row.dataset.hideReason = reason;
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
