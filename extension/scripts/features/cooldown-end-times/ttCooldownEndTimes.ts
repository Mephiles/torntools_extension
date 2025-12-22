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

	async function addEndTimes() {
		const statusIcons = await requireElement("#sidebarroot [class*='status-icons__']");
		const { mobile, tablet } = await checkDevice();
		const isTouchDevice = mobile || tablet;

		statusIcons.addEventListener(!isTouchDevice ? "mouseover" : "click", listener);

		async function listener(event: MouseEvent) {
			if (!(event.target as HTMLElement).closest("li")?.matches("[class*='icon']")) return;

			const tooltip = ((await requireElement("body > div[id][data-floating-ui-portal]")) as Element).find("[class*='tooltip__']");
			const tooltipName = tooltip.getElementsByTagName("b")[0]?.textContent;
			if (
				["Education", "Reading Book", "Racing", "Drug Cooldown", "Booster Cooldown", "Medical Cooldown", "Organized Crime", "Bank Investment"].includes(
					tooltipName
				)
			) {
				const timeElement = tooltip.find("[class*='static-width___']")?.firstChild ?? tooltip.find("p:not([class])");
				if (!timeElement) return;

				removeEndTimes(tooltip);
				const time = Date.now() + textToTime(timeElement.textContent);
				tooltip.appendChild(
					document.newElement({
						type: "div",
						class: "tt-tooltip-end-times",
						text: `${formatDate(time, { showYear: true })} ${formatTime(time)}`,
					})
				);
			}
		}
	}

	function removeEndTimes(parent: Document | Element = document) {
		[...parent.getElementsByClassName("tt-tooltip-end-times")].forEach((x) => x.remove());
	}
})();
