import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { ttCache } from "@common/utils/data/cache.ts";
import { settings } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher.ts";
import { hasOC1Data } from "@common/utils/functions/api.ts";
import { elementBuilder } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements.ts";
import { capitalizeText, formatNumber } from "@common/utils/functions/formatting.ts";
import { requireElement } from "@common/utils/functions/requires.ts";
import { TO_MILLIS } from "@common/utils/functions/utilities.ts";
import { Feature } from "@features/feature";
import styles from "./oc-weights.module.css";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2, displayScenarioWeights);
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_TAB, displayScenarioWeights);
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES2_REFRESH, displayScenarioWeights);
}

async function displayScenarioWeights() {
	const [weights, list] = await Promise.all([fetchWeights(), requireElement(".tt-oc2-list:has([data-oc-id])")]);

	findAllElements(":scope > [data-oc-id]:not([data-tt-weights])", list).forEach((row) => {
		row.dataset.ttWeights = "true";

		const title = findElement("[class*='panelTitle____']", row).textContent;
		const data = weightsForScenario(weights, title) ?? {};

		findAllElements("[class*='contentLayer___'] > [class*='wrapper___'] > [class*='wrapper___']", row).forEach((slotElement) => {
			const positionTitle = findElement("[class*='title___']", slotElement).textContent;
			const weight = weightForPosition(data, positionTitle);

			const header = findElement("[class*='slotHeader___']", slotElement);
			const bodyElement = findElement("[class*='slotBody___']", slotElement);
			const headerClass = Array.from(bodyElement.classList).find((c) => c.startsWith("slotBody___"));

			header.insertAdjacentElement(
				"afterend",
				elementBuilder({
					type: "div",
					class: [styles.ocWeight, headerClass ?? ""],
					children: [
						elementBuilder({ type: "strong", text: "Weight:" }),
						weight !== null ? elementBuilder({ type: "span", text: `${formatNumber(weight)}%` }) : elementBuilder({ type: "span", text: "N/A" }),
					],
				}),
			);
		});
	});
}

type TornProbabilityRoleWeights = Record<string, Record<string, number>>;

async function fetchWeights(): Promise<TornProbabilityRoleWeights> {
	if (ttCache.hasValue("probability-weights")) {
		return ttCache.get("probability-weights")!;
	}

	const weights = await fetchData<TornProbabilityRoleWeights>("tornprobability", { section: "GetRoleWeights", relay: true });

	ttCache.set({ "probability-weights": weights }, TO_MILLIS.DAYS);
	return weights;
}

function weightsForScenario(weights: TornProbabilityRoleWeights, title: string) {
	const key = title.replaceAll(" ", "");
	if (key in weights) return weights[key];

	const keyAlternative = capitalizeText(title, { everyWord: true }).replaceAll(" ", "");
	if (keyAlternative in weights) return weights[keyAlternative];

	return null;
}

function weightForPosition(weights: TornProbabilityRoleWeights[string], title: string) {
	const key = title.replaceAll(" ", "").replaceAll("#", "");
	if (key in weights) return weights[key];

	return null;
}

export default class OCWeightsFeature extends Feature {
	constructor() {
		super("OC Weights", "faction");
	}

	override precondition() {
		return isInternalFaction;
	}

	override requirements() {
		if (!settings.external.tornprobability) return "Torn Probability not enabled";
		else if (hasOC1Data()) return "Still on OC1.";

		return true;
	}

	override isEnabled() {
		return settings.pages.faction.ocWeights;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		if (getFactionSubpage() !== "crimes") return;

		await displayScenarioWeights();
	}

	override storageKeys() {
		return ["settings.pages.faction.ocWeights", "settings.external.tornprobability"];
	}
}
