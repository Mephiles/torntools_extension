(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Virus Timer",
		"sidebar",
		() => settings.pages.sidebar.virusTimer,
		null,
		showTimer,
		removeTimer,
		{
			storage: ["settings.pages.sidebar.virusTimer"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.virus) return "No API access.";

			return true;
		}
	);

	async function showTimer() {
		await requireSidebar();

		removeTimer();
		await addInformationSection();
		showInformationSection();

		document.querySelector(".tt-sidebar-information").appendChild(
			elementBuilder({
				type: "section",
				id: "virusTimer",
				children: [
					elementBuilder({
						type: "a",
						class: "title",
						text: "Virus: ",
						href: LINKS.pc,
					}),
					buildTimeLeftElement(),
				],
				style: { order: "5" },
			})
		);
	}

	function buildTimeLeftElement() {
		const timeLeftElement = elementBuilder({ type: "span", class: "countdown" });

		const readyAt: number = (userdata.virus?.until ?? 0) * 1000;
		const timeLeft = readyAt - Date.now();

		if (timeLeft <= TO_MILLIS.HOURS * 8) timeLeftElement.classList.add("short");
		else if (timeLeft <= TO_MILLIS.HOURS * 12) timeLeftElement.classList.add("medium");

		if (timeLeft > 0) {
			const formatOptions: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true, showDays: true, truncateSeconds: true };
			timeLeftElement.textContent = formatTime({ milliseconds: timeLeft }, formatOptions);

			timeLeftElement.dataset.end = readyAt.toString();
			timeLeftElement.dataset.timeSettings = JSON.stringify(formatOptions);
			countdownTimers.push(timeLeftElement);
		} else {
			timeLeftElement.textContent = `Ready`;
		}

		return timeLeftElement;
	}

	function removeTimer() {
		document.querySelector("#virusTimer")?.remove();
	}

	return true;
})();
