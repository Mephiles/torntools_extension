(async () => {
	featureManager.registerFeature(
		"Cooldown End Times",
		"sidebar",
		() => settings.pages.sidebar.cooldownEndTimes,
		null,
		addEndTimes,
		() => removeEndTimes(),
		{
			storage: ["settings.pages.sidebar.cooldownEndTimes"],
		},
		null
	);

	const REQUIRED_TOOLTIP_TITLES = [
		"Education",
		"Reading Book",
		"Racing",
		"Drug Cooldown",
		"Booster Cooldown",
		"Medical Cooldown",
		"Organized Crime",
		"Bank Investment",
	];
	const BAR_TOOLTIP_TITLES = ["Energy increased by", "Nerve increased by", "Happy increased by", "Life increased by"];
	const tooltipObserver = new MutationObserver((mutations: MutationRecord[]) => {
		for (const mutation of mutations) {
			if (!mutation.addedNodes.length) continue;

			mutation.addedNodes.forEach((addedNode) => {
				if (!(addedNode instanceof Element)) return;
				if (!addedNode.getAttribute("id") || !addedNode.hasAttribute("data-floating-ui-portal")) return;

				const tooltipElement = addedNode,
					tooltipTitleElement = tooltipElement.getElementsByTagName("b")?.[0],
					tooltipTitle = tooltipTitleElement?.textContent;
				if (!tooltipTitle || (!REQUIRED_TOOLTIP_TITLES.includes(tooltipTitle) && BAR_TOOLTIP_TITLES.every((title) => !tooltipTitle.startsWith(title))))
					return;

				const timeElement =
					tooltipElement.find("[class*='static-width___']")?.firstChild ?? // For cooldown icon tooltips.
					tooltipElement.find("p:not([class])") ??
					tooltipElement.find("p").lastChild; // For energy, nerve, happy, and life bar tooltips.
				if (!timeElement) return;

				[...tooltipElement.getElementsByClassName("tt-tooltip-end-times")].forEach((x) => x.remove());
				const time = Date.now() + textToTime(timeElement.textContent);
				tooltipTitleElement.parentElement.appendChild(
					document.newElement({
						type: "div",
						class: "tt-tooltip-end-times",
						text: `${formatDate(time, { showYear: true })} ${formatTime(time)}`,
					})
				);
			});
		}
	});

	async function addEndTimes() {
		await requireElement("#sidebarroot [class*='status-icons__']");
		tooltipObserver.observe(document.body, { childList: true });
	}

	async function removeEndTimes() {
		[...document.getElementsByClassName("tt-tooltip-end-times")].forEach((x) => x.remove());
		tooltipObserver.disconnect();
	}
})();
