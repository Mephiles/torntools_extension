"use strict";

(async () => {
	featureManager.registerFeature(
		"Education Finish Time",
		"education",
		() => settings.pages.education.finishTime,
		null,
		showEducationFinishTime,
		removeTime,
		{
			storage: ["settings.pages.education.finishTime"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.education) return "No API access.";
		}
	);

	async function showEducationFinishTime() {
		if (userdata.education_timeleft <= 0) return;

		await requireElement(".msg .bold");
		const overDateNumber = new Date(userdata.dateBasic + userdata.education_timeleft * 1000).getTime();
		document.find(".msg .bold").insertAdjacentHTML(
			"afterend",
			`<span class="tt-time">&nbsp;
				<b>
					(${formatDate({ milliseconds: overDateNumber }, { showYear: true })} ${formatTime({ milliseconds: overDateNumber })})
				</b>
			</span>`
		);
	}

	function removeTime() {
		const ttTime = document.find(".tt-time");
		if (ttTime) ttTime.remove();
	}
})();
