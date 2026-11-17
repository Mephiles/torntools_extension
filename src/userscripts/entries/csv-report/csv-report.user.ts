import { setupFactionsPage } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { getSearchParameters } from "@common/utils/functions/dom";
import { logger } from "@common/utils/functions/logger.ts";
import { getPage } from "@common/utils/functions/torn";
import CSVChainReportFeature from "@features/csv-chain-report/csv-chain-report";
import { CSVChallengeContributionsFeature } from "@features/csv-challenge-contributions/csv-challenge-contributions";
import CSVRaidReportFeature from "@features/csv-raid-report/csv-raid-report";
import CSVRankedWarReportFeature from "@features/csv-ranked-war-report/csv-ranked-war-report";
import CSVWarReportFeature from "@features/csv-war-report/csv-war-report";
import type { Feature } from "@features/feature";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import settingsManifest from "./settings-manifest.ts";

const REPORTS: Record<string, new () => Feature> = {
	chainreport: CSVChainReportFeature,
	raidreport: CSVRaidReportFeature,
	rankreport: CSVRankedWarReportFeature,
	warreport: CSVWarReportFeature,
};

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_cr", settingsManifest);

	if (getPage() === "factions") {
		await setupFactionsPage();

		FEATURE_MANAGER.registerFeature(new CSVChallengeContributionsFeature());
		return;
	}

	const ReportFeature = REPORTS[getSearchParameters().get("step") ?? ""];
	if (!ReportFeature) {
		logger.warn("Failed to decide what feature to run.", getSearchParameters().get("step"));
		return;
	}

	FEATURE_MANAGER.registerFeature(new ReportFeature());
})();
