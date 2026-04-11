import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { CSVExport } from "@/utils/common/functions/csv";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, getUsername } from "@/utils/common/functions/torn";
import { PHFillTable } from "@/utils/common/icons/phosphor-icons";
import styles from "./csv-ranked-war-report.module.css";

async function addCSVContainer() {
	await requireElement(".faction-war");

	const { options } = createContainer("Ranked War Report", {
		previousElement: document.querySelector(".content-wrapper .content-title"),
		onlyHeader: true,
	});

	const exportButton = elementBuilder({
		type: "div",
		class: styles.exportButton,
		children: [PHFillTable(), elementBuilder({ type: "span", class: "text", text: "CSV" })],
		events: {
			click() {
				const rankID = getSearchParameters().get("rankID");
				const csv = new CSVExport(`Ranked War Report [${rankID}]`);

				for (const selector of ["enemy", "your"]) {
					csv.append(document.querySelector(`.faction-war .${selector} div[class*="text___"]`).textContent);
					csv.append("Members", "Level", "Attacks", "Score");

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
	removeContainer("Ranked War Report");
}

export default class CSVRankedWarReportFeature extends Feature {
	constructor() {
		super("Ranked War Report to CSV", "faction");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.faction.csvRankedWarReport;
	}

	async execute() {
		await addCSVContainer();
	}

	cleanup() {
		removeCSVContainer();
	}

	storageKeys() {
		return ["settings.pages.faction.csvRankedWarReport"];
	}
}
