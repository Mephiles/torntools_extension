import "./csv-challenge-contributions.css";
import { Feature, FEATURE_MANAGER } from "@features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { CSVExport } from "@/utils/common/functions/csv";

async function addCSVContainer() {
	if (!location.hash.includes("tab=upgrades")) return;

	const descriptionWrap = await requireElement("#factions #faction-upgrades .body #stu-confirmation .description-wrap");
	const contributionsWrap = descriptionWrap.querySelector(".contributions-wrap");
	if (!contributionsWrap) return;

	const exportButtonDiv = elementBuilder({
		type: "div",
		id: "ttExportButton",
		children: [
			elementBuilder({ type: "i", class: "ph-fill ph-table" }),
			elementBuilder({ type: "span", class: "text", text: "CSV" }),
			elementBuilder({ type: "a", id: "ttExportLink" }),
		],
	});
	createContainer("Export Challenge Contributions", {
		nextElement: contributionsWrap,
		onlyHeader: true,
		applyRounding: false,
		collapsible: false,
	}).options.appendChild(exportButtonDiv);
	descriptionWrap.querySelector("#ttExportButton").addEventListener("click", () => {
		const upgradeName = descriptionWrap.querySelector("[role='alert'] .name").textContent;

		const csv = new CSVExport(`${upgradeName} Contributors`, descriptionWrap.querySelector("#ttExportButton #ttExportLink"));
		csv.append(upgradeName);
		csv.append("Number", "Name", "Profile Link", "Ex Member", "Contributions");

		for (const row of findAllElements(".flexslides li:not(.slide)", contributionsWrap)) {
			const link = row.querySelector<HTMLAnchorElement>(".player a");
			const name = link.getAttribute("aria-label");

			csv.append(
				row.querySelector(".numb").textContent,
				name.match(/.*(?= \()/)[0],
				link.href,
				row.classList.contains("ex-member") ? "Yes" : "No",
				name.match(/(?<= \().*(?=\))/)[0]
			);
		}

		csv.download();
	});
}

function removeCSVContainer() {
	removeContainer("Export Challenge Contributions");
}

export default class CSVChallengeContributionsFeature extends Feature {
	constructor() {
		super("Challenge Contributions to CSV", "faction");
	}

	precondition() {
		return getPageStatus().access && getSearchParameters().get("step") === "your";
	}

	isEnabled() {
		return settings.pages.faction.csvChallengeContributions;
	}

	initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_UPGRADE_INFO].push(async () => {
			if (!FEATURE_MANAGER.isEnabled(CSVChallengeContributionsFeature)) return;

			await addCSVContainer();
		});
	}

	cleanup() {
		removeCSVContainer();
	}

	storageKeys() {
		return ["settings.pages.faction.csvChallengeContributions"];
	}
}
