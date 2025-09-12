"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"OC2 Time",
		"sidebar",
		() => settings.pages.sidebar.oc2Timer && userdata?.faction,
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
			else if (!hasOC2Data()) return "No OC 2 data.";
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		await addInformationSection();
		showInformationSection();

		const elements = [];

		const inCrime = userdata.organizedCrime !== null ? ["Recruiting", "Planning"].includes(userdata.organizedCrime.status) : false;
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
				children: [
					document.newElement({
						type: "a",
						class: "title",
						text: "OC: ",
						href: LINKS.organizedCrimes,
					}),
					...elements,
				],
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
		const missingMembers = userdata.organizedCrime.slots.filter(({ user }) => user === null).length;

		// Add 24 hours for every missing member
		// The result is that this now provides the earliest projected end/initiation time
		if (missingMembers > 0) {
			const missingTime = TO_MILLIS.DAYS * missingMembers;
			readyAt = Math.max(userdata.organizedCrime.ready_at * 1000 + missingTime, now + missingTime);
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
		const position = userdata.organizedCrime.slots.find(({ user }) => user?.id === userdata.profile.id)?.position ?? "???";
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
})();
