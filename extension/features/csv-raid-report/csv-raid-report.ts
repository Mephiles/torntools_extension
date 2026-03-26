import "./csv-raid-report.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus, getUsername } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { CSVExport } from "@/utils/common/functions/csv";

async function addCSVContainer() {
	await requireElement(".faction-war");
	const { options } = createContainer("Raid Report", {
		previousElement: document.querySelector(".content-wrapper .content-title"),
		onlyHeader: true,
	});
	const ttExportButton = elementBuilder({
		type: "div",
		id: "ttExportButton",
		children: [
			elementBuilder({ type: "i", class: "ph-fill ph-table" }),
			elementBuilder({ type: "span", class: "text", text: "CSV" }),
			elementBuilder({ type: "a", id: "ttExportLink" }),
		],
	});
	ttExportButton.addEventListener("click", () => {
		const raidID = getSearchParameters().get("raidID");
		const csv = new CSVExport(`Raid Report [${raidID}]`, options.querySelector("#ttExportLink"));

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
						row.querySelector(".status").textContent
					);
				}
			} else csv.append("None");
		}

		csv.download();
	});
	options.insertAdjacentElement("afterbegin", ttExportButton);
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
