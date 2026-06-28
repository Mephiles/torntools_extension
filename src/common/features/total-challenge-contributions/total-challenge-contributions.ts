import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { findAllElements } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
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
		addCustomListener(EVENT_CHANNELS.FACTION_UPGRADE_INFO, async () => {
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
