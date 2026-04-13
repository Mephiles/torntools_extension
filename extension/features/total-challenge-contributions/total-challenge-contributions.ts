import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { findAllElements } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import "./total-challenge-contributions.css";

async function addCSVContainer() {
	if (!location.hash.includes("tab=upgrades")) return;

	const descriptionWrap = await requireElement("#factions #faction-upgrades .body #stu-confirmation .description-wrap");
	const contributionsWrap = descriptionWrap.querySelector(".contributions-wrap");
	if (!contributionsWrap) return;

	const { options } = createContainer("Total Challenge Contributions", {
		nextElement: contributionsWrap,
		onlyHeader: true,
		applyRounding: false,
		collapsible: false,
	});

	const totalContributions = findAllElements(".flexslides li:not(.slide)", contributionsWrap)
		.map((row) => {
			const link = row.querySelector<HTMLAnchorElement>(".player a");
			const name = link.getAttribute("aria-label");

			return parseInt(name.match(/(?<= \().*(?=\))/)[0].replace(/,/, ""));
		})
		.reduce((total, value) => total + value, 0);

	options.appendChild(document.createTextNode(formatNumber(totalContributions)));
}

function removeCSVContainer() {
	removeContainer("Total Challenge Contributions");
}

export default class TotalChallengeContributionsFeature extends Feature {
	constructor() {
		super("Total Challenge Contributions", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.totalChallengeContributions;
	}

	initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_UPGRADE_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(TotalChallengeContributionsFeature)) return;

			await addCSVContainer();
		});
	}

	cleanup() {
		removeCSVContainer();
	}

	storageKeys() {
		return ["settings.pages.faction.totalChallengeContributions"];
	}
}
