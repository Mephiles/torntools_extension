import { settings } from "@common/utils/data/database";
import { createContainer } from "@common/utils/functions/containers";
import { CSVExport } from "@common/utils/functions/csv";
import { elementBuilder, getSearchParameters } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, getUsername } from "@common/utils/functions/torn";
import { PHFillTable } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import styles from "./csv-ranked-war-report.module.css";

async function addCSVContainer() {
	await requireElement(".faction-war");

	const { options } = createContainer("Ranked War Report", {
		previousElement: findElement(".content-wrapper .content-title"),
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
					csv.append(findElement(`.faction-war .${selector} div[class*="text___"]`).textContent);
					csv.append("Members", "Level", "Attacks", "Score");

					const members = findAllElements(`.${selector}-faction .members-list > *[class]`);
					if (members.length) {
						for (const row of members) {
							csv.append(
								getUsername(row).combined,
								findElement(".level", row).textContent,
								findElement(".points", row).textContent,
								findElement(".status", row).textContent,
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

export default class CSVRankedWarReportFeature extends Feature {
	constructor() {
		super("Ranked War Report to CSV", "faction");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.faction.csvRankedWarReport;
	}

	override async execute() {
		await addCSVContainer();
	}

	override storageKeys() {
		return ["settings.pages.faction.csvRankedWarReport"];
	}
}
