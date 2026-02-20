(async () => {
	if (!getPageStatus().access) return;
	const factionPage = getPage() === "factions";
	if (factionPage && !isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Energy Warning",
		"items",
		() => settings.pages.items.energyWarning,
		initialiseListener,
		undefined,
		removeWarning,
		{
			storage: ["settings.pages.items.energyWarning"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	function initialiseListener() {
		document.addEventListener("click", (event) => {
			if (!feature.enabled() || !isElement(event.target)) return;

			let item: HTMLElement | undefined;
			if (factionPage) item = event.target.closest("li");
			else item = event.target.closest("li[data-category]");

			if (item) addWarning(item);
		});
	}

	async function addWarning(item: HTMLElement) {
		findAllElements(".tt-energy-warning", item).forEach((x) => x.remove());

		const message: Element = await requireElement(".confirm-wrap, .use-act", { parent: item });
		if (!message) return;

		const received = getItemEnergy(factionPage ? item.querySelector<HTMLElement>(".img-wrap").dataset.itemid : item.dataset.item);
		if (!received) return;

		const [current] = getUserEnergy();
		if (received + current <= 1000) return;

		const warning = elementBuilder({
			type: "div",
			class: "tt-energy-warning",
			text: "Warning! Using this item increases your energy to over 1000!",
		});

		if (factionPage) message.querySelector(".confirm").insertAdjacentElement("afterend", warning);
		else message.querySelector(".act #wai-action-desc").appendChild(warning);

		message.querySelector<HTMLElement>("a.next-act").addEventListener("click", clickListener, { capture: true, once: true });
	}

	function clickListener(event: MouseEvent) {
		if (!confirm("Are you sure to use this item ? It will get you to more than 1000E.")) {
			event.stopPropagation();
			event.stopImmediatePropagation();
		}
	}

	function removeWarning() {
		findAllElements(".tt-energy-warning").forEach((x) => x.remove());
		findAllElements("a.next-act").forEach((x) => x.removeEventListener("click", clickListener, { capture: true }));
	}
})();
