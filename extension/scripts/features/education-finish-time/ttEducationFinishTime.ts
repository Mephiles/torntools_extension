(async () => {
	if (!getPageStatus().access) return;

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

			return true;
		}
	);

	async function showEducationFinishTime() {
		if (userdata.education_timeleft <= 0) return;

		const msg: Element = await requireElement(".msg .bold");
		const overDate = new Date(userdata.dateBasic + userdata.education_timeleft * 1000).getTime();

		msg.insertAdjacentElement(
			"afterend",
			elementBuilder({ type: "b", text: ` (${formatDate(overDate, { showYear: true })} ${formatTime({ milliseconds: overDate })})` })
		);
	}

	function removeTime() {
		document.querySelector(".tt-time")?.remove();
	}
})();
