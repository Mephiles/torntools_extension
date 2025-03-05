"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"OC2 Time",
		"sidebar",
		() => settings.pages.sidebar.oc2Timer && (userdata?.faction?.faction_id > 0 ?? false),
		null,
		showTimer,
		removeTimer,
		{
			storage: [
				"settings.pages.sidebar.oc2Timer",
				"settings.pages.sidebar.oc2TimerPosition",
				"settings.pages.sidebar.oc2TimerLevel",
				"userdata.organizedCrime",
			],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!userdata.organizedCrime) return "No OC data (still on OC 1?).";
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		addInformationSection();
		showInformationSection();

		const elements = [];

		const inCrime = ["Recruiting", "Planning"].includes(userdata.organizedCrime.status);
		if (inCrime) {
			elements.push(buildTimeLeftElement());
			if (settings.pages.sidebar.oc2TimerPosition) {
				elements.push(document.newElement({ type: "span", text: " - " }));
				elements.push(buildPositionElement());
			}
			if (settings.pages.sidebar.oc2TimerLevel) {
				elements.push(buildLevelElement());
			}
		} else {
			elements.push(document.newElement({ type: "span", class: "countdown", text: "No crime joined." }));
		}

		document.find(".tt-sidebar-information").appendChild(
			document.newElement({
				type: "section",
				id: "oc2Timer",
				children: [document.newElement({ type: "a", class: "title", text: "OC: ", href: LINKS.organizedCrimes }), ...elements],
				style: { order: 1 },
			})
		);
	}

	function buildTimeLeftElement() {
		const timeLeftElement = document.newElement({ type: "span", class: "countdown" });
		const now = Date.now();
		let readyAt;
		// Torn's ready_at value corresponds to the planning finish time for currently joined members
		// If the OC is partially filled it will not provide an accurate end time (i.e. when it will initiate)

		// Count the missing members
		let missingMembers = 0;
		for (const slot of userdata.organizedCrime.slots) {
			if (slot.user_id === null) {
				missingMembers += 1;
			}
		}

		// Add 24 hours for every missing member
		// The end result is that this now provides the earliest projected end/initiation time
		if (missingMembers > 0) {
			const missingTime = 24 * 60 * 60 * missingMembers;
			readyAt = Math.max((userdata.organizedCrime.ready_at + missingTime) * 1000, now + missingTime * 1000);
		} else {
			readyAt = userdata.organizedCrime.ready_at * 1000;
		}

		const timeLeft = readyAt - now;

		if (timeLeft <= TO_MILLIS.HOURS * 8) timeLeftElement.classList.add("short");
		else if (timeLeft <= TO_MILLIS.HOURS * 12) timeLeftElement.classList.add("medium");

		if (timeLeft > 0) {
			const formatOptions = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
			timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

			timeLeftElement.dataset.end = readyAt;
			timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
			countdownTimers.push(timeLeftElement);
		} else {
			timeLeftElement.textContent = `Ready ${userdata.organizedCrime.status}`;
		}

		return timeLeftElement;
	}

	function buildPositionElement() {
		const position = userdata.organizedCrime.slots.find(({ user_id }) => user_id === userdata.player_id)?.position ?? "???";
		const name = userdata.organizedCrime.name;

		return document.newElement({ type: "span", class: "position", text: `${position} in ${name}` });
	}

	function buildLevelElement() {
		const level = userdata.organizedCrime.difficulty;

		return document.newElement({ type: "span", class: "position", text: ` (Lvl ${level})` });
	}

	function removeTimer() {
		document.find("#oc2Timer")?.remove();
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
