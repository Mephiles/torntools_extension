import { ttCache } from "@common/utils/data/cache";
import { settings, userdata } from "@common/utils/data/database";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { formatNumber } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement, requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { getTimeUntilNextJobUpdate, sleep } from "@common/utils/functions/utilities";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";
import type { UserJobPointsResponse } from "tornapi-typescript";

function jobPointsUseListener() {
	addXHRListener(async (event) => {
		if (!FEATURE_MANAGER.isEnabled(JobPointsTooltipFeature)) return;

		const { page, json } = event.detail;

		if (page === "companies" && json && json.pointsLeft) {
			const allJobPoints = await getAllJobPoints();
			const jobId = userdata.job?.type === "job" ? userdata.job.name.toLowerCase() : userdata.job.type_id;

			await ttCache.set({ points: { ...allJobPoints, [jobId]: json.pointsLeft } }, getTimeUntilNextJobUpdate(), "job");
		}
	});
}

async function addJobPointsTooltip() {
	await requireSidebar();

	const jobIcon = await requireElement("#sidebarroot [class*='status-icons__'] a[href*='/job']");
	jobIcon.addEventListener("mouseover", tooltipListener);
}

async function tooltipListener() {
	if (!FEATURE_MANAGER.isEnabled(JobPointsTooltipFeature)) return;

	const jobId = userdata.job?.type === "job" ? userdata.job.name.toLowerCase() : userdata.job.type_id;
	const allJobPoints = await getAllJobPoints();

	const jobPoints = jobId in allJobPoints ? allJobPoints[jobId] : 0;

	await sleep(200); // Tooltip transition duration from one icon's tooltip information to another icon's tooltip information

	const tooltipEl = await requireElement("body > div[id][data-floating-ui-portal] [class*='tooltip__']");

	const tooltipBodyEl = tooltipEl.getElementsByTagName("p")[0];
	const tooltipBodyText = tooltipBodyEl.textContent;

	// Race condition
	// Check if the tooltip is still of Company or City Job
	if (
		!tooltipBodyEl.previousElementSibling ||
		(tooltipBodyEl.previousElementSibling.textContent !== "Company" && tooltipBodyEl.previousElementSibling.textContent !== "Job")
	)
		return;

	const lastParenthesisIndex = tooltipBodyText.lastIndexOf(")");
	const pointsText = ` - ${formatNumber(jobPoints)} points`;

	if (tooltipBodyText.includes(pointsText)) return;

	if (lastParenthesisIndex > -1)
		tooltipBodyEl.textContent = tooltipBodyText.substr(0, lastParenthesisIndex) + pointsText + tooltipBodyText.substr(lastParenthesisIndex);
	else tooltipBodyEl.insertAdjacentText("beforeend", pointsText);
}

interface AllJobPoints {
	[jobOrCompanyId: string | number]: number;
}

async function getAllJobPoints(): Promise<AllJobPoints> {
	if (ttCache.hasValue("job", "points")) {
		return ttCache.get<AllJobPoints>("job", "points");
	} else {
		try {
			const response = (
				await fetchData<UserJobPointsResponse>("tornv2", {
					section: "user",
					selections: ["jobpoints"],
					silent: true,
				})
			).jobpoints;

			const jobPoints: AllJobPoints = { ...response.jobs };
			response.companies.forEach((c) => (jobPoints[c.company.id] = c.points));

			await ttCache.set({ points: jobPoints }, getTimeUntilNextJobUpdate(), "job");

			return jobPoints;
		} catch (error) {
			console.error(`TT - An error occurred when fetching job points data, Error: ${error}`);
			throw new Error(`An error occurred when fetching job points data, Error: ${error}`);
		}
	}
}

export default class JobPointsTooltipFeature extends Feature {
	constructor() {
		super("Job Points Tooltip", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!userdata.job) return "Currently you don't have a job.";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.showJobPointsToolTip;
	}

	initialise() {
		jobPointsUseListener();
	}

	async execute() {
		await addJobPointsTooltip();
	}

	storageKeys() {
		return ["settings.pages.sidebar.showJobPointsToolTip"];
	}
}
