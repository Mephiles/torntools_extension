import { api, settings } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import styles from "./war-report-highlight.module.css";

async function highlightName() {
	await requireElement(".members-list");

	findElement(`li:has(.member a[href*='${api.torn.owner}'])`, true)?.classList.add(styles.warReportHighlight);
}

export default class WarReportHighlightFeature extends Feature {
	constructor() {
		super("War Report Highlight", "faction");
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.faction.warReportHighlight;
	}

	override async execute() {
		await highlightName();
	}

	override storageKeys() {
		return ["settings.pages.faction.warReportHighlight"];
	}
}
