import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement, requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { sleep } from "@common/utils/functions/utilities";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";

async function addJobPointsTooltip() {
	await requireSidebar();

	const jobIcon = await requireElement("#sidebarroot [class*='status-icons__'] a[href*='/job']");
	jobIcon.addEventListener("mouseover", tooltipListener);
}

async function tooltipListener() {
	if (!FEATURE_MANAGER.isEnabled(JobPointsTooltipFeature)) return;

	const jobId = userdata.job?.type === "job" ? userdata.job.name.toLowerCase() : userdata.job.type_id;
	const allJobPoints = getAllJobPoints();

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

function getAllJobPoints(): AllJobPoints {
	const response = userdata.jobpoints;

	const jobPoints: AllJobPoints = { ...response.jobs };
	response.companies.forEach((c) => (jobPoints[c.company.id] = c.points));

	return jobPoints;
}

export default class JobPointsTooltipFeature extends Feature {
	constructor() {
		super("Job Points Tooltip", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.jobpoints) return "No API access.";
		else if (!userdata.job) return "Currently you don't have a job.";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.showJobPointsToolTip;
	}

	async execute() {
		await addJobPointsTooltip();
	}

	storageKeys() {
		return ["settings.pages.sidebar.showJobPointsToolTip"];
	}
}
