import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, getSearchParameters } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
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

	if (findElement(".tt-win-percentage", true)) return;

	const REGEX = /(Races won:) (\d)*|(Races entered:) (\d)*/;

	findAllElements(".enlist-info").forEach((stat) => {
		const values = findAllElements(".enlisted-stat > li", stat)
			.map((item) => item.textContent.replaceAll(/[^\w :]/g, "").trim())
			.filter((text) => REGEX.test(text))
			.map((text) => convertToNumber(text));

		let text: string;
		if (values[0] === 0) text = "• Win Percentage: 0%";
		else text = `• Win Percentage: ${((values[0] / values[1]) * 100).toFixed(2)}%`;

		findElement(".enlisted-stat", stat).insertAdjacentElement("beforeend", elementBuilder({ type: "li", class: "tt-win-percentage", text: text }));
	});
}

export default class CarWinPercentageFeature extends Feature {
	constructor() {
		super("Car Win Percentage", "racing");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.racing.winPercentage;
	}

	override initialise() {
		initialiseListener();
	}

	override async execute() {
		if (["cars", "parts"].includes(getSearchParameters().get("tab"))) await addPercentage();
	}

	override storageKeys() {
		return ["settings.pages.racing.winPercentage"];
	}
}
