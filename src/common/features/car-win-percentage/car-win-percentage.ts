import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements, getSearchParameters } from "@common/utils/functions/dom";
import { convertToNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function initialiseListener() {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (
			FEATURE_MANAGER.isEnabled(CarWinPercentageFeature) &&
			page === "page" &&
			(xhr.responseURL.includes("tab=parts") || xhr.responseURL.includes("tab=cars") || xhr.responseURL.includes("race_carlist.js"))
		)
			await addPercentage();
	});
}

async function addPercentage() {
	await requireElement(".enlisted-stat").catch(() => {});

	if (document.querySelector(".tt-win-percentage")) return;

	const REGEX = /(Races won:) (\d)*|(Races entered:) (\d)*/;

	findAllElements(".enlist-info").forEach((stat) => {
		const values = findAllElements(".enlisted-stat > li", stat)
			.map((item) => item.textContent.replace(/[^\w :]/g, "").trim())
			.filter((text) => REGEX.test(text))
			.map((text) => convertToNumber(text));

		let text: string;
		if (values[0] === 0) text = "• Win Percentage: 0%";
		else text = `• Win Percentage: ${((values[0] / values[1]) * 100).toFixed(2)}%`;

		stat.querySelector(".enlisted-stat").insertAdjacentElement("beforeend", elementBuilder({ type: "li", class: "tt-win-percentage", text: text }));
	});
}

function removePercentage() {
	findAllElements(".tt-win-percentage").forEach((x) => x.remove());
}

export default class CarWinPercentageFeature extends Feature {
	constructor() {
		super("Car Win Percentage", "racing");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.racing.winPercentage;
	}

	initialise() {
		initialiseListener();
	}

	async execute() {
		if (["cars", "parts"].includes(getSearchParameters().get("tab"))) await addPercentage();
	}

	cleanup() {
		removePercentage();
	}

	storageKeys() {
		return ["settings.pages.racing.winPercentage"];
	}
}
