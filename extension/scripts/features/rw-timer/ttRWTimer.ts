(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"RW Timer",
		"sidebar",
		() => settings.pages.sidebar.rwTimer && !!userdata?.faction,
		null,
		showTimer,
		removeTimer,
		{
			storage: ["settings.pages.sidebar.rwTimer"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
			else if (!hasOC2Data()) return "No OC 2 data.";

			return true;
		}
	);

	async function showTimer() {
		if (factiondata.access === "none") return;

		await requireSidebar();

		removeTimer();
		await addInformationSection();
		showInformationSection();

		const hasRWPlanned = !!factiondata.rankedwars.find((w) => w.end === 0);
		if (!hasRWPlanned) return;

		document.querySelector(".tt-sidebar-information").appendChild(
			elementBuilder({
				type: "section",
				id: "rwTimer",
				children: [
					elementBuilder({
						type: "a",
						class: "title",
						text: "RW: ",
						href: LINKS.faction__ranked_war,
					}),
					buildTimeLeftElement(factiondata),
				],
				style: { order: "3" },
			})
		);
	}

	function buildTimeLeftElement(data: FetchedFactiondataBasic) {
		const timeLeftElement = elementBuilder({ type: "span", class: "countdown" });
		const now = Date.now();

		const war = data.rankedwars[0];

		if (war.end !== 0) {
			// Filtered out before we call this function.
			timeLeftElement.textContent = `Unexpected, please report!`;
		} else if (war.start > now) {
			const readyAt = war.start * TO_MILLIS.SECONDS;
			const timeLeft = readyAt - now;

			if (timeLeft <= TO_MILLIS.HOURS) timeLeftElement.classList.add("short");
			else if (timeLeft <= TO_MILLIS.HOURS * 6) timeLeftElement.classList.add("medium");

			const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
			timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

			timeLeftElement.dataset.end = readyAt.toString();
			timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
			timeLeftElement.dataset.doneText = "Ongoing";
			countdownTimers.push(timeLeftElement);
		} else {
			timeLeftElement.textContent = `Ongoing`;
			timeLeftElement.classList.add("short");
		}

		return timeLeftElement;
	}

	function removeTimer() {
		document.querySelector("#rwTimer")?.remove();
	}

	return true;
})();
