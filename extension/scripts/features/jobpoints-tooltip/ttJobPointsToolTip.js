"use strict";

(async () => {
    const feature = featureManager.registerFeature(
		"Job Points Tooltip",
		"sidebar",
		() => settings.pages.sidebar.showJobPointsToolTip,
		jobPointsUseListener,
		addJobPointsTooltip,
		null,
		{
			storage: ["settings.pages.sidebar.showJobPointsToolTip", "userdata.job.job"],
		},
		() => {
			if (!hasAPIData() ) return "No API access.";
			else if (!settings.apiUsage.user.jobpoints) return "Job points API usage disabled.";
            else if (!userdata.job.job || (userdata.job.job === "None" && userdata.job.company_name === "None")) return "Currently you don't have a job.";
		}
	);

	function jobPointsUseListener() {
		addXHRListener(async (event) => {
			if (!feature.enabled()) return;

			const { page, json } = event.detail;

			if (page === "companies" && json && json.pointsLeft) {
				await ttCache.set({ points: json.pointsLeft }, getTimeUntilNextJobUpdate(), "job");
			}
		});
	}

    async function addJobPointsTooltip() {
        await requireSidebar();

		const jobIcon = await requireElement("#sidebarroot a[href*='/job']");
		jobIcon.addEventListener("mouseover", tooltipListener);
    }

	async function tooltipListener() {
		if (!feature.enabled()) return;
        const jobPoints = await getCurrentJobPoints();

		await sleep(200); // Tooltip transition duration from one icon's tooltip information to another icon's tooltip information
		
		const tooltipEl = (await requireElement("body > [id*='floating-ui-']")).find("[class*='tooltip__']");
		const tooltipBodyEl = tooltipEl.getElementsByTagName("p")[0];
		const tooltipBodyText = tooltipBodyEl.textContent;
		const lastParenthesisIndex = tooltipBodyText.lastIndexOf(")");
		
		const pointsText = ` - ${jobPoints} points`;

		if (tooltipBodyText.includes(pointsText)) return;
		
		if (lastParenthesisIndex > -1)
			tooltipBodyEl.textContent = tooltipBodyText.substr(0, lastParenthesisIndex) + pointsText + tooltipBodyText.substr(lastParenthesisIndex);
		else
			tooltipBodyEl.textContent.insertAdjacentText("beforeend", pointsText);
	}

	async function getCurrentJobPoints() {
		if (ttCache.hasValue("job", "points")) {
			return ttCache.get("job", "points");
		} else {
			const jobId = !userdata.job.company_type || userdata.job.company_type === 0 || userdata.job?.company_id === 0 ? userdata.job.job : userdata.job.company_type;
			
			try {
				const response = (
					await fetchData("torn", {
						section: "user",
						selections: ["jobpoints"],
						silent: true,
						succeedOnError: true,
					})
				).jobpoints;

                let currentJobPoints;
                if (isNaN(jobId))
                    currentJobPoints = response.jobs[jobId] ?? 0;
                else
                    currentJobPoints = response.companies[jobId].jobpoints ?? 0;

				await ttCache.set({ points: currentJobPoints }, getTimeUntilNextJobUpdate(), "job");

				return currentJobPoints;
			} catch (error) {
				console.error("TT - An error occurred when fetching job points data, Error: " + error);
				throw new Error("An error occurred when fetching job points data, Error: " + error);
			}
		}
	}
})();