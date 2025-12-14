"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"OC Time",
		"sidebar",
		() => settings.pages.sidebar.ocTimer && userdata?.faction,
		null,
		showTimer,
		removeTimer,
		{
			storage: ["settings.pages.sidebar.ocTimer", "factiondata.userCrime", "userdata.userCrime"],
		},
		() => {
			if (!hasAPIData() || !((settings.apiUsage.user.icons && userdata.userCrime) || factiondata.userCrime)) return "No API access.";
			else if (!hasOC1Data()) return "No OC 1 data.";
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		await addInformationSection();
		showInformationSection();

		const userCrime = "userCrime" in factiondata ? factiondata.userCrime : userdata.userCrime;
		const timeLeft = userCrime - Date.now();

		const timeLeftElement = document.newElement({ type: "span", class: "countdown" });
		if (userCrime === -1) {
			timeLeftElement.textContent = "No active OC.";
		} else {
			if (timeLeft <= TO_MILLIS.HOURS * 8) timeLeftElement.classList.add("short");
			else if (timeLeft <= TO_MILLIS.HOURS * 12) timeLeftElement.classList.add("medium");

			if (timeLeft > 0) {
				const formatOptions = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
				timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

				timeLeftElement.dataset.end = userCrime;
				timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
				countdownTimers.push(timeLeftElement);
			} else {
				timeLeftElement.textContent = "Ready";
			}
		}

		document.find(".tt-sidebar-information").appendChild(
			document.newElement({
				type: "section",
				id: "ocTimer",
				children: [document.newElement({ type: "a", class: "title", text: "OC: ", href: LINKS.organizedCrimes }), timeLeftElement],
				style: { order: 1 },
			})
		);
	}

	function removeTimer() {
		const timer = document.find("#ocTimer");
		if (timer) timer.remove();
	}
})();
