import { api, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import styles from "./war-report-highlight.module.css";

async function highlightName() {
	await requireElement(".members-list");

	document.querySelector(`li:has(.member a[href*='${api.torn.owner}'])`)?.classList.add(styles.warReportHighlight);
}

export default class WarReportHighlightFeature extends Feature {
	constructor() {
		super("War Report Highlight", "faction");
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.faction.warReportHighlight;
	}

	async execute() {
		await highlightName();
	}

	storageKeys() {
		return ["settings.pages.faction.warReportHighlight"];
	}
}
