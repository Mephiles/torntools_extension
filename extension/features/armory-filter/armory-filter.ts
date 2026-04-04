import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { filters, settings, torndata } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { createContainer, findContainer, removeContainer } from "@/utils/common/functions/containers";
import { createFilterSection, createStatistics, createWeaponBonusSection } from "@/utils/common/functions/filters";
import { CheckboxObject, createCheckbox } from "@/utils/common/elements/checkbox/checkbox";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { ttStorage } from "@/utils/common/data/storage";
import { requireElement } from "@/utils/common/functions/requires";
import { ARMOR_SETS } from "@/utils/common/functions/torn";
import { WeaponBonusFilter } from "@/utils/common/data/default-database";
import { isInternalFaction } from "@/pages/factions-page";

type ArmoryFilters = {
	hideUnavailable: boolean;
	name: string;
	category: string;
	weaponType: string;
	damage: string;
	accuracy: string;
	weaponBonus: WeaponBonusFilter[];
	defence: string;
	set: string;
	armorBonus: string;
};

let cbHideUnavailable: CheckboxObject | undefined;
let localFilters: any = {};

function addListener() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_ARMORY_TAB].push(async ({ section }) => {
		if (!FEATURE_MANAGER.isEnabled(ArmoryFilterFeature)) return;

		if (["weapons", "armour", "temporary"].includes(section)) await addFilter(section);
		else hideFilter();
	});
}

async function addFilter(section: string | null) {
	if (section === "armour") section = "armor";
	if (section !== "weapons" && section !== "armor" && section !== "temporary") return;

	const { options, content } = createContainer("Armory Filter", {
		class: "mt10",
		nextElement: document.querySelector("#faction-armoury > hr"),
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

	const filterContent = elementBuilder({ type: "div", class: "content" });

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
			default: filters.factionArmory[itemType].category,
			callback: applyFilters,
		});
		filterContent.appendChild(categoryFilter.element);
		localFilters.category = { getSelected: categoryFilter.getSelected };

		const weaponTypeFilter = createFilterSection({
			title: "Weapon Type",
			select: [
				{ value: "", description: "All" },
				...["Clubbing", "Piercing", "Slashing", "Mechanical", "Pistol", "Shotgun", "SMG", "Rifle", "Machine gun", "Heavy artillery"].map((type) => ({
					value: type.toLowerCase(),
					description: type,
				})),
			],
			default: filters.factionArmory[itemType].weaponType,
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

		const bonusFilter = createWeaponBonusSection({
			callback: applyFilters,
			defaults: filters.factionArmory[itemType].weaponBonus,
			configuration: {
				anyWeaponBonus: true,
			},
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
				...ARMOR_SETS.map((type) => ({ value: type.toLowerCase(), description: type })),
			],
			default: filters.factionArmory[itemType].set,
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
}

async function applyFilters() {
	await requireElement(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.last");

	// Get the set filters
	const content = findContainer("Armory Filter", { selector: "main" });
	const itemType = localFilters.itemType;

	const hideUnavailable = cbHideUnavailable.isChecked();
	const name = localFilters.name.getValue();
	const filters: Partial<ArmoryFilters> = { name };

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

	findAllElements(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").forEach((li) => filterRow(li, { hideUnavailable, ...filters }));

	localFilters["Statistics"].updateStatistics(
		findAllElements(".torn-tabs ~ [aria-hidden*='false'] .item-list > li:not(.tt-hidden)").length,
		findAllElements(".torn-tabs ~ [aria-hidden*='false'] .item-list > li").length,
		content
	);
}

function filterRow(row: HTMLElement, filters: Partial<ArmoryFilters>) {
	const id = row.querySelector<HTMLElement>(".img-wrap").dataset.itemid;

	if (filters.hideUnavailable) {
		if (row.querySelector(":scope > .loaned a")) {
			hide("unavailable");
			return;
		}
	}
	if (filters.name) {
		if (!row.querySelector(".name").textContent.toLowerCase().includes(filters.name.toLowerCase())) {
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
		if (torndata.itemsMap[id].sub_type.toLowerCase() !== filters.weaponType) {
			hide("weapon_type");
			return;
		}
	}
	if (filters.damage && !isNaN(parseFloat(filters.damage))) {
		const damage = parseFloat(filters.damage);

		if (parseFloat(row.querySelector(".bonus-attachment-item-damage-bonus + span").textContent) < damage) {
			hide("damage");
			return;
		}
	}
	if (filters.accuracy && !isNaN(parseFloat(filters.accuracy))) {
		const accuracy = parseFloat(filters.accuracy);

		if (parseFloat(row.querySelector(".bonus-attachment-item-accuracy-bonus + span").textContent) < accuracy) {
			hide("accuracy");
			return;
		}
	}
	if (filters.defence && !isNaN(parseFloat(filters.defence))) {
		const defence = parseFloat(filters.defence);

		if (parseFloat(row.querySelector(".bonus-attachment-item-defence-bonus + span").textContent) < defence) {
			hide("defence");
			return;
		}
	}
	if (filters.set) {
		const set = row.querySelector(".name").textContent.split(" ")[0].toLowerCase();
		if (filters.set === "any") {
			if (!ARMOR_SETS.map((x) => x.toLowerCase()).includes(set)) {
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
	if (filters.armorBonus && !isNaN(parseFloat(filters.armorBonus))) {
		const bonus = parseFloat(filters.armorBonus);

		if (convertToNumber(row.querySelector(".bonus > i[class*='bonus-attachment-']")?.getAttribute("title")) < bonus) {
			hide("bonus");
			return;
		}
	}
	const toFilterBonus = filters.weaponBonus?.filter(({ bonus }) => bonus);
	if (toFilterBonus && toFilterBonus.length) {
		const foundBonuses = findAllElements(".bonuses .bonus > i:not(.bonus-attachment-blank-bonus-25)", row)
			.map((icon) => icon.getAttribute("title"))
			.map((title) => title.split("<br/>"))
			.filter((values) => values.length >= 2)
			.map(([bonus, description]) => ({
				bonus: bonus.substring(3, bonus.length - 4).toLowerCase(),
				value: convertToNumber(description),
			}));

		let hasBonuses: boolean;
		if (toFilterBonus.some(({ bonus }) => bonus === "any")) {
			hasBonuses = !!foundBonuses.length;
		} else {
			hasBonuses = toFilterBonus.every(
				({ bonus, value }) => foundBonuses.filter((found) => found.bonus === bonus && (!value || found.value >= value)).length > 0
			);
		}

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

function hideFilter() {
	const presentFilter = findContainer("Armory Filter");
	if (presentFilter) presentFilter.classList.add("tt-hidden");
}

function removeFilter() {
	cbHideUnavailable = undefined;
	removeContainer("Armory Filter");
	findAllElements(".torn-tabs ~ [aria-hidden*='false'] .item-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
}

export default class ArmoryFilterFeature extends Feature {
	constructor() {
		super("Armory Filter", "faction");
	}

	precondition() {
		return isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.armoryFilter;
	}

	initialise() {
		addListener();
	}

	cleanup() {
		removeFilter();
	}

	storageKeys() {
		return ["settings.pages.faction.armoryFilter"];
	}

	shouldLiveReload() {
		return true;
	}
}
