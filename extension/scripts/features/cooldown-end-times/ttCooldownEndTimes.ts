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
			const target = event.target as Element;
			if (!target.closest("li")?.matches("[class*='icon']")) return;
			console.log("DKK listener 2", event.target);

			const iconName = target.getAttribute("aria-label").split(":")[0].trim();
			if (
				![
					"Education",
					"Reading Book",
					"Racing",
					"Drug Cooldown",
					"Booster Cooldown",
					"Medical Cooldown",
					"Organized Crime",
					"Bank Investment",
				].includes(iconName)
			)
				return;

			const tooltip = await requireCondition(() => {
				const tooltip = document.find("body > div[id][data-floating-ui-portal] [class*='tooltip__']");
				const name = tooltip?.getElementsByTagName("b")[0]?.textContent;

				if (name !== iconName) return false;

				return tooltip;
			});

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

	function removeEndTimes(parent: Document | Element = document) {
		[...parent.getElementsByClassName("tt-tooltip-end-times")].forEach((x) => x.remove());
	}
})();
