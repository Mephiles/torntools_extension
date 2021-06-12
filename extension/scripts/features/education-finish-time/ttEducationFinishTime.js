"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Education Finish Time",
		"education",
		() => settings.pages.education.finishTime,
		initialise,
		showEducationFinishTime,
		removeTime,
		{
			storage: ["settings.pages.education.finishTime"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.education) return "No API access.";
		}
	);

	function initialise() {
		window.addEventListener("hashchange", showEducationFinishTime);
	}

	async function showEducationFinishTime() {
		if (getHashParameters().get("step") !== "main") return;
		if (userdata.education_timeleft <= 0) return;

		await requireElement(".msg .bold");
		const overDate = new Date(userdata.dateBasic + userdata.education_timeleft * 1000).getTime();
		document.find(".msg .bold").insertAdjacentHTML(
			"afterend",
			`
					<span class="tt-time">
						&nbsp;
						<b>
							(${formatDate(overDate, { showYear: true })} ${formatTime({ milliseconds: overDate })})
						</b>
					</span>
				`
		);
	}

	function removeTime() {
		const ttTime = document.find(".tt-time");
		if (ttTime) ttTime.remove();
	}
})();
