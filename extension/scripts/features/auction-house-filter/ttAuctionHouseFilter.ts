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

			return true;
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

	let localFilters: any = {};

	async function addFilters(itemType: string) {
		if (itemType !== "weapons" && itemType !== "items" && itemType !== "armor") {
			throw new Error(`Unsupported item type detected: ${itemType}`);
		}

		await requireElement(".tabContent[aria-hidden='false'] .items-list");

		const { content } = createContainer("Auction House Filter", {
			class: "mt10",
			nextElement: document.querySelector("#auction-house-tabs"),
			filter: true,
		});

		// Reset local filters as there are multiple filter types.
		localFilters = { itemType };

		const statistics = createStatistics("items");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		const filterContent = elementBuilder({
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
				default: filters.auction[itemType].category,
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
				default: filters.auction[itemType].weaponType,
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

			const bonusFilter = createWeaponBonusSection({
				callback: applyFilters,
				defaults: filters.auction[itemType].weaponBonus,
			});
			filterContent.appendChild(bonusFilter.element);
			localFilters.weaponBonus = { getValues: bonusFilter.getValues };

			const qualityFilter = createFilterSection({
				title: "Quality",
				select: [
					{ value: "all", description: "All" },
					{ value: "yellow", description: "Yellow" },
					{ value: "orange", description: "Orange" },
					{ value: "red", description: "Red" },
				],
				callback: applyFilters,
				default: filters.auction[itemType].quality,
			});
			filterContent.appendChild(qualityFilter.element);
			localFilters.quality = { getSelected: qualityFilter.getSelected };
		}

		if (itemType === "armor") {
			const defenceFilter = createFilterSection({
				title: "Defence",
				text: "number",
				style: { width: "50px" },
				default: filters.auction[itemType].defence,
				callback: applyFilters,
			});
			filterContent.appendChild(defenceFilter.element);
			localFilters.defence = { getValue: defenceFilter.getValue };

			const setFilter = createFilterSection({
				title: "Set",
				select: [
					{ value: "", description: "All" },
					...ARMOR_SETS.map((type) => ({
						value: type.toLowerCase(),
						description: type,
					})),
				],
				default: filters.auction[itemType].set,
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
	}

	async function applyFilters() {
		await requireElement(".tabContent[aria-hidden='false'] .items-list > li[id]");

		// Get the set filters
		const content = findContainer("Auction House Filter", { selector: "main" });
		const itemType = localFilters.itemType;

		const name = localFilters.name.getValue();
		const filters: Partial<AuctionHouseFilters> = { name };

		if (itemType === "items" || itemType === "weapons") {
			filters.category = localFilters.category.getSelected(content);
		}

		if (itemType === "weapons") {
			filters.weaponType = localFilters.weaponType.getSelected(content);
			filters.damage = localFilters.damage.getValue();
			filters.accuracy = localFilters.accuracy.getValue();
			filters.weaponBonus = localFilters.weaponBonus.getValues();
			filters.quality = localFilters.quality.getSelected(content);
		}

		if (itemType === "armor") {
			filters.defence = localFilters.defence.getValue();
			filters.set = localFilters.set.getSelected(content);
			filters.armorBonus = localFilters.armorBonus.getValue();
		}

		// Save filters
		await ttStorage.change({ filters: { auction: { [itemType]: filters } } });

		// Actual Filtering
		for (const row of findAllElements(".tabContent[aria-hidden='false'] .items-list > li[id]")) {
			filterRow(row, filters);
		}

		triggerCustomListener(EVENT_CHANNELS.FILTER_APPLIED, { filter: "Auction House Filter" });

		localFilters["Statistics"].updateStatistics(
			findAllElements(".tabContent[aria-hidden='false'] .items-list > li[id]:not(.tt-hidden)").length,
			findAllElements(".tabContent[aria-hidden='false'] .items-list > li[id]").length,
			content
		);
	}

	type AuctionHouseFilters = {
		name: string;
		category: string;
		weaponType: string;
		damage: string;
		accuracy: string;
		weaponBonus: WeaponBonusFilter[];
		quality: string;
		defence: string;
		set: string;
		armorBonus: string;
	};

	function filterRow(row: HTMLElement, filters: Partial<AuctionHouseFilters>) {
		const id = row.querySelector<HTMLImageElement>("img.torn-item").src.match(/items\/([0-9]+)\/large.png/i)[1];

		if (filters.name) {
			if (!row.querySelector(".item-name").textContent.toLowerCase().includes(filters.name.toLowerCase())) {
				hide("name");
				return;
			}
		}
		if (filters.category) {
			const details = id in torndata.itemsMap && torndata.itemsMap[id].details;
			const itemCategory = details && "category" in details ? details.category.toLowerCase() : torndata.itemsMap[id].type;

			if (itemCategory !== filters.category) {
				hide("category");
				return;
			}
		}
		if (filters.weaponType) {
			if (torndata.itemsMap[id].sub_type?.toLowerCase() !== filters.weaponType) {
				hide("weapon_type");
				return;
			}
		}
		if (filters.damage && !isNaN(parseFloat(filters.damage))) {
			const damage = parseFloat(filters.damage);

			const weaponDamageLabel = row.querySelector(".bonus-attachment-item-damage-bonus + .label-value");
			if (!weaponDamageLabel) {
				hide("damage");
				return;
			}

			if (parseFloat(weaponDamageLabel.textContent) < damage) {
				hide("damage");
				return;
			}
		}
		if (filters.accuracy && !isNaN(parseFloat(filters.accuracy))) {
			const accuracy = parseFloat(filters.accuracy);

			const weaponAccuracyLabel = row.querySelector(".bonus-attachment-item-accuracy-bonus + .label-value");
			if (!weaponAccuracyLabel) {
				hide("accuracy");
				return;
			}

			if (parseFloat(weaponAccuracyLabel.textContent) < accuracy) {
				hide("accuracy");
				return;
			}
		}
		if (filters.defence && !isNaN(parseFloat(filters.defence))) {
			const defence = parseFloat(filters.defence);

			const armorDefenceLabel = row.querySelector(".bonus-attachment-item-defence-bonus + .label-value");
			if (!armorDefenceLabel) {
				hide("defence");
				return;
			}

			if (parseFloat(armorDefenceLabel.textContent) < defence) {
				hide("defence");
				return;
			}
		}
		if (filters.set) {
			if (row.querySelector(".item-cont-wrap .item-name").textContent.split(" ")[0].toLowerCase() !== filters.set) {
				hide("set");
				return;
			}
		}
		if (filters.quality && filters.quality !== "all") {
			const weaponQualityMatch = row.querySelector(".item-plate").className.match(/yellow|orange|red/);
			const weaponQuality = weaponQualityMatch ? weaponQualityMatch[0] : "none";
			if (weaponQuality !== filters.quality) {
				hide("quality");
				return;
			}
		}
		if (filters.armorBonus && !isNaN(parseFloat(filters.armorBonus))) {
			const bonus = parseFloat(filters.armorBonus);

			if (convertToNumber(row.querySelector(".iconsbonuses .bonus-attachment-icons")?.getAttribute("title")) < bonus) {
				hide("bonus");
				return;
			}
		}
		const toFilterBonus = filters.weaponBonus?.filter(({ bonus }) => bonus);
		if (toFilterBonus && toFilterBonus.length) {
			const foundBonuses = findAllElements(".iconsbonuses .bonus-attachment-icons", row)
				.map((icon) => icon.getAttribute("title"))
				.map((title) => title.split("<br/>"))
				.filter((values) => values.length >= 2)
				.map(([bonus, description]) => ({
					bonus: bonus.substring(3, bonus.length - 4).toLowerCase(),
					value: convertToNumber(description),
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

		function hide(reason: string) {
			row.classList.add("tt-hidden");
			row.dataset.hideReason = reason;
		}
	}

	function removeFilters() {
		removeContainer("Auction House Filter");
		findAllElements(".items-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}

	function getCategories(itemType: string) {
		if (itemType === "weapons") {
			return ["Melee", "Secondary", "Primary", "Temporary"].sort().map((type) => ({ value: type.toLowerCase(), description: type }));
		} else if (itemType === "items") {
			return ITEM_TYPES.filter((type) => !["Melee", "Secondary", "Primary", "Defensive", "Unused", "Book", "Temporary"].includes(type))
				.sort()
				.map((type) => ({ value: type.toLowerCase(), description: type }));
		} else {
			return [];
		}
	}
})();
