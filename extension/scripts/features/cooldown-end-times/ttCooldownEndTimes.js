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
		null,
	);

	const iconRegex = /1[97]|39|4\d|5[0-3]/m;
	async function addEndTimes() {
		const statusIcons = await requireElement("#sidebarroot [class*='status-icons__']");
		statusIcons.addEventListener("mouseover", listener);
		let tooltipPortal,
			addedListener = true;

		async function listener(event) {
			if (!event.target.closest("li")?.getAttribute("class")?.match(iconRegex)) return;

			if (addedListener) {
				statusIcons.removeEventListener("mouseover", listener);
				addedListener = false;
			}
			if (!tooltipPortal) tooltipPortal = await requireElement("body > .ToolTipPortal");
			new MutationObserver((mutations) => {
				if (
					feature.enabled() &&
					!mutations.some(
						(mut) => mut.addedNodes[0]?.className === "tt-tooltip-end-times" || mut.removedNodes[0]?.className === "tt-tooltip-end-times",
					)
				) {
					removeEndTimes(tooltipPortal);
					const tooltip = tooltipPortal.find("[class*='tooltip__']");
					if (
						[
							"Education",
							"Reading Book",
							"Racing",
							"Drug Cooldown",
							"Booster Cooldown",
							"Medical Cooldown",
							"Organized Crime",
							"Bank Investment",
						].includes(tooltip.getElementsByTagName("b")[0]?.textContent)
					) {
						const time =
							Date.now() +
							textToTime(tooltip.find("[class*='static-width___']")?.firstChild?.textContent ?? tooltip.find("p:not([class])").textContent);
						tooltip.appendChild(
							document.newElement({
								type: "div",
								class: "tt-tooltip-end-times",
								text: `${formatDate(time, { showYear: true })} ${formatTime(time)}`,
							}),
						);
					}
				}
			}).observe(tooltipPortal, { childList: true, subtree: true });
		}
	}

	function removeEndTimes(parent = document) {
		[...parent.getElementsByClassName("tt-tooltip-end-times")].forEach((x) => x.remove());
	}
})();
