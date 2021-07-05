"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"City Items",
		"city",
		() => settings.pages.city.items,
		null,
		showHighlight,
		removeHighlight,
		{
			storage: ["settings.pages.city.items"],
		},
		null
	);

	let hasContainer = false;

	async function showHighlight() {
		if (hasContainer) return;

		await requireElement("#map .highlightItemMarket");

		hasContainer = true;

		// Show container
		const { content, options } = createContainer("City Items", { class: "mt10", alwaysContent: true, nextElement: document.find("#tab-menu") });

		const items = getAllItems();
		handleHighlight();
		if (hasAPIData()) showValue();
		showItemList();

		function getAllItems() {
			const items = [];

			for (const marker of document.findAll("#map .leaflet-marker-icon[src*='https://www.torn.com/images/items/']")) {
				const id = marker.src.split("items/")[1].split("/")[0];

				marker.classList.add("city-item");
				marker.dataset.id = id;

				items.push(id);
			}

			return items;
		}

		function handleHighlight() {
			const checkbox = createCheckbox("Highlight items");

			highlight(filters.city.highlightItems);

			checkbox.setChecked(filters.city.highlightItems);
			checkbox.onChange(() => {
				const state = checkbox.isChecked();

				highlight(state);
				ttStorage.change({ filters: { city: { highlightItems: state } } });
			});

			options.appendChild(checkbox.element);

			function highlight(state) {
				const map = document.find("#map");

				if (state) map.classList.add("highlight-items");
				else map.classList.remove("highlight-items");
			}
		}

		function showValue() {
			const totalValue = items
				.map((id) => torndata.items[id])
				.filter((item) => !!item)
				.map((item) => item.market_value)
				.filter((value) => !!value)
				.totalSum();
			const itemCount = items.length;

			content.appendChild(
				document.newElement({
					type: "div",
					class: "tt-city-total",
					children: [
						document.newElement({ type: "span", class: "tt-city-total-text", text: `Item Value (${itemCount}): ` }),
						document.newElement({ type: "span", class: "tt-city-total-value", text: formatNumber(totalValue, { currency: true }) }),
					],
				})
			);
		}

		function showItemList() {
			const listElement = document.newElement({ type: "div", class: "tt-city-items hide-collapse" });

			const type = "text";
			switch (type) {
				case "text":
					generateText();
					break;
			}

			content.appendChild(listElement);

			function generateText() {
				let element;
				if (items.length > 0) {
					element = document.newElement({ type: "p", html: `There are <strong>${items.length}</strong> items in the city: ` });

					const _items = items.map((id) => ({ id, name: torndata.items[id].name }));
					if (items.length === 1) {
						element.appendChild(createItemElement(_items[0]));
					} else {
						const last = _items.splice(-1)[0];

						for (const item of _items) {
							element.appendChild(createItemElement(item));
							element.appendChild(document.createTextNode(", "));
						}
						element.lastChild.remove();

						element.appendChild(document.createTextNode(" and "));
						element.appendChild(createItemElement(last));
					}

					element.appendChild(document.createTextNode("."));
				} else {
					element = document.newElement({ type: "p", text: "There are no items in the city." });
				}
				listElement.appendChild(element);

				function createItemElement({ id, name }) {
					// noinspection JSUnusedGlobalSymbols
					return document.newElement({
						type: "span",
						text: name,
						events: {
							mouseenter() {
								for (const item of document.findAll(`.city-item[data-id="${id}"]`)) {
									item.classList.add("force-hover");
								}
							},
							mouseleave() {
								for (const item of document.findAll(`.city-item[data-id="${id}"].force-hover`)) {
									item.classList.remove("force-hover");
								}
							},
						},
					});
				}
			}
		}
	}

	function removeHighlight() {
		removeContainer("City Items");

		for (const item of document.findAll(".city-item")) {
			item.classList.remove("city-item");

			delete item.dataset.id;
		}

		const map = document.find("#map");
		if (map) map.classList.remove("highlight-items");

		hasContainer = false;
	}
})();
