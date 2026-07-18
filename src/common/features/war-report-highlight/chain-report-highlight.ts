import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import styles from "./war-report-highlight.module.css";

async function highlightName() {
	await requireElement(".members-names-rows");

	findAllElements(".members-names-rows, .members-stats-rows").forEach((list) => list.classList.add(styles.warReportHighlight));
}

function removeHighlight() {
	findAllElements(`.${styles.warReportHighlight}`).forEach((list) => list.classList.remove(styles.warReportHighlight));
}

export default class ChainReportHighlightFeature extends Feature {
	constructor() {
		super("Chain Report Highlight", "faction");
	}

	isEnabled() {
		return settings.pages.faction.warReportHighlight;
	}

	async execute() {
		await highlightName();
	}

	cleanup() {
		removeHighlight();
	}

	storageKeys() {
		return ["settings.pages.faction.warReportHighlight"];
	}
}
