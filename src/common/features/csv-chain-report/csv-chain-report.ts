import { settings } from "@common/utils/data/database";
import { createContainer } from "@common/utils/functions/containers";
import { CSVExport } from "@common/utils/functions/csv";
import { elementBuilder, getSearchParameters } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { getUsername } from "@common/utils/functions/torn";
import { PHFillTable } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import styles from "./csv-chain-report.module.css";

async function addCSVContainer() {
	await requireElement(".members-stats-col.respect");

	const { options } = createContainer("Chain Report", {
		previousElement: findElement(".content-wrapper .content-title"),
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
				csv.append(findElement(".report-title-faction-name").textContent);
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
					"Loss",
				);

				const info = findAllElements(".members-stats-rows > *");
				findAllElements(".members-names-rows > *").forEach((member, index) => {
					csv.append(getUsername(member).combined, ...findAllElements(".members-stats-cols > *", info[index]).map((info) => info.textContent));
				});

				csv.download();
			},
		},
	});
	options.appendChild(exportButton);
}

export default class CSVChainReportFeature extends Feature {
	constructor() {
		super("Chain Report to CSV", "faction");
	}

	override isEnabled() {
		return settings.pages.faction.csvChainReport;
	}

	override async execute() {
		await addCSVContainer();
	}

	override storageKeys() {
		return ["settings.pages.faction.csvChainReport"];
	}
}
