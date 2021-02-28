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
	let items_span = doc.new({type: "div", class: "items"});

	let index = 0;
	for (let i = 0; i < 4; i++) {
		let col = doc.new({type: "div", class: "column"});

		for (let j = 0; j < Object.keys(items).length / 4; j++) {
			let item = Object.keys(items)[index];
			if (!item) break;
			
			let span = doc.new({type: "span", attributes: {style: "display: flex; flex-flow: row;"}});
			let newDiv = doc.new({type: "div", attributes: {style: "margin-left: -12px;"}});
			let canvas, context, image, a;
			if (settings.pages.city.items_images) {
				canvas = doc.new({type: "canvas", class: "torn-item item-plate item-converted", attributes: {role: "img", width: "60", height: "30", style: "opacity: 1;height: fit-content;width: fit-content;"}});
				context = canvas.getContext('2d');
				image = doc.new({type: "img", attributes: {src: itemlist.items[+item].image}});
				image.onload = () => context.drawImage(image, 0, 0, 60, 30);
				span.appendChild(canvas);
			}
			if (items[item] !== "1") {
				a = doc.new({type: "a", text: itemlist.items[item].name, attributes: {href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=${item}`}});
			} else {
				a = doc.new({type: "a", text: `${itemlist.items[item].name} (x${items[item]})`, attributes: {href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=${item}`}});
			}
			let inner_span = doc.new({type: "span", text: ` ($${numberWithCommas(itemlist.items[item].market_value)})`, attributes: {style: "color: #678c00;"}});	
			span.addEventListener("mouseenter", () => {
				let cityFindItem = doc.find(`#map img[item-id='${item}']`);
				if (cityFindItem) cityFindItem.classList.add("cityItem_hover");
			});
			span.addEventListener("mouseleave", () => {
				let cityFindItem = doc.find(`#map img[item-id='${item}']`);
				if (cityFindItem) cityFindItem.classList.remove("cityItem_hover");
			});	
			
			newDiv.appendChild(a);
			newDiv.appendChild(inner_span);
			span.appendChild(newDiv);
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
	for (let id of Object.keys(items)) {
		total_value += parseInt(itemlist.items[id].market_value);
	}

	let new_div = doc.new({type: "div", id: "tt-city-items-value", text: `City Items value (${Object.keys(items).length}): `});
	let value_span = doc.new({type: "span", text: `$${numberWithCommas(total_value, false)}`});

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
