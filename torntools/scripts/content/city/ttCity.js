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

function mapLoaded() {
	return requireElement("#map .leaflet-marker-pane .highlightItemMarket");
}

function displayItems(container, itemlist) {
	let content = container.find(".content");

	let items = getItemIDsOnMap();

	// Add items to box
	let items_span = doc.new("div");
	items_span.setClass("items");

	let index = 0;
	for (let i = 0; i < 4; i++) {
		let col = doc.new("div");
		col.setClass("column");

		for (let j = 0; j < items.length / 4; j++) {
			let id = items[index];
			if (!id) break;

			let span = doc.new("span");
			let a = doc.new("a");
			a.setAttribute("href", `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${itemlist.items[id].name}`);
			a.innerText = itemlist.items[id].name;
			let inner_span = doc.new("span");
			inner_span.innerText = ` ($${numberWithCommas(itemlist.items[id].market_value)})`;

			span.addEventListener("mouseenter", () => doc.find(`#map img[item-id='${id}']`).classList.add("cityItem_hover"));
			span.addEventListener("mouseleave", () => doc.find(`#map img[item-id='${id}']`).classList.remove("cityItem_hover"));

			span.appendChild(a);
			span.appendChild(inner_span);
			col.appendChild(span);
			index++;
		}

		items_span.appendChild(col);
	}
	content.appendChild(items_span);
}

function showValueOfItems(container, itemlist) {
	let content = container.find(".content");
	let items = getItemIDsOnMap();

	let total_value = 0;
	for (let id of items) {
		total_value += parseInt(itemlist.items[id].market_value);
	}

	let new_div = doc.new("div");
	new_div.id = "tt-city-items-value";
	new_div.innerText = `City Items value (${items.length}): `;
	let value_span = doc.new("span");
	value_span.innerText = `$${numberWithCommas(total_value, false)}`;

	if (extensions.doctorn) {
		new_div.style.borderTop = "none";
		new_div.style.marginTop = "0";
		new_div.style.paddingBottom = "5px";
	}

	new_div.appendChild(value_span);
	content.appendChild(new_div);
}

function getItemIDsOnMap() {
	let items = [];

	// Find items
	for (let el of doc.findAll("#map .leaflet-marker-pane *")) {
		let src = el.getAttribute("src");
		if (src.indexOf("https://www.torn.com/images/items/") > -1) {
			let id = src.split("items/")[1].split("/")[0];
			items.push(id);
			el.setAttribute("item-id", id);
			if (settings.pages.city.closed_highlight && !shouldDisable()) {
				el.classList.add("cityItem");
			}
		}
	}

	return items;
}
