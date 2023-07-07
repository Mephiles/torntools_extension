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
		},
	);

	function initialise() {
		window.addEventListener("hashchange", showEducationFinishTime);
	}

	async function showEducationFinishTime() {
		if (getHashParameters().get("step") !== "main") return;
		if (userdata.education_timeleft <= 0) return;

		const msg = await requireElement(".msg .bold");
		const overDate = new Date(userdata.dateBasic + userdata.education_timeleft * 1000).getTime();

		msg.insertAdjacentElement(
			"afterend",
			document.newElement({ type: "b", text: ` (${formatDate(overDate, { showYear: true })} ${formatTime({ milliseconds: overDate })})` }),
		);
	}

	function removeTime() {
		const ttTime = document.find(".tt-time");
		if (ttTime) ttTime.remove();
	}
})();
