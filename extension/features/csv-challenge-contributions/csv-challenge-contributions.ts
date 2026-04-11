import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isInternalFaction } from "@/pages/factions-page";
import { settings } from "@/utils/common/data/database";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { CSVExport } from "@/utils/common/functions/csv";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";
import { PHFillTable } from "@/utils/common/icons/phosphor-icons";
import styles from "./csv-challenge-contributions.module.css";

async function addCSVContainer() {
	if (!location.hash.includes("tab=upgrades")) return;

	const descriptionWrap = await requireElement("#factions #faction-upgrades .body #stu-confirmation .description-wrap");
	const contributionsWrap = descriptionWrap.querySelector(".contributions-wrap");
	if (!contributionsWrap) return;

	const { options } = createContainer("Export Challenge Contributions", {
		nextElement: contributionsWrap,
		onlyHeader: true,
		applyRounding: false,
		collapsible: false,
	});

	const exportButton = elementBuilder({
		type: "div",
		class: styles.exportButton,
		children: [PHFillTable(), elementBuilder({ type: "span", text: "CSV" })],
		events: {
			click() {
				const upgradeName = descriptionWrap.querySelector("[role='alert'] .name").textContent;

				const csv = new CSVExport(`${upgradeName} Contributors`);
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
						name.match(/(?<= \().*(?=\))/)[0],
					);
				}

				csv.download();
			},
		},
	});
	options.appendChild(exportButton);
}

function removeCSVContainer() {
	removeContainer("Export Challenge Contributions");
}

export default class CSVChallengeContributionsFeature extends Feature {
	constructor() {
		super("Challenge Contributions to CSV", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
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
