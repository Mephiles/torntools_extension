"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"OC Time",
		"sidebar",
		() => settings.pages.sidebar.ocTimer,
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

		// Next available OC timer
		if (factiondata?.crimes) {
			const nextOCElement = document.newElement({ type: "span", class: "countdown" });
			let ocArray = Object.values(factiondata.crimes).filter((el) => { return el.time_completed == 0; }).sort((a, b) => { return a.time_left - b.time_left; });

			if (ocArray.length) {
				let nextOC = ocArray[0];

				const nextOCTimeLeft = (nextOC.time_ready * 1000) - Date.now();

				if (timeLeft <= TO_MILLIS.HOURS * 8) nextOCElement.classList.add("short");
				else if (timeLeft <= TO_MILLIS.HOURS * 12) nextOCElement.classList.add("medium");

				if (nextOCTimeLeft > 0) {
					nextOCElement.textContent = formatTime({ milliseconds: nextOCTimeLeft }, { type: "wordTimer", extraShort: true, showDays: true });

					nextOCElement.dataset.end = (nextOC.time_ready * 1000);
					nextOCElement.dataset.seconds = (nextOCTimeLeft / 1000).dropDecimals();
					nextOCElement.dataset.timeSettings = JSON.stringify({ type: "wordTimer", extraShort: true, showDays: true });
					countdownTimers.push(nextOCElement);
				} else {
					nextOCElement.textContent = "OC Ready";
				}
			} else {
				nextOCElement.textContent = "No OCs planned.";
			}

			document.find(".tt-sidebar-information").appendChild(
				document.newElement({
					type: "section",
					id: "nextOCTimer",
					children: [document.newElement({ type: "a", class: "title", text: "Faction OC: ", href: LINKS.organizedCrimes }), nextOCElement],
				})
			);
		}
	}

	function removeTimer() {
		const timer = document.find("#ocTimer");
		if (timer) timer.remove();

		// Timer for the next available *faction* OC
		const secondTimer = document.find("#nextOCTimer");
		if (secondTimer) secondTimer.remove();
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
