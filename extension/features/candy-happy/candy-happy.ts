import "./candy-happy.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus, isEventActive, TORN_EVENTS } from "@/utils/common/functions/torn";
import { settings, torndata, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";

function initialiseAddGains() {
	const listener = () => {
		if (!FEATURE_MANAGER.isEnabled(CandyHappyFeature)) return;

		addGains();
	};
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(listener);
	CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(listener);
}

function addGains() {
	const factionPerk = parseInt(userdata.faction_perks.filter((x) => /candy/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
	const companyPerk = parseInt(userdata.job_perks.filter((x) => /consumable boost/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
	findAllElements("[data-category='Candy']").forEach((candy) => {
		if (candy.querySelector(".tt-candy-gains")) return;

		// noinspection DuplicatedCode
		const baseHappy = parseInt(
			torndata.itemsMap[candy.dataset.item].effect
				.split(" ")
				.map((x) => parseInt(x))
				.filter((x) => !isNaN(x))[0]
				.toString()
		);
		let totalHappy = baseHappy;
		if (!isNaN(factionPerk)) totalHappy += (factionPerk / 100) * baseHappy;
		if (!isNaN(companyPerk)) totalHappy += (companyPerk / 100) * baseHappy;

		if (isEventActive(TORN_EVENTS.WORLD_DIABETES_DAY, true)) {
			totalHappy *= 2;
		}

		candy.querySelector(".name-wrap").insertAdjacentElement("beforeend", elementBuilder({ type: "span", class: "tt-candy-gains", text: `${totalHappy}H` }));
	});
}

function removeGains() {
	findAllElements(".tt-candy-gains").forEach((x) => x.remove());
}

export default class CandyHappyFeature extends Feature {
	constructor() {
		super("Candy Happy", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.candyHappyGains;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	initialise() {
		initialiseAddGains();
	}

	execute() {
		addGains();
	}

	cleanup() {
		removeGains();
	}

	storageKeys() {
		return ["settings.pages.items.candyHappyGains"];
	}
}
