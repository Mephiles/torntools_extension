"use strict";

(async () => {
	if (!getPageStatus().access) return;

	if (!isAbroad()) return;

	featureManager.registerFeature(
		"Sort Market",
		"travel",
		() => settings.pages.travel.sortable,
		null,
		makeSortable,
		removeSortable,
		{
			storage: ["settings.pages.travel.sortable"],
		},
		null
	);

	async function makeSortable() {
		const itemsListTitle = await requireElement(".items-list-title");
		const headers = [...itemsListTitle.findAll(".type-b, .name-b, .cost-b, .item-profit, .tt-travel-market-heading, .stock-b, .circulation-b")];

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
			const header = document.find(`.items-list-title .${settings.sorting.abroad.column}`);
			if (!header) await sort("none", undefined);
			else {
				header.appendChild(
					document.newElement({ type: "i", class: `fas ${settings.sorting.abroad.order === "asc" ? "fa-caret-down" : "fa-caret-up"}` })
				);
				await sort(settings.sorting.abroad.order, header);
			}
		}

		function toggleSorting(header) {
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
				header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-down" }));
				return "asc";
			}
		}

		async function sort(order, header) {
			const list = document.find(".travel-agency-market .users-list");
			list.classList.add("tt-list-flex");

			if (order === "none") {
				for (const li of list.findAll("li")) {
					if (li.style.order) li.style.order = "";
				}
				await ttStorage.change({ settings: { sorting: { abroad: { column: "", order: "none" } } } });
				return;
			}
			let valueSelector, type;
			if (header.classList.contains("type-b")) {
				type = "type-b";
				valueSelector = ".type";
			} else if (header.classList.contains("name-b")) {
				type = "name-b";
				valueSelector = ".name";
			} else if (header.classList.contains("cost-b")) {
				type = "cost-b";
				valueSelector = ".cost .c-price";
			} else if (header.classList.contains("item-profit")) {
				type = "item-profit";
				valueSelector = ".tt-travel-market-cell";
			} else if (header.classList.contains("stock-b")) {
				type = "stock-b";
				valueSelector = ".stock";
			} else if (header.classList.contains("circulation-b")) {
				type = "circulation-b";
				valueSelector = ".circulation";
			} else if (header.classList.contains("tt-travel-market-heading")) {
				type = "tt-travel-market-heading";
				valueSelector = ".tt-travel-market-cell";
			}

			let allMappings = {};
			for (const item of list.findAll("li")) {
				const sortByValue = item.find(valueSelector).textContent;
				if (!Object.keys(allMappings).includes(sortByValue)) allMappings[sortByValue] = item;
				else if (Array.isArray(allMappings[sortByValue])) allMappings[sortByValue].push(item);
				else allMappings[sortByValue] = [allMappings[sortByValue], item];
			}

			let allValues =
				type === "type-b" || type === "name-b"
					? Object.keys(allMappings).sort()
					: Object.keys(allMappings).sort((x, y) => {
							const newX = parseInt(x.replace(/[a-zA-Z$:,]/g, "").trim());
							const newY = parseInt(y.replace(/[a-zA-Z$:,]/g, "").trim());
							if (newX >= newY) return -1;
							else if (newX < newY) return 1;
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
	}

	function removeSortable() {
		document.find(".travel-agency-market .users-list")?.classList.remove("tt-list-flex");
		document
			.find(".items-list-title")
			?.findAll(".fa-caret-up, .fa-caret-down")
			.forEach((x) => x.remove());
	}
})();
