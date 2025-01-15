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
			storage: ["settings.pages.sidebar.oc2Timer", "settings.pages.sidebar.oc2TimerPosition", "userdata.organizedCrime"],
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
				elements.push(document.newElement({ type: "span", class: "countdown", text: " - " }));
				elements.push(buildPositionElement());
			}
		} else {
			elements.push(document.newElement({ type: "span", class: "countdown", text: "No crime joined." }));
		}

		document.find(".tt-sidebar-information").appendChild(
			document.newElement({
				type: "section",
				id: "oc2Timer",
				children: [document.newElement({ type: "a", class: "title", text: "OC: ", href: LINKS.organizedCrimes }), ...elements],
			})
		);
	}

	function buildTimeLeftElement() {
		const timeLeftElement = document.newElement({ type: "span", class: "countdown" });

		const readyAt = userdata.organizedCrime.ready_at * 1000;
		const timeLeft = readyAt - Date.now();

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
		// const position = userdata.organizedCrime.slots.find(({ user_id }) => user_id === userdata.user_id)?.position ?? "???";
		const position = userdata.organizedCrime.slots.find(({ user_id }) => user_id === 1043377)?.position ?? "???";
		const name = userdata.organizedCrime.name;
		const level = userdata.organizedCrime.difficulty;

		return document.newElement({ type: "span", class: "position", text: `${position} in ${name} (Lvl ${level})` });
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
