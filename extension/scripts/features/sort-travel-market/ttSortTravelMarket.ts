(async () => {
	if (!getPageStatus().access) return;
	if (!isAbroad()) return;

	const feature = featureManager.registerFeature(
		"Sort Travel Market",
		"travel",
		() => settings.pages.travel.sortable,
		initialise,
		makeSortable,
		removeSortable,
		{
			storage: ["settings.pages.travel.sortable"],
		},
		null
	);

	let currentSort: { order: "none" | "asc" | "desc"; header: HTMLElement } | null = null;

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.TRAVEL_ABROAD__SHOP_LOAD].push(() => {
			if (!feature.enabled()) return;

			if (currentSort) {
				sort(currentSort.order, currentSort.header);
			}
		});
	}

	async function makeSortable() {
		const itemsListTitle = await requireElement("[class*='stockTableWrapper___'] [class*='stockHeader___']");
		await requireElement("[data-tt-content-type='item']", { parent: itemsListTitle });
		const headers = [
			...itemsListTitle.findAll(
				[
					"[data-tt-content-type='name']",
					"[data-tt-content-type='type']",
					"[data-tt-content-type='cost']",
					"[data-tt-content-type='profit']",
					"[data-tt-content-type='stock']",
				].join(", ")
			),
		];

		for (const header of headers) {
			header.classList.add("sortable");

			header.addEventListener("click", () => {
				const order = toggleSorting(header);

				headers
					.filter((x) => x !== header)
					.map((x) => x.find("i"))
					.filter((x) => !!x)
					.forEach((x) => x.remove());
				sort(order, header);
			});
		}

		if (settings.sorting.abroad.column) {
			if (settings.sorting.abroad.column === "profit") {
				await requireElement(`[class*='row___'] [data-tt-content-type='${settings.sorting.abroad.column}']`);
			}

			const header = await requireElement(`[class*='stockHeader___'] [data-tt-content-type='${settings.sorting.abroad.column}']`);
			if (!header) await sort("none", undefined);
			else {
				header.appendChild(
					document.newElement({
						type: "i",
						class: `fa-solid ${settings.sorting.abroad.order === "asc" ? "fa-caret-down" : "fa-caret-up"}`,
					})
				);
				await sort(settings.sorting.abroad.order, header);
			}
		}

		function toggleSorting(header: HTMLElement) {
			const icon = header.find("i");
			if (icon) {
				if (icon.classList.contains("fa-caret-down")) {
					icon.classList.remove("fa-caret-down");
					icon.classList.add("fa-caret-up");
					return "desc";
				} else {
					icon.remove();
					return "none";
				}
			} else {
				header.appendChild(document.newElement({ type: "i", class: "fa-solid fa-caret-down" }));
				return "asc";
			}
		}
	}

	async function sort(order: "none" | "asc" | "desc", header: HTMLElement) {
		const list = await requireElement("[class*='stockTableWrapper___'] > ul");
		list.classList.add("tt-list-flex");
		await requireElement("[class*='stockTableWrapper___'] [class*='row___'] [data-tt-content-type]");

		if (order === "none") {
			for (const li of list.findAll("li")) {
				if (li.style.order) li.style.order = "";
			}
			await ttStorage.change({ settings: { sorting: { abroad: { column: "", order: "none" } } } });
			return;
		}

		const type: string = header.dataset.ttContentType;
		const valueSelector: string = `[data-tt-content-type='${type}']`;

		let allMappings = {};
		for (const item of list.findAll("li")) {
			const sortByValue = item.find(valueSelector).textContent;
			if (!Object.keys(allMappings).includes(sortByValue)) allMappings[sortByValue] = item;
			else if (Array.isArray(allMappings[sortByValue])) allMappings[sortByValue].push(item);
			else allMappings[sortByValue] = [allMappings[sortByValue], item];
		}

		let allValues =
			type === "type" || type === "name"
				? Object.keys(allMappings).sort()
				: Object.keys(allMappings).sort((x, y) => {
						const newX = parseInt(x.replace(/[a-zA-Z$:,]/g, "").trim());
						const newY = parseInt(y.replace(/[a-zA-Z$:,]/g, "").trim());
						if (newX >= newY) return -1;
						else if (newX < newY) return 1;
						return 0;
					});
		if (order === "desc") allValues.reverse();

		for (let i = 0; i < allValues.length; i++) {
			const value = allMappings[allValues[i]];
			if (Array.isArray(value)) {
				for (const li of value) {
					li.style.order = i + 1;
				}
			} else {
				value.style.order = i + 1;
			}
		}
		await ttStorage.change({ settings: { sorting: { abroad: { column: type, order: order } } } });
	}

	function removeSortable() {
		document.find("[class*='stockTableWrapper___'] > ul")?.classList.remove("tt-list-flex");
		document
			.find(".items-list-title")
			?.findAll(".fa-caret-up, .fa-caret-down")
			.forEach((x) => x.remove());
	}
})();
