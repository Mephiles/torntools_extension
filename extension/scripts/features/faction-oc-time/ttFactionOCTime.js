"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Faction OC Timer",
		"sidebar",
		() => settings.pages.sidebar.factionOCTimer,
		null,
		showTimer,
		removeTimer,
		{
			storage: ["settings.pages.sidebar.factionOCTimer", "factiondata.crimes"],
		},
		() => {
			if (!hasAPIData() || !factiondata.crimes) return "No API access.";
			else if (!!userdata.organizedCrime) return "No OC 1 data.";
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		addInformationSection();
		showInformationSection();

		// Next available OC timer
		if (factiondata?.crimes) {
			const factionOCElement = document.newElement({ type: "span", class: "countdown" });
			const ocArray = Object.values(factiondata.crimes)
				.filter((oc) => !oc.time_completed)
				.sort((a, b) => a.time_left - b.time_left);

			if (ocArray.length) {
				const nextOC = ocArray[0];

				const nextOCTimeLeft = nextOC.time_ready * 1000 - Date.now();

				if (nextOCTimeLeft <= TO_MILLIS.HOURS * 8) factionOCElement.classList.add("short");
				else if (nextOCTimeLeft <= TO_MILLIS.HOURS * 12) factionOCElement.classList.add("medium");

				if (nextOCTimeLeft > 0) {
					const formatOptions = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
					factionOCElement.textContent = formatTime({ milliseconds: nextOCTimeLeft }, formatOptions);

					factionOCElement.dataset.end = nextOC.time_ready * 1000;
					factionOCElement.dataset.timeSettings = JSON.stringify(formatOptions);
					countdownTimers.push(factionOCElement);
				} else {
					factionOCElement.textContent = "OC Ready";
				}
			} else {
				factionOCElement.textContent = "No OCs planned.";
			}

			document.find(".tt-sidebar-information").appendChild(
				document.newElement({
					type: "section",
					id: "factionOCTimer",
					children: [document.newElement({ type: "a", class: "title", text: "Faction OC: ", href: LINKS.organizedCrimes }), factionOCElement],
					style: { order: 2 },
				})
			);
		}
	}

	function removeTimer() {
		// Timer for the next available *faction* OC
		const secondTimer = document.find("#factionOCTimer");
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
