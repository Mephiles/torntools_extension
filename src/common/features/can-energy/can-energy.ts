import "./can-energy.css";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { getPageStatus, isEventActive, TORN_EVENTS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseAddEGains() {
	const listener = () => {
		if (FEATURE_MANAGER.isEnabled(CanEnergyFeature)) addEnergyGains();
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
		if (eCanElement.querySelector(".tt-e-gains")) return;

		const item = ITEM_RESOLVER.getStaticItem(parseInt(eCanElement.dataset.item));
		if (!item) return;

		const baseEnergy = parseInt(
			item.effect
				.split(" ")
				.map((x) => parseInt(x))
				.filter((x) => !Number.isNaN(x))[0]
				.toString(),
		);
		let totalEnergy = Math.round(baseEnergy * totalPerkMultiplier);
		// Apply the doubling effect of the energy can event here. It only applies the doubling after the initial perk multiplier + rounding.
		if (isEventActive(TORN_EVENTS.CAFFEINE_CON, true)) {
			totalEnergy *= 2;
		}

		eCanElement
			.querySelector(".name-wrap")
			.insertAdjacentElement("beforeend", elementBuilder({ type: "span", class: "tt-e-gains", text: `${totalEnergy}E` }));
	});
}

function removeEnergyGains() {
	findAllElements(".tt-e-gains").forEach((x) => x.remove());
}

export default class CanEnergyFeature extends Feature {
	constructor() {
		super("Can Energy", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.canGains;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	initialise() {
		initialiseAddEGains();
	}

	execute() {
		addEnergyGains();
	}

	cleanup() {
		removeEnergyGains();
	}

	storageKeys() {
		return ["settings.pages.items.canGains"];
	}
}
