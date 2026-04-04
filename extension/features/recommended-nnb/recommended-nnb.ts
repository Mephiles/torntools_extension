import "./recommended-nnb.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { elementBuilder, findAllElements, mobile } from "@/utils/common/functions/dom";
import { settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { isInternalFaction } from "@/pages/factions-page";

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
	CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_CRIMES].push(async () => {
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
