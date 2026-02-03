(async () => {
	if (!getPageStatus().access) return;

	const featureFlowers = featureManager.registerFeature(
		"Missing Flowers",
		"items",
		() => settings.pages.items.missingFlowers,
		initialiseFlowers,
		() => requireItemsLoaded().then(showFlowers),
		removeFlowers,
		{
			storage: ["settings.pages.items.missingFlowers"],
		},
		async () => {
			if (!hasAPIData() || !settings.apiUsage.user.inventory) return "No API access!";

			await checkDevice();
			return true;
		}
	);
	const featurePlushies = featureManager.registerFeature(
		"Missing Plushies",
		"items",
		() => settings.pages.items.missingPlushies,
		initialisePlushies,
		() => requireItemsLoaded().then(showPlushies),
		removePlushies,
		{
			storage: ["settings.pages.items.missingPlushies"],
		},
		async () => {
			if (!hasAPIData() || !settings.apiUsage.user.inventory) return "No API access!";

			await checkDevice();
			return true;
		}
	);

	function initialiseFlowers() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(({ tab }) => {
			if (!featureFlowers.enabled() || tab !== "Flower") {
				removeFlowers();
				return;
			}

			showFlowers();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(({ name }) => {
			if (!featureFlowers.enabled()) return;

			if (name === "Item Values") showMarketValues();
			else if (name === "Market Icons") showMarketIcons();
		});
	}

	function initialisePlushies() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(({ tab }) => {
			if (!featurePlushies.enabled() || tab !== "Plushie") {
				removePlushies();
				return;
			}

			showPlushies();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.FEATURE_ENABLED].push(({ name }) => {
			if (!featurePlushies.enabled()) return;

			if (name === "Item Values") showMarketValues();
			else if (name === "Market Icons") showMarketIcons();
		});
	}

	async function showFlowers() {
		await show("needed-flowers", "#flowers-items", SETS.FLOWERS);
	}

	function removeFlowers() {
		if (document.find("#needed-flowers")) document.find("#needed-flowers").remove();
	}

	async function showPlushies() {
		await show("needed-plushies", "#plushies-items", SETS.PLUSHIES);
	}

	function removePlushies() {
		if (document.find("#needed-plushies")) document.find("#needed-plushies").remove();
	}

	async function show(id: string, selector: string, items: SetItem[]) {
		if (document.find(`#${id}`)) document.find(`#${id}`).remove();

		const currentItemsElements = document.findAll(`#category-wrap > ${selector}[aria-expanded='true'] > li[data-item]`);
		if (!currentItemsElements.length || currentItemsElements.length === items.length) return;

		const currentItems = currentItemsElements.map((x) => parseInt(x.dataset.item));
		const needed = items.filter((x) => !currentItems.some((y) => x.id === y)).sort((a, b) => a.name.localeCompare(b.name));
		if (needed.length <= 0) return;

		const wrapper = elementBuilder({ type: "div", id: id });
		let isFirst = true;
		for (const item of needed) {
			const isLast = needed.indexOf(item) === needed.length - 1;

			const missingItem = elementBuilder({
				type: "div",
				class: "needed-item",
				children: [
					elementBuilder({
						type: "img",
						attributes: { src: `https://www.torn.com/images/items/${item.id}/large.png`, alt: item.name },
					}),
					elementBuilder({ type: "span", text: item.name }),
				],
				dataset: { id: item.id, name: item.name, category: item.category },
			});

			wrapper.appendChild(missingItem);

			addItemValue(missingItem);
			await addMarketIcon(missingItem, isFirst, isLast);

			isFirst = false;
		}
		document.find(".main-items-cont-wrap").insertAdjacentElement("afterend", wrapper);
	}

	function addItemValue(missingItem: HTMLElement) {
		if (!settings.pages.items.values) return;
		if (!hasAPIData()) return;

		missingItem.find(":scope > span").insertAdjacentElement(
			"afterend",
			elementBuilder({
				type: "span",
				class: "tt-item-price",
				text: `${formatNumber(torndata.items[parseInt(missingItem.dataset.id)].market_value, { currency: true })}`,
			})
		);
	}

	function showMarketValues() {
		for (const missingItem of document.findAll(".needed-item")) {
			addItemValue(missingItem);
		}
	}

	async function addMarketIcon(missingItem: HTMLElement, first: boolean, last: boolean) {
		if (!settings.pages.items.marketLinks) return;
		if (mobile) return;
		if (missingItem.find(".market-link")) return;

		let parent = missingItem.find(".outside-actions");
		if (!parent) {
			parent = elementBuilder({ type: "div", class: `outside-actions ${first ? "first-action" : ""} ${last ? "last-action" : ""}` });

			missingItem.appendChild(parent);
		}

		const id = parseInt(missingItem.dataset.id);
		const { name, category } = missingItem.dataset;

		parent.appendChild(
			elementBuilder({
				type: "div",
				class: "market-link",
				children: [
					elementBuilder({
						type: "a",
						href: `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${id}&itemName=${name}&itemType=${category}`,
						children: [elementBuilder({ type: "i", class: "cql-item-market", attributes: { title: "Open Item Market" } })],
					}),
				],
			})
		);
	}

	function showMarketIcons() {
		const items = [...document.findAll(".needed-item")];
		let isFirst = true;
		for (const missingItem of items) {
			const isLast = items.indexOf(missingItem) === items.length - 1;

			addMarketIcon(missingItem, isFirst, isLast);
		}
	}
})();
