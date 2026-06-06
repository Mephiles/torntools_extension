import { settings } from "@common/utils/data/database";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { CSVExport } from "@common/utils/functions/csv";
import { elementBuilder, findAllElements, getSearchParameters } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, getUsername } from "@common/utils/functions/torn";
import { PHFillTable } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import styles from "./csv-raid-report.module.css";

async function addCSVContainer() {
	await requireElement(".faction-war");

	const { options } = createContainer("Raid Report", {
		previousElement: document.querySelector(".content-wrapper .content-title"),
		onlyHeader: true,
	});

	const exportButton = elementBuilder({
		type: "div",
		class: styles.exportButton,
		children: [PHFillTable(), elementBuilder({ type: "span", class: "text", text: "CSV" })],
		events: {
			click() {
				const raidID = getSearchParameters().get("raidID");
				const csv = new CSVExport(`Raid Report [${raidID}]`);

				for (const selector of ["enemy", "your"]) {
					csv.append(document.querySelector(`.faction-war .${selector} div[class*="text___"]`).textContent);
					csv.append("Members", "Level", "Attacks", "Damage");

					const members = findAllElements(`.${selector}-faction .members-list > *[class]`);
					if (members.length) {
						for (const row of members) {
							csv.append(
								getUsername(row).combined,
								row.querySelector(".level").textContent,
								row.querySelector(".points").textContent,
								row.querySelector(".status").textContent,
							);
						}
					} else csv.append("None");
				}

				csv.download();
			},
		},
	});
	options.appendChild(exportButton);
}

function removeCSVContainer() {
	removeContainer("Raid Report");
}

export default class CSVRaidReportFeature extends Feature {
	constructor() {
		super("Raid Report to CSV", "faction");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.faction.csvRaidReport;
	}

	async execute() {
		await addCSVContainer();
	}

	cleanup() {
		removeCSVContainer();
	}

	storageKeys() {
		return ["settings.pages.faction.csvRaidReport"];
	}
}
