import { isInternalFaction } from "@common/pages/factions-page";
import { settings } from "@common/utils/data/database";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { findAllElements } from "@common/utils/functions/dom";
import { formatNumber } from "@common/utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";
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

			return parseInt(name.match(/(?<= \().*(?=\))/)[0].replaceAll(/,/g, ""));
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
