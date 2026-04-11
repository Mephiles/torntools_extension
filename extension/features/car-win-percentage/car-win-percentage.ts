import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

function initialiseListener() {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (
			FEATURE_MANAGER.isEnabled(CarWinPercentageFeature) &&
			(page === "loader" || page === "page") &&
			(xhr.responseURL.includes("tab=parts") || xhr.responseURL.includes("tab=cars") || xhr.responseURL.includes("race_carlist.js"))
		)
			await addPercentage();
	});
}

async function addPercentage() {
	await requireElement(".enlisted-stat");

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
		await addPercentage();
	}

	cleanup() {
		removePercentage();
	}

	storageKeys() {
		return ["settings.pages.racing.winPercentage"];
	}
}
