import "./candy-happy.css";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { getPageStatus, isEventActive, TORN_EVENTS } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseAddGains() {
	const listener = () => {
		if (!FEATURE_MANAGER.isEnabled(CandyHappyFeature)) return;

		addGains();
	};
	addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, listener);
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, listener);
}

function addGains() {
	const factionPerk = parseInt(userdata.faction_perks.filter((x) => /candy/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
	const companyPerk = parseInt(userdata.job_perks.filter((x) => /consumable boost/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
	findAllElements("[data-category='Candy']").forEach((candy) => {
		if (candy.querySelector(".tt-candy-gains")) return;

		const item = ITEM_RESOLVER.getStaticItem(parseInt(candy.dataset.item));
		if (!item) return;

		// noinspection DuplicatedCode
		const baseHappy = parseInt(
			item.effect
				.split(" ")
				.map((x) => parseInt(x))
				.filter((x) => !Number.isNaN(x))[0]
				.toString(),
		);
		let totalHappy = baseHappy;
		if (!Number.isNaN(factionPerk)) totalHappy += (factionPerk / 100) * baseHappy;
		if (!Number.isNaN(companyPerk)) totalHappy += (companyPerk / 100) * baseHappy;

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
