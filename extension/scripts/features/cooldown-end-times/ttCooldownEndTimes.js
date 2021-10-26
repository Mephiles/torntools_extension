"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Cooldown End Times",
		"sidebar",
		() => settings.pages.sidebar.cooldownEndTimes,
		null,
		addEndTimes,
		removeEndTimes,
		{
			storage: ["settings.pages.sidebar.cooldownEndTimes"],
		},
		null
	);

	const iconRegex = /1[97]|39|4\d|5[0-3]/m;
	let tooltipObserver;
	async function addEndTimes() {
		const statusIcons = await requireElement("#sidebarroot [class*='status-icons__']");
		statusIcons.addEventListener("mouseover", listenerCallback);

		function listenerCallback(event) {
			if (event.target.closest("li")?.getAttribute("id")?.match(iconRegex)) {
				statusIcons.removeEventListener("mouseover", listenerCallback);
				addTooltipObserver();
			}
		}

		async function addTooltipObserver() {
			const tooltipPortal = await requireElement("body > .ToolTipPortal");
			let tooltipChildren = tooltipPortal.find("[class*='tooltip__']");
			addEndTime(tooltipPortal, tooltipChildren);
			if (!tooltipObserver)
				tooltipObserver = new MutationObserver((mutations) => {
					if (feature.enabled() && mutations.some((mutation) => mutation.target.tagName === "B")) {
						tooltipChildren = tooltipPortal.find("[class*='tooltip__']");
						addEndTime(tooltipPortal, tooltipChildren);
					}
				});
			tooltipObserver.observe(tooltipPortal, { childList: true, subtree: true });
		}

		function addEndTime(tooltipPortal, tooltipChildren) {
			Array.from(tooltipChildren.getElementsByClassName("tt-tooltip-end-times")).forEach((x) => x.remove());
			if (
				["Education", "Racing", "Drug Cooldown", "Booster Cooldown", "Medical Cooldown"].includes(
					tooltipChildren.getElementsByTagName("b")[0].textContent
				)
			) {
				const time =
					Date.now() +
					textToTime(
						tooltipChildren.find("[class*='static-width___']")?.firstChild?.textContent ?? tooltipChildren.find("p:not([class])").textContent
					);
				tooltipPortal.find("[class*='tooltip__']").appendChild(
					document.newElement({
						type: "div",
						class: "tt-tooltip-end-times",
						text: `${formatDate(time, { showYear: true })} ${formatTime(time)}`,
					})
				);
			}
		}
	}

	function removeEndTimes() {
		document.findAll(".tt-tooltip-end-times").forEach((x) => x.remove());
		tooltipObserver.disconnect();
	}
})();
