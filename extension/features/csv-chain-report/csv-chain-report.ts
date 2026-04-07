import styles from "./csv-chain-report.module.css";
import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, getSearchParameters } from "@/utils/common/functions/dom";
import { CSVExport } from "@/utils/common/functions/csv";
import { getUsername } from "@/utils/common/functions/torn";
import { PHFillTable } from "@/utils/common/icons/phosphor-icons";

async function addCSVContainer() {
	await requireElement(".members-stats-col.respect");

	const { options } = createContainer("Chain Report", {
		previousElement: document.querySelector(".content-wrapper .content-title"),
		onlyHeader: true,
	});
	const exportButton = elementBuilder({
		type: "div",
		class: styles.exportButton,
		children: [PHFillTable(), elementBuilder({ type: "span", class: "text", text: "CSV" })],
		events: {
			click() {
				const chainID = getSearchParameters().get("chainID");
				const csv = new CSVExport(`Chain Report [${chainID}]`);
				csv.append(document.querySelector(".report-title-faction-name").textContent);
				csv.append(
					"Members",
					"Respect",
					"Best",
					"Avg",
					"Attacks",
					"Leave",
					"Mug",
					"Hosp",
					"War",
					"Assist",
					"Retal",
					"Overseas",
					"Draw",
					"Escape",
					"Loss"
				);

				const info = findAllElements(".members-stats-rows > *");
				findAllElements(".members-names-rows > *").forEach((member, index) => {
					csv.append(getUsername(member).combined, ...findAllElements(".members-stats-cols > *", info[index]).map((info) => info.textContent));
				});

				csv.download();
			}
		}
	});
	options.appendChild(exportButton);
}

function removeCSVContainer() {
	removeContainer("Chain Report");
}

export default class CSVChainReportFeature extends Feature {
	constructor() {
		super("Chain Report to CSV", "faction");
	}

	isEnabled() {
		return settings.pages.faction.csvChainReport;
	}

	async execute() {
		await addCSVContainer();
	}

	cleanup() {
		removeCSVContainer();
	}

	storageKeys() {
		return ["settings.pages.faction.csvChainReport"];
	}
}
