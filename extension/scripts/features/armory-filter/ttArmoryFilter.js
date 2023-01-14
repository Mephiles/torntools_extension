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

			if (["weapons", "armour", "temporary"].includes(section)) addFilter(section);
			else hideFilter();
		});
	}

	let cbHideUnavailable;
	let localFilters = {};

	async function addFilter(section) {
		if (!["weapons", "armour", "temporary"].includes(section)) return;
		else if (section === "armour") section = "armor";

		const { options, content } = createContainer("Armory Filter", {
			class: "mt10",
			nextElement: document.find("#faction-armoury hr"),
			filter: true,
		});

		// Reset local filters as there are multiple filter types.
		const itemType = section;
		localFilters = { itemType };

		cbHideUnavailable = createCheckbox({ description: "Hide Unavailable" });
		options.appendChild(cbHideUnavailable.element);
		cbHideUnavailable.setChecked(filters.factionArmory.hideUnavailable);
		cbHideUnavailable.onChange(applyFilters);

		const statistics = createStatistics("items");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({ type: "div", class: "content" });

		const nameFilter = createFilterSection({
			title: "Name",
			text: true,
			default: filters.factionArmory[itemType].name,
			callback: applyFilters,
		});
		filterContent.appendChild(nameFilter.element);
		localFilters.name = { getValue: nameFilter.getValue };

		if (itemType === "weapons") {
			const categoryFilter = createFilterSection({
				title: "Category",
				select: [
					{ value: "", description: "All" },
					...["Melee", "Secondary", "Primary"].sort().map((type) => ({ value: type.toLowerCase(), description: type })),
				],
				defaults: filters.factionArmory[itemType].category,
				callback: applyFilters,
			});
			filterContent.appendChild(categoryFilter.element);
			localFilters.category = { getSelected: categoryFilter.getSelected };

			const weaponTypeFilter = createFilterSection({
				title: "Weapon Type",
				select: [
					{ value: "", description: "All" },
					...["Clubbing", "Piercing", "Slashing", "Mechanical", "Pistol", "Shotgun", "SMG", "Rifle", "Machine gun", "Heavy artillery"].map(
						(type) => ({ value: type.toLowerCase(), description: type })
					),
				],
				defaults: filters.factionArmory[itemType].weaponType,
				callback: applyFilters,
			});
			filterContent.appendChild(weaponTypeFilter.element);
			localFilters.weaponType = { getSelected: weaponTypeFilter.getSelected };

			const damageFilter = createFilterSection({
				title: "Damage",
				text: "number",
				style: { width: "50px" },
				default: filters.factionArmory[itemType].damage,
				callback: applyFilters,
			});
			filterContent.appendChild(damageFilter.element);
			localFilters.damage = { getValue: damageFilter.getValue };

			const accuracyFilter = createFilterSection({
				title: "Accuracy",
				text: "number",
				style: { width: "55px" },
				default: filters.factionArmory[itemType].accuracy,
				callback: applyFilters,
			});
			filterContent.appendChild(accuracyFilter.element);
			localFilters.accuracy = { getValue: accuracyFilter.getValue };

			const bonusFilter = createFilterSection({
				type: "Weapon Bonus",
				callback: applyFilters,
				defaults: filters.factionArmory[itemType].weaponBonus,
			});
			filterContent.appendChild(bonusFilter.element);
			localFilters.weaponBonus = { getValues: bonusFilter.getValues };
		} else if (itemType === "armor") {
			const defenceFilter = createFilterSection({
				title: "Defence",
				text: "number",
				style: { width: "50px" },
				default: filters.factionArmory[itemType].defence,
				callback: applyFilters,
			});
			filterContent.appendChild(defenceFilter.element);
			localFilters.defence = { getValue: defenceFilter.getValue };

			const setFilter = createFilterSection({
				title: "Set",
				select: [
					{ value: "", description: "All" },
					{ value: "any", description: "Any (ranked)" },
					...["Assault", "Riot", "Dune", "Delta", "Marauder", "EOD"].map((type) => ({ value: type.toLowerCase(), description: type })),
				],
				defaults: filters.factionArmory[itemType].set,
				callback: applyFilters,
			});
			filterContent.appendChild(setFilter.element);
			localFilters.set = { getSelected: setFilter.getSelected };

			const bonusFilter = createFilterSection({
				title: "Bonus %",
				text: "number",
				style: { width: "55px" },
				default: filters.factionArmory[itemType].armorBonus,
				callback: applyFilters,
			});
			filterContent.appendChild(bonusFilter.element);
			localFilters.armorBonus = { getValue: bonusFilter.getValue };
		}

		content.appendChild(filterContent);

		await applyFilters();

		async function applyFilters() {
			await requireElement(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.last");

			// Get the set filters
			const content = findContainer("Armory Filter", { selector: "main" });
			const itemType = localFilters.itemType;

			const hideUnavailable = cbHideUnavailable.isChecked();
			const name = localFilters.name.getValue();
			const filters = { name };

			if (itemType === "weapons") {
				filters.category = localFilters.category.getSelected(content);
				filters.weaponType = localFilters.weaponType.getSelected(content);
				filters.damage = localFilters.damage.getValue();
				filters.accuracy = localFilters.accuracy.getValue();
				filters.weaponBonus = localFilters.weaponBonus.getValues();
			} else if (itemType === "armor") {
				filters.defence = localFilters.defence.getValue();
				filters.set = localFilters.set.getSelected(content);
				filters.armorBonus = localFilters.armorBonus.getValue();
			}

			// Save the filters
			await ttStorage.change({ filters: { factionArmory: { hideUnavailable, [itemType]: filters } } });

			document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").forEach((li) => filterRow(li, { hideUnavailable, ...filters }));

			localFilters["Statistics"].updateStatistics(
				document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li:not(.tt-hidden)").length,
				document.findAll(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").length,
				content
			);
		}
	}

	function filterRow(row, filters) {
		const id = row.find(".img-wrap").dataset.itemid;

		if (filters.hideUnavailable) {
			if (row.find(":scope > .loaned a")) {
				hide("unavailable");
				return;
			}
		}
		if (filters.name) {
			if (!row.find(".name").textContent.toLowerCase().includes(filters.name.toLowerCase())) {
				hide("name");
				return;
			}
		}
		if (filters.category) {
			if (torndata.items[id].type.toLowerCase() !== filters.category) {
				hide("category");
				return;
			}
		}
		if (filters.weaponType) {
			if (torndata.items[id].weapon_type.toLowerCase() !== filters.weaponType) {
				hide("weapon_type");
				return;
			}
		}
		if (filters.damage && !isNaN(filters.damage)) {
			const damage = parseFloat(filters.damage);

			if (parseFloat(row.find(".bonus-attachment-item-damage-bonus + span").textContent) < damage) {
				hide("damage");
				return;
			}
		}
		if (filters.accuracy && !isNaN(filters.accuracy)) {
			const accuracy = parseFloat(filters.accuracy);

			if (parseFloat(row.find(".bonus-attachment-item-accuracy-bonus + span").textContent) < accuracy) {
				hide("accuracy");
				return;
			}
		}
		if (filters.defence && !isNaN(filters.defence)) {
			const defence = parseFloat(filters.defence);

			if (parseFloat(row.find(".bonus-attachment-item-defence-bonus + span").textContent) < defence) {
				hide("defence");
				return;
			}
		}
		if (filters.set) {
			const set = row.find(".name").textContent.split(" ")[0].toLowerCase();
			if (filters.set === "any") {
				if (!["assault", "riot", "dune", "delta", "marauder", "eod"].includes(set)) {
					hide("set");
					return;
				}
			} else {
				if (set !== filters.set) {
					hide("set");
					return;
				}
			}
		}
		if (filters.armorBonus && !isNaN(filters.armorBonus)) {
			const bonus = parseFloat(filters.armorBonus);

			if (row.find(".bonus-attachment-melee-protection").getAttribute("title").getNumber() < bonus) {
				hide("bonus");
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
				({ bonus, value }) => foundBonuses.filter((found) => found.bonus === bonus && (!value || found.value >= value)).length > 0
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
