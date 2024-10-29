"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"OC Time",
		"sidebar",
		() => settings.pages.sidebar.ocTimer && (userdata?.faction?.faction_id > 0 ?? false),
		null,
		showTimer,
		removeTimer,
		{
			storage: ["settings.pages.sidebar.ocTimer", "factiondata.userCrime", "userdata.userCrime"],
		},
		() => {
			if (!hasAPIData() || !((settings.apiUsage.user.icons && userdata.userCrime) || factiondata.userCrime)) return "No API access.";
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		addInformationSection();
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
				timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, { type: "wordTimer", extraShort: true, showDays: true });

				// Set the crime so the timer will have the actual end date to avoid desync from tab inactivity
				timeLeftElement.dataset.end = userCrime;

				timeLeftElement.dataset.seconds = (timeLeft / 1000).dropDecimals();
				timeLeftElement.dataset.timeSettings = JSON.stringify({ type: "wordTimer", extraShort: true, showDays: true });
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
			})
		);
	}

	function removeTimer() {
		const timer = document.find("#ocTimer");
		if (timer) timer.remove();
	}

	function addInformationSection() {
		if (document.find(".tt-sidebar-information")) return;

		const parent = document.find("#sidebarroot div[class*='user-information_'] div[class*='toggle-content_'] div[class*='content_']");

		parent.appendChild(document.newElement({ type: "hr", class: "tt-sidebar-information-divider tt-delimiter tt-hidden" }));
		parent.appendChild(document.newElement({ type: "div", class: "tt-sidebar-information tt-hidden" }));
	}

	function showInformationSection() {
		document.find(".tt-sidebar-information-divider").classList.remove("tt-hidden");
		document.find(".tt-sidebar-information").classList.remove("tt-hidden");
	}
})();
