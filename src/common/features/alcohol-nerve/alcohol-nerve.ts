import "./alcohol-nerve.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings, torndata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { getPageStatus, isEventActive, TORN_EVENTS } from "@common/utils/functions/torn";
import { loadItem } from "@common/utils/torn-api/items";
import { Feature } from "@features/feature";

function initialiseAddGains() {
	const listener = () => {
		if (!FEATURE_MANAGER.isEnabled(AlcoholNerveFeature)) return;

		addNerveGains();
	};
	addCustomListener(EVENT_CHANNELS.ITEM_ITEMS_LOADED, listener);
	addCustomListener(EVENT_CHANNELS.ITEM_SWITCH_TAB, listener);
}

function addNerveGains() {
	const factionPerk = parseInt(userdata.faction_perks.filter((x) => /alcohol/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);
	const companyPerk = parseInt(userdata.job_perks.filter((x) => /alcohol boost|consumable boost/i.test(x)).map((x) => x.replace(/\D+/g, ""))[0]);

	findAllElements("[data-category='Alcohol']").forEach((alcoholicDrink) => {
		if (alcoholicDrink.querySelector(".tt-alcohol-gains")) return;

		const id = parseInt(alcoholicDrink.dataset.item);
		const item = loadItem(id);
		if (!item) return;

		let totalNerve = parseInt(
			item.effect
				.split(" ")
				.map((x) => parseInt(x))
				.filter((x) => !Number.isNaN(x))[0]
				.toString(),
		);
		if (!Number.isNaN(factionPerk)) totalNerve *= 1 + factionPerk / 100;
		if (!Number.isNaN(companyPerk)) totalNerve *= 1 + companyPerk / 100;

		if (isEventActive(TORN_EVENTS.ST_PATRICKS_DAY, true)) {
			totalNerve *= 2;
		}
		if (isEventActive(TORN_EVENTS.INTERNATIONAL_BEER_DAY, true) && [180, 816].includes(id)) {
			totalNerve *= 5;
		}

		const maxNerve = Math.ceil(totalNerve);
		const minNerve = Math.floor(totalNerve);

		const nerveRange = maxNerve === minNerve ? maxNerve : `${minNerve} - ${maxNerve}`;
		alcoholicDrink
			.querySelector(".name-wrap")
			.insertAdjacentElement("beforeend", elementBuilder({ type: "span", class: "tt-alcohol-gains", text: `${nerveRange} N` }));
	});
}

function removeNerveGains() {
	findAllElements(".tt-alcohol-gains").forEach((x) => x.remove());
}

export default class AlcoholNerveFeature extends Feature {
	constructor() {
		super("Alcohol Nerve", "items");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.items.nerveGains;
	}

	initialise() {
		initialiseAddGains();
	}

	async execute() {
		addNerveGains();
	}

	cleanup() {
		removeNerveGains();
	}

	storageKeys() {
		return ["settings.pages.items.nerveGains"];
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}
}
