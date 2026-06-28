import "./recommended-nnb.css";
import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements, mobile } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

const ORGANIZED_CRIMES = {
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
	if (!document.querySelector(".faction-crimes-wrap")) return;

	await showRecommendedNNB();
}

async function showRecommendedNNB() {
	const parent = document.querySelector(".faction-crimes-wrap .begin-wrap");
	if (!parent) return;
	parent.classList.add("tt-modified");

	const heading = parent.querySelector(".plan-crimes[role=heading]");
	heading.appendChild(elementBuilder({ type: "span", class: "tt-recommended-nnb", text: mobile ? "NNB" : "Recommended NNB" }));

	for (const crime of findAllElements(".crimes-list .item-wrap .plan-crimes", parent)) {
		crime.appendChild(elementBuilder({ type: "span", class: "tt-recommended-nnb", text: ORGANIZED_CRIMES[crime.textContent] }));
	}
}

function removeRecommendedNNB() {
	document.querySelector(".faction-crimes-wrap .begin-wrap")?.classList.remove("tt-modified");

	for (const nnb of findAllElements(".tt-recommended-nnb")) {
		nnb.remove();
	}
}

export default class RecommendedNNBFeature extends Feature {
	constructor() {
		super("Recommended NNB", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.recommendedNnb;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		removeRecommendedNNB();
	}

	storageKeys() {
		return ["settings.pages.faction.recommendedNnb"];
	}
}
