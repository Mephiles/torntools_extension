"use strict";

(async () => {
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
		async () => {
			await requireElement(".items-list-title");
		},
	);

	function makeSortable() {
		const headers = [...document.find(".items-list-title").findAll(".type-b, .name-b, .cost-b, .item-profit, .tt-travel-market-heading, .stock-b, .circulation-b")];
		const defaultHeader = document.find(".items-list-title .cost-b");

		for (const header of headers) {
			header.classList.add("sortable");

			header.addEventListener("click", (event) => {
				const order = toggleSorting(header);

				headers
					.filter((x) => x !== header)
					.map((x) => x.find("i"))
					.filter((x) => !!x)
					.forEach((x) => x.remove());
				sort(order, header);
			});
		}
/* 
		if (sorting.abroadItems.column !== "default") {
			const header = document.find(`.items-list-title .${sorting.abroadItems.column}`);

			header.appendChild(document.newElement({ type: "i", class: `fas ${sorting.abroadItems.order === "asc" ? "fa-caret-down" : "fa-caret-up"} tt-title-icon-torn` }));
			sort(sorting.abroadItems.order, header);
		}
 */
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
				header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-down tt-title-icon-torn" }));
				return "asc";
			}
		}

		function sort(order, header) {
			const list = document.find(".travel-agency-market .users-list");
			list.classList.add("tt-list-flex");

			if (order === "none") {
				for (const li of list.findAll("li")) {
					if (li.style.order) li.style.order = "";
				}
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
				const sortByValue = item.find(valueSelector).innerText;
				if (!Object.keys(allMappings).includes(sortByValue)) allMappings[sortByValue] = item;
				else if (Array.isArray(allMappings[sortByValue])) allMappings[sortByValue].push(item);
				else allMappings[sortByValue] = [allMappings[sortByValue], item];
			}

			let allValues = (type === "type-b" || type === "name-b") ? Object.keys(allMappings).sort() : Object.keys(allMappings).sort((x, y) => {
				const newX = parseInt(x.replace(/[a-zA-Z\$\:\,]/g, "").trim());
				const newY = parseInt(y.replace(/[a-zA-Z\$\:\,]/g, "").trim());
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
			};
			/* const rows = [...list.childNodes].filter((node) => node.nodeName === "LI");
			if (order === "asc") {
				rows.sort((a, b) => {
					const helper = sortHelper(a.children[0], b.children[0]);

					return helper.a - helper.b;
				});
			} else {
				rows.sort((a, b) => {
					const helper = sortHelper(a.children[0], b.children[0]);
					return helper.b - helper.a;
				});
			}
			rows.forEach((row) => newList.appendChild(row));

			list.parentNode.replaceChild(newList, list);

			ttStorage.change({ sorting: { abroadItems: { column: type, order } } });

			function sortHelper(elementA, elementB) {
				elementA = elementA.find(valueSelector);
				elementB = elementB.find(valueSelector);

				let valueA, valueB;
				if (elementA.hasAttribute("value")) {
					valueA = elementA.getAttribute("value");
					valueB = elementB.getAttribute("value");
				} else {
					valueA = elementA.innerText;
					valueB = elementB.innerText;

					if (elementA.find(".t-show, .wai") && valueA.includes("\n")) {
						valueA = valueA.split("\n").filter((x) => !!x)[1];
						valueB = valueB.split("\n").filter((x) => !!x)[1];
					}
				}

				let a, b;
				if (isNaN(parseFloat(valueA))) {
					if (valueA.includes("$")) {
						a = parseFloat(valueA.replace("$", "").replace(/,/g, ""));
						b = parseFloat(valueB.replace("$", "").replace(/,/g, ""));
					} else {
						a = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
						b = 0;
					}
				} else {
					a = parseFloat(valueA.replaceAll(",", ""));
					b = parseFloat(valueB.replaceAll(",", ""));
				}

				return { a, b };
			} */
		}
	}

	function removeSortable() {
		document.find(".travel-agency-market .users-list").classList.remove("tt-list-flex");
		document.find(".items-list-title").findAll(".fa-caret-up, .fa-caret-down").forEach((x) => x.remove());
	}
})();
