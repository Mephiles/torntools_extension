requireDatabase().then(() => {
	mapLoaded().then(() => {
		console.log("TT - City");

		if (!settings.pages.city.items && !settings.pages.city.items_value) {
			return;
		}

		let items_container = content.newContainer("City Items", { first: true, id: "tt-city-items", theme: settings.theme, all_rounded: false });

		if (settings.pages.city.items_value) {
			showValueOfItems(items_container, itemlist);
		}

		if (settings.pages.city.items && !shouldDisable()) {
			displayItems(items_container, itemlist);

			if (!settings.pages.city.closed_highlight) {
				doc.find("#map").classList.remove("doctorn-highlight-city-finds");

				items_container.addEventListener("click", () => {
					if (items_container.find(".tt-title").classList.contains("collapsed")) {
						doc.find("#map").classList.remove("doctorn-highlight-city-finds");
						for (let item of doc.findAll("#map .leaflet-marker-pane *[item-id]")) {
							item.classList.remove("cityItem");
						}
					} else {
						doc.find("#map").classList.add("doctorn-highlight-city-finds");
						for (let item of doc.findAll("#map .leaflet-marker-pane *[item-id]")) {
							item.classList.add("cityItem");
						}
					}
				});
			}
		}
	});
});

function mapLoaded() {
	return requireElement("#map .leaflet-marker-pane .highlightItemMarket");
}

function displayItems(container, itemlist) {
	let content = container.find(".content");

	let items = getItemIDsOnMap();

	// Add items to box
	let items_span = doc.new({ type: "div", class: "items" });

	for (let i = 0; i < Object.keys(items).length; i++) {
		let item = Object.keys(items)[i];
		if (!item) break;

		let outerDiv = doc.new({ type: "div", class: "item" });
		let div = doc.new({ type: "div" });
		let a, inner_span;
		if (items[item] === 1) {
			a = doc.new({
				type: "a",
				text: itemlist.items[item].name,
				attributes: { href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=${item}` },
			});
			inner_span = doc.new({ type: "span", text: ` ($${numberWithCommas(itemlist.items[item].market_value)})` });
		} else {
			a = doc.new({
				type: "a",
				text: `${itemlist.items[item].name} (x${items[item]})`,
				attributes: { href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=${item}` },
			});
			inner_span = doc.new({ type: "span", text: ` ($${numberWithCommas(items[item] * itemlist.items[item].market_value)})` });
		}
		outerDiv.addEventListener("mouseenter", () => {
			let cityFindItem = doc.find(`#map img[item-id='${item}']`);
			if (cityFindItem) cityFindItem.classList.add("cityItem_hover");
		});
		outerDiv.addEventListener("mouseleave", () => {
			let cityFindItem = doc.find(`#map img[item-id='${item}']`);
			if (cityFindItem) cityFindItem.classList.remove("cityItem_hover");
		});
		div.appendChild(a);
		div.appendChild(inner_span);
		outerDiv.appendChild(div);
		items_span.appendChild(outerDiv);
	}
	content.appendChild(items_span);
}

function showValueOfItems(container, itemlist) {
	let content = container.find(".content");
	let items = getItemIDsOnMap();

	let total_value = 0;
	for (let id of Object.keys(items)) {
		total_value += parseInt(itemlist.items[id].market_value) * items[id];
	}

	let new_div = doc.new({
		type: "div",
		id: "tt-city-items-value",
		text: `City Items value (${Object.keys(items)
			.map((id) => items[id])
			.reduce((a, b) => (a += b), 0)}): `,
	});
	let value_span = doc.new({ type: "span", text: `$${numberWithCommas(total_value, false)}` });

	if (extensions.doctorn) {
		new_div.style.borderTop = "none";
		new_div.style.marginTop = "0";
		new_div.style.paddingBottom = "5px";
	}

	new_div.appendChild(value_span);
	content.appendChild(new_div);
}

function getItemIDsOnMap() {
	let items = {};

	// Find items
	for (let el of doc.findAll("#map .leaflet-marker-pane *")) {
		let src = el.getAttribute("src");
		if (src.indexOf("https://www.torn.com/images/items/") > -1) {
			let id = src.split("items/")[1].split("/")[0];
			if (id in items) {
				items[id] += 1;
			} else {
				items[id] = 1;
			}
			el.setAttribute("item-id", id);
			if (settings.pages.city.closed_highlight && !shouldDisable()) {
				el.classList.add("cityItem");
			}
		}
	}

	return items;
}
