"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Auction House Filter",
		"auction",
		() => settings.pages.auction.filter,
		initialiseFilters,
		enableFilter,
		removeFilters,
		{
			storage: ["settings.pages.auction.filter"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.AUCTION_SWITCH_TYPE].push(({ type }) => {
			if (!feature.enabled()) return;

			addFilters(type);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.SWITCH_PAGE].push(() => {
			if (!feature.enabled()) return;

			applyFilters();
		});
	}

	async function enableFilter() {
		const tab = await requireElement(".tabContent[aria-hidden='false']");

		await addFilters(tab.dataset.itemtype);
	}

	let localFilters = {};

	async function addFilters(itemType) {
		if (!["items", "weapons", "armor"].includes(itemType)) {
			throw new Error(`Unsupported item type detected: ${itemType}`);
		}

		await requireElement(".tabContent[aria-hidden='false'] .items-list");

		const { content } = createContainer("Auction House Filter", {
			class: "mt10",
			nextElement: document.find("#auction-house-tabs"),
			filter: true,
		});

		// Reset local filters as there are multiple filter types.
		localFilters = { itemType };

		const statistics = createStatistics("items");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		const nameFilter = createFilterSection({
			title: "Name",
			text: true,
			default: filters.auction[itemType].name,
			callback: applyFilters,
		});
		filterContent.appendChild(nameFilter.element);
		localFilters.name = { getValue: nameFilter.getValue };

		if (itemType === "items" || itemType === "weapons") {
			const categoryFilter = createFilterSection({
				title: "Category",
				select: [{ value: "", description: "All" }, ...getCategories(itemType)],
				defaults: filters.auction[itemType].category,
				callback: applyFilters,
			});
			filterContent.appendChild(categoryFilter.element);
			localFilters.category = { getSelected: categoryFilter.getSelected };
		}

		if (itemType === "weapons") {
			const weaponTypeFilter = createFilterSection({
				title: "Weapon Type",
				select: [
					{ value: "", description: "All" },
					...["Clubbing", "Piercing", "Slashing", "Mechanical", "Pistol", "Shotgun", "SMG", "Rifle", "Machine gun", "Heavy artillery"].map(
						(type) => ({ value: type.toLowerCase(), description: type })
					),
				],
				defaults: filters.auction[itemType].weaponType,
				callback: applyFilters,
			});
			filterContent.appendChild(weaponTypeFilter.element);
			localFilters.weaponType = { getSelected: weaponTypeFilter.getSelected };

			const damageFilter = createFilterSection({
				title: "Damage",
				text: "number",
				style: { width: "50px" },
				default: filters.auction[itemType].damage,
				callback: applyFilters,
			});
			filterContent.appendChild(damageFilter.element);
			localFilters.damage = { getValue: damageFilter.getValue };

			const accuracyFilter = createFilterSection({
				title: "Accuracy",
				text: "number",
				style: { width: "55px" },
				default: filters.auction[itemType].accuracy,
				callback: applyFilters,
			});
			filterContent.appendChild(accuracyFilter.element);
			localFilters.accuracy = { getValue: accuracyFilter.getValue };

			const bonusFilter = createWeaponBonusFilter({
				callback: applyFilters,
				defaults: filters.auction[itemType].weaponBonus,
			});
			filterContent.appendChild(bonusFilter.element);
			localFilters.weaponBonus = { getValues: bonusFilter.getValues };
		}

		if (itemType === "armor") {
			const defenceFilter = createFilterSection({
				title: "Defence",
				text: "number",
				style: { width: "50px" },
				default: filters.auction[itemType].damage,
				callback: applyFilters,
			});
			filterContent.appendChild(defenceFilter.element);
			localFilters.defence = { getValue: defenceFilter.getValue };

			const setFilter = createFilterSection({
				title: "Set",
				select: [
					{ value: "", description: "All" },
					...["Assault", "Riot", "Dune", "Delta", "Marauder", "EOD"].map((type) => ({ value: type.toLowerCase(), description: type })),
				],
				defaults: filters.auction[itemType].set,
				callback: applyFilters,
			});
			filterContent.appendChild(setFilter.element);
			localFilters.set = { getSelected: setFilter.getSelected };

			const bonusFilter = createFilterSection({
				title: "Bonus %",
				text: "number",
				style: { width: "55px" },
				default: filters.auction[itemType].armorBonus,
				callback: applyFilters,
			});
			filterContent.appendChild(bonusFilter.element);
			localFilters.armorBonus = { getValue: bonusFilter.getValue };
		}

		content.appendChild(filterContent);

		await applyFilters();

		function createWeaponBonusFilter({ callback, defaults }) {
			const selectOptions = [{ value: "", description: "None" }, ...WEAPON_BONUSES.map((bonus) => ({ value: bonus.toLowerCase(), description: bonus }))];

			const select1 = createSelect(selectOptions);
			select1.onChange(callback);
			const value1 = createTextbox({ type: "number", style: { width: "40px" } });
			value1.onChange(callback);

			const select2 = createSelect(selectOptions);
			select2.onChange(callback);
			const value2 = createTextbox({ type: "number", style: { width: "40px" } });
			value2.onChange(callback);

			if (defaults.length >= 1) {
				select1.setSelected(defaults[0].bonus);
				value1.setValue(defaults[0].value ?? "");
			}
			if (defaults.length >= 2) {
				select2.setSelected(defaults[1].bonus);
				value2.setValue(defaults[1].value ?? "");
			}

			const bonusFilter = createFilterSection({ title: "Bonus" });
			bonusFilter.element.appendChild(select1.element);
			bonusFilter.element.appendChild(value1.element);
			bonusFilter.element.appendChild(select2.element);
			bonusFilter.element.appendChild(value2.element);

			return {
				element: bonusFilter.element,
				getValues: () =>
					[
						[select1, value1],
						[select2, value2],
					].map(([s, v]) => ({ bonus: s.getSelected(), value: isNaN(v.getValue()) ? "" : parseInt(v.getValue()) })),
			};
		}
	}

	async function applyFilters() {
		await requireElement(".tabContent[aria-hidden='false'] .items-list > li[id]");

		// Get the set filters
		const content = findContainer("Auction House Filter", { selector: "main" });
		const itemType = localFilters.itemType;

		const name = localFilters.name.getValue();
		const filters = { name };

		if (itemType === "items" || itemType === "weapons") {
			filters.category = localFilters.category.getSelected(content);
		}

		if (itemType === "weapons") {
			filters.weaponType = localFilters.weaponType.getSelected(content);
			filters.damage = localFilters.damage.getValue();
			filters.accuracy = localFilters.accuracy.getValue();
			filters.weaponBonus = localFilters.weaponBonus.getValues();
		}

		if (itemType === "armor") {
			filters.defence = localFilters.defence.getValue();
			filters.set = localFilters.set.getSelected(content);
			filters.armorBonus = localFilters.armorBonus.getValue();
		}

		// Save filters
		await ttStorage.change({ filters: { auction: { [itemType]: filters } } });

		// Actual Filtering
		for (const row of document.findAll(".tabContent[aria-hidden='false'] .items-list > li[id]")) {
			filterRow(row, filters);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED);

		localFilters["Statistics"].updateStatistics(
			document.findAll(".tabContent[aria-hidden='false'] .items-list > li[id]:not(.tt-hidden)").length,
			document.findAll(".tabContent[aria-hidden='false'] .items-list > li[id]").length,
			content
		);
	}

	function filterRow(row, filters) {
		const id = row.find("img.torn-item").src.match(/items\/([0-9]+)\/large.png/i)[1];

		if (filters.name) {
			if (!row.find(".item-name").textContent.toLowerCase().includes(filters.name.toLowerCase())) {
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
		if (filters.rarity) {
			if (
				row
					.find(".item-cont-wrap .title p")
					.textContent.match(/\((.+) [0-9]+\)/)[1]
					.toLowerCase() !== filters.rarity
			) {
				hide("rarity");
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

			if (parseFloat(row.find(".bonus-attachment-item-damage-bonus + .label-value").textContent) < damage) {
				hide("damage");
				return;
			}
		}
		if (filters.accuracy && !isNaN(filters.accuracy)) {
			const accuracy = parseFloat(filters.accuracy);

			if (parseFloat(row.find(".bonus-attachment-item-accuracy-bonus + .label-value").textContent) < accuracy) {
				hide("accuracy");
				return;
			}
		}
		if (filters.defence && !isNaN(filters.defence)) {
			const defence = parseFloat(filters.defence);

			if (parseFloat(row.find(".bonus-attachment-item-defence-bonus + .label-value").textContent) < defence) {
				hide("defence");
				return;
			}
		}
		if (filters.set) {
			if (row.find(".item-cont-wrap .item-name").textContent.split(" ")[0].toLowerCase() !== filters.set) {
				hide("set");
				return;
			}
		}
		if (filters.armorBonus && !isNaN(filters.armorBonus)) {
			const bonus = parseFloat(filters.armorBonus);

			if (row.find(".iconsbonuses .bonus-attachment-icons").getAttribute("title").getNumber() < bonus) {
				hide("bonus");
				return;
			}
		}
		const toFilterBonus = filters.weaponBonus?.filter(({ bonus }) => bonus);
		if (toFilterBonus && toFilterBonus.length) {
			const foundBonuses = [...row.findAll(".iconsbonuses .bonus-attachment-icons")]
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

	function removeFilters() {
		removeContainer("Auction House Filter");
		document.findAll(".items-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}

	function getCategories(itemType) {
		if (itemType === "weapons") {
			return ["Melee", "Secondary", "Primary"].sort().map((type) => ({ value: type.toLowerCase(), description: type }));
		} else if (itemType === "items") {
			return ITEM_TYPES.filter((type) => !["Melee", "Secondary", "Primary", "Defensive", "Unused", "Book"].includes(type))
				.sort()
				.map((type) => ({ value: type.toLowerCase(), description: type }));
		} else {
			return [];
		}
	}
})();
