import "./recommended-nnb.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, mobile } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const ORGANIZED_CRIMES: Record<string, string> = {
	Blackmail: "anyone",
	Kidnapping: "~20",
	"Bomb Threat": "25-30",
	"Planned Robbery": "30-40",
	"Rob a money train": "40-50",
	"Take over a cruise liner": "40-55",
	"Hijack a plane": "55-60",
	"Political Assassination": "~60",
};

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_CRIMES, async () => {
		if (!FEATURE_MANAGER.isEnabled(RecommendedNNBFeature)) return;

		await showRecommendedNNB();
	});
}

async function startFeature() {
	if (!findElement(".faction-crimes-wrap", true)) return;

	await showRecommendedNNB();
}

async function showRecommendedNNB() {
	const parent = findElement(".faction-crimes-wrap .begin-wrap", true);
	if (!parent) return;
	parent.classList.add("tt-modified");

	const heading = findElement(".plan-crimes[role=heading]", parent);
	heading.appendChild(elementBuilder({ type: "span", class: "tt-recommended-nnb", text: mobile ? "NNB" : "Recommended NNB" }));

	for (const crime of findAllElements(".crimes-list .item-wrap .plan-crimes", parent)) {
		crime.appendChild(elementBuilder({ type: "span", class: "tt-recommended-nnb", text: ORGANIZED_CRIMES[crime.textContent] }));
	}
}

export default class RecommendedNNBFeature extends Feature {
	constructor() {
		super("Recommended NNB", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.recommendedNnb;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		await startFeature();
	}

	override storageKeys() {
		return ["settings.pages.faction.recommendedNnb"];
	}
}
