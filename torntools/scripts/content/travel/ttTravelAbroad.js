const country_dict = {  // time = minutes
	"argentina": {
		time: 167,
		cost: 21000
	},
	"canada": {
		time: 41,
		cost: 9000
	},
	"cayman islands": {
		time: 35,
		cost: 10000
	},
	"china": {
		time: 242,
		cost: 35000
	},
	"hawaii": {
		time: 134,
		cost: 11000
	},
	"japan": {
		time: 225,
		cost: 32000
	},
	"mexico": {
		time: 26,
		cost: 6500
	},
	"south africa": {
		time: 297,
		cost: 40000
	},
	"switzerland": {
		time: 175,
		cost: 27000
	},
	"uae": {
		time: 271,
		cost: 32000
	},
	"united kingdom": {
		time: 159,
		cost: 18000
	}
}

window.addEventListener('load', async () => {
	console.log("TT - Travel (abroad)");

	// Flying page
	const page = getSearchParameters().get("page");
	if (await isFlying()) {
		// Landing time
		if (doc.find('.flight-info .destination-title')) {
			const landDate = new Date(userdata.travel.timestamp * 1000) - new Date() < 0 ? 'N/A' : new Date(userdata.travel.timestamp * 1000);
			let hours, minutes, seconds;

			if (landDate !== 'N/A') [hours, minutes, seconds] = [landDate.getHours(), landDate.getMinutes(), landDate.getSeconds()];

			const landingTimeDiv = doc.new({ type: 'div', attributes: { style: 'text-align: center;' } });
			const landingTimeDescription = doc.new({ type: 'span', class: 'description', text: `Landing at ${landDate === 'N/A' ? 'N/A' : formatTime([hours, minutes, seconds], settings.format.time)}` });
			landingTimeDiv.appendChild(landingTimeDescription);
			doc.find('.flight-info').insertBefore(landingTimeDiv, doc.find('.flight-info .destination-title').nextElementSibling);
		}

		// Travel Table link
		let on_travel_table = page === "travel_table";

		let link = doc.new({
			type: "a",
			class: "t-clear h c-pointer m-icon line-h24 right last",
			attributes: {
				href: on_travel_table ? "https://www.torn.com/index.php" : "https://www.torn.com/index.php?page=travel_table",
				role: "button",
				"aria-labelledby": "travel-table"
			}
		});
		let icon = doc.new({ type: "i", class: "fas fa-plane" });
		let span = doc.new({ type: "span", text: on_travel_table ? "Home" : "Travel Table" });
		link.appendChild(icon);
		link.appendChild(span);

		doc.find("#top-page-links-list a.last").classList.remove("last");
		doc.find("#top-page-links-list").insertBefore(link, doc.find("#top-page-links-list .links-footer"));

		if (on_travel_table) { travelTableScript(); }
	}

	// Abroad
	if (await isAbroad()) {
		if (page === null || page === "travel_table") {
			if (settings.pages.travel.profits) {
				displayItemProfits(itemlist.items);
			}
			addFillMaxButtons();
			if (!doc.find(".info-msg-cont.red")) {
				updateYATAPrices();
			}
		} else if (page === "people") {
			requirePlayerList(".users-list").then(async () => {
				await showUserInfo();

				let list = doc.find(".users-list");
				let title = list.previousElementSibling;

				addFilterToTable(list, title);
			});
		}
	}
});

function displayItemProfits(itemlist) {
	let market = doc.find(".travel-agency-market");

	if (!market) {
		console.log("No market");
		return;
	}

	// Table heading
	let headings = market.find(".items-list-title");
	let profit_heading = doc.new("div");
	profit_heading.innerText = "Profit";
	profit_heading.setClass("tt-travel-market-heading title-green");

	headings.insertBefore(profit_heading, headings.find(".stock-b"));

	// Table content
	let rows = doc.findAll(".users-list>li");
	for (let row of rows) {
		let id = parseInt(row.find(".item img").getAttribute("src").split("items/")[1].split("/")[0]);
		let market_price = parseInt(itemlist[id].market_value);
		let buy_price = parseInt(row.find(".cost .c-price").innerText.replace("$", "").replace(/,/g, ""));
		let profit = parseInt(market_price - buy_price);

		let span = doc.new("span");
		span.setClass("tt-travel-market-cell")
		let inner_span = doc.new("span");
		inner_span.innerText = `${profit < 0 ? "-$" : "+$"}${numberWithCommas(Math.abs(profit))}`;

		// let triangle_div = doc.new("div");
		// triangle_div.setClass("tt-travel-price-indicator");

		if (buy_price > market_price) {
			span.style.color = "#de0000";
			// triangle_div.style.borderTop = "8px solid #de0000";
		} else if (buy_price < market_price) {
			span.style.color = "#00a500";
			// triangle_div.style.borderBottom = "8px solid #00a500"
		}

		// inner_span.appendChild(triangle_div);
		span.appendChild(inner_span);
		row.find(".item-info-wrap").insertBefore(span, row.find(".item-info-wrap").find(".stock"));
	}
}

function addFillMaxButtons() {
	let market = doc.find(".travel-agency-market");

	if (!market) {
		console.log("No market");
		return;
	}

	for (let buy_btn of market.findAll(".buy")) {
		let max_span = doc.new({ type: "span", text: "fill max", class: "tt-max-buy bold" });
		buy_btn.parentElement.appendChild(max_span);

		max_span.addEventListener("click", event => {
			event.stopPropagation();

			let max = parseInt(buy_btn.parentElement.parentElement.find(".stck-amount").innerText.replace(/,/g, ""));
			let price = parseInt(buy_btn.parentElement.parentElement.find(".c-price").innerText.replace(/,/g, "").replace("$", ""));
			let user_money = doc.find(".user-info .msg .bold:nth-of-type(2)").innerText.replace(/,/g, "").replace("$", "");
			let bought = parseInt(doc.find(".user-info .msg .bold:nth-of-type(3)").innerText);
			let limit = parseInt(doc.find(".user-info .msg .bold:nth-of-type(4)").innerText) - bought;

			max = max > limit ? limit : max;
			max = Math.floor(user_money / price) < max ? Math.floor(user_money / price) : max;

			console.log(buy_btn.parentElement.find("input[name='amount']"))
			buy_btn.parentElement.find("input[name='amount']").value = max;
			buy_btn.parentElement.find("input[name='amount']").setAttribute("value", max);

			// for value to be accepted
			buy_btn.parentElement.find("input[name='amount']").dispatchEvent(new Event("blur"));
		});
	}

}

function updateYATAPrices() {
	console.log("Updating YATA prices");

	let post_data = {
		"client": "TornTools",
		"version": chrome.runtime.getManifest().version,
		"author_name": "Mephiles",
		"author_id": 2087524,
		"country": getCountryName(),
		"items": []
	}

	// Table content
	let rows = doc.findAll(".users-list>li");
	for (let row of rows) {
		let id = parseInt(row.find(".item img").getAttribute("src").split("items/")[1].split("/")[0]);
		let quantity = parseInt(row.find(".stck-amount").innerText.replace(/,/g, ""));
		let price = parseInt(row.find(".cost .c-price").innerText.replace("$", "").replace(/,/g, ""));

		// post_data.items[id] = {quantity: quantity, cost: price}
		post_data.items.push({
			id: id,
			quantity: quantity,
			cost: price
		});
	}

	console.log("POST DATA", post_data);
	fetchRelay('yata', { section: `bazaar/abroad/import`, method: 'POST', postData: post_data })
		.then(result => {
			console.log("yata PUSH", result);
		})
		.catch(err => {
			console.log("ERROR", err);
		})

	function getCountryName() {
		return doc.find("#skip-to-content").innerText.slice(0, 3).toLowerCase();
	}
}

function addFilterToTable(list, title) {
	let filter_container = content.newContainer("Filters", {
		id: "tt-player-filter",
		class: "filter-container",
		next_element: title
	}).find(".content");
	filter_container.innerHTML = `
        <div class="filter-header">
            <div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">Y</span> users</div>
        </div>
        <div class="filter-content ${mobile ? "tt-mobile" : ""}">
            <div class="filter-wrap" id="activity-filter">
                <div class="filter-heading">Activity</div>
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="online">Online</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="idle">Idle</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="offline">Offline</div>
                </div>
			</div>
			<div class='filter-wrap' id='special-filter'>
				<div class='filter-heading'>Special</div>
				<div class='filter-multi-wrap ${mobile ? 'tt-mobile' : ''}'>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='isfedded-yes'>N:<input type='checkbox' value='isfedded-no'>Fedded</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='newplayer-yes'>N:<input type='checkbox' value='newplayer-no'>New Player</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='onwall-yes'>N:<input type='checkbox' value='onwall-no'>On Wall</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='incompany-yes'>N:<input type='checkbox' value='incompany-no'>In Company</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='infaction-yes'>N:<input type='checkbox' value='infaction-no'>In Faction</div>
					<div class='tt-checkbox-wrap'>Y:<input type='checkbox' value='isdonator-yes'>N:<input type='checkbox' value='isdonator-no'>Is Donator</div>
				</div>
			</div>
            <div class="filter-wrap" id="status-filter">
                <div class="filter-heading">Status</div>
                <div class="filter-multi-wrap ${mobile ? 'tt-mobile' : ''}">
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="okay">Okay</div>
                    <div class="tt-checkbox-wrap"><input type="checkbox" value="hospital">Hospital</div>
                </div>
            </div>
            <div class="filter-wrap" id="level-filter">
                <div class="filter-heading">Level</div>
                <div id="tt-level-filter" class="filter-slider"></div>
                <div class="filter-slider-info"></div>
            </div>
        </div>
    `;

	// Initializing
	let level_start = filters.overseas.level[0] || 0;
	let level_end = filters.overseas.level[1] || 100;

	// Special
	for (let key in filters.overseas.special) {
		switch (filters.overseas.special[key]) {
			case 'yes':
				filter_container.find(`#special-filter input[value='${key}-yes']`).checked = true;
				break;
			case 'no':
				filter_container.find(`#special-filter input[value='${key}-no']`).checked = true;
				break;
			case 'both':
				filter_container.find(`#special-filter input[value='${key}-yes']`).checked = true;
				filter_container.find(`#special-filter input[value='${key}-no']`).checked = true;
				break;
			default:
				filter_container.find(`#special-filter input[value='${key}-yes']`).checked = true;
				filter_container.find(`#special-filter input[value='${key}-no']`).checked = true;
				break;
		}
	}

	// Level slider
	let level_slider = filter_container.find('#tt-level-filter');
	noUiSlider.create(level_slider, {
		start: [level_start, level_end],
		step: 1,
		connect: true,
		range: {
			'min': 0,
			'max': 100
		}
	});

	let level_slider_info = level_slider.nextElementSibling;
	level_slider.noUiSlider.on('update', values => {
		values = values.map(x => parseInt(x));
		level_slider_info.innerHTML = `Level: ${values.join(' - ')}`;
	});

	// Event listeners
	for (let checkbox of filter_container.findAll(".tt-checkbox-wrap input")) {
		checkbox.onclick = applyFilters;
	}
	for (let dropdown of filter_container.findAll("select")) {
		dropdown.onchange = applyFilters;
	}
	let filter_observer = new MutationObserver(mutations => {
		for (let mutation of mutations) {
			if (mutation.type === "attributes"
				&& mutation.attributeName === "aria-valuenow"
				&& (hasClass(mutation.target, "noUi-handle-lower") || hasClass(mutation.target, "noUi-handle-upper"))) {
				applyFilters();
			}
		}
	});
	filter_observer.observe(filter_container, { attributes: true, subtree: true });

	// Page changing
	doc.addEventListener("click", event => {
		if (event.target.classList && !event.target.classList.contains("gallery-wrapper") && hasParent(event.target, { class: "gallery-wrapper" })) {
			console.log("click");
			setTimeout(() => {
				requirePlayerList(".users-list").then(() => {
					console.log("loaded");
					// populateFactions();
					applyFilters();
				});
			}, 300);
		}
	});

	// Initializing
	for (let state of filters.overseas.activity) {
		doc.find(`#activity-filter input[value='${state}']`).checked = true;
	}
	for (let state of filters.overseas.status) {
		doc.find(`#status-filter input[value='${state}']`).checked = true;
	}
	// if(filters.overseas.faction.default){
	//     doc.find(`#faction-filter option[value='${filters.overseas.faction}']`).selected = true;
	// }

	// populateFactions();
	applyFilters();

	function applyFilters() {
		let activity = []
		let status = []
		let special = {}
		// let faction = ``;
		// let time = []
		let level = []

		// Activity
		for (let checkbox of doc.findAll("#activity-filter .tt-checkbox-wrap input:checked")) {
			activity.push(checkbox.getAttribute("value"));
		}
		// Status
		for (let checkbox of doc.findAll("#status-filter .tt-checkbox-wrap input:checked")) {
			status.push(checkbox.getAttribute("value"));
		}
		// Special
		for (let key in filters.overseas.special) {
			if (doc.find(`#tt-player-filter #special-filter input[value='${key}-yes']`).checked && doc.find(`#tt-player-filter #special-filter input[value='${key}-no']`).checked) {
				special[key] = 'both';
			} else if (doc.find(`#tt-player-filter #special-filter input[value='${key}-yes']`).checked) {
				special[key] = 'yes';
			} else if (doc.find(`#tt-player-filter #special-filter input[value='${key}-no']`).checked) {
				special[key] = 'no';
			} else {
				special[key] = 'both';
			}
		}
		// Level
		level.push(parseInt(doc.find("#level-filter .noUi-handle-lower").getAttribute("aria-valuenow")));
		level.push(parseInt(doc.find("#level-filter .noUi-handle-upper").getAttribute("aria-valuenow")));

		// Filtering
		for (let li of list.findAll(":scope>li")) {
			if (li.classList.contains("tt-user-info") || li.classList.contains("tt-userinfo-container")) continue;

			showRow(li);

			// Level
			let player_level = parseInt(li.find(".level").innerText.trim().replace("LEVEL:", "").trim());
			if (!(level[0] <= player_level && player_level <= level[1])) {
				showRow(li, false);
				continue;
			}

			// Activity
			let matches_one_activity = activity.length === 0;
			for (let state of activity) {
				if (li.querySelector(`li[id^='${ACTIVITY_FILTER_DICT[state]}']`)) {
					matches_one_activity = true;
				}
			}
			if (!matches_one_activity) {
				showRow(li, false);
				continue;
			}

			// Status
			let matches_one_status = status.length === 0;
			for (let state of status) {
				if (li.find(`.status`).innerText.replace("STATUS:", "").trim().toLowerCase() === state) {
					matches_one_status = true;
				}
			}
			if (!matches_one_status) {
				showRow(li, false);
			}

			// Special
			for (let key in special) {
				console.log(key, special[key]);
				if (special[key] === 'both') continue;

				if (special[key] === 'yes') {
					let matchesOneIcon = false;
					for (let icon of SPECIAL_FILTER_DICT[key]) {
						if (li.querySelector(`li[id^='${icon}']`)) {
							matchesOneIcon = true;
							break;
						}
					}

					if (!matchesOneIcon) {
						showRow(li, false);
						continue;
					}
				} else if (special[key] === 'no') {
					let matchesOneIcon = false;
					for (let icon of SPECIAL_FILTER_DICT[key]) {
						if (li.querySelector(`li[id^='${icon}']`)) {
							matchesOneIcon = true;
							break;
						}
					}

					if (matchesOneIcon) {
						showRow(li, false);
						continue;
					}
				}
			}
		}

		ttStorage.change({
			"filters": {
				"overseas": {
					activity: activity,
					status: status,
					// faction: faction,
					// time: time,
					level: level
				}
			}
		});

		updateStatistics();
	}

	function showRow(row, show = true) {
		if (show) {
			row.classList.remove("filter-hidden");
			if (row.nextElementSibling && (row.nextElementSibling.classList.contains("tt-user-info") || row.nextElementSibling.classList.contains("tt-userinfo-container")))
				row.nextElementSibling.classList.remove("filter-hidden");
		} else {
			row.classList.add("filter-hidden");
			if (row.nextElementSibling && (row.nextElementSibling.classList.contains("tt-user-info") || row.nextElementSibling.classList.contains("tt-userinfo-container")))
				row.nextElementSibling.classList.add("filter-hidden");
		}
	}

	function updateStatistics() {
		doc.find(".statistic#showing .filter-count").innerText = [...list.findAll(":scope>li:not(.tt-userinfo-container)")].filter(x => (!x.classList.contains("filter-hidden"))).length;
		doc.find(".statistic#showing .filter-total").innerText = [...list.findAll(":scope>li:not(.tt-userinfo-container)")].length;
	}
}

/* Travel Table subsite */
async function travelTableScript() {
	doc.find(".content-wrapper .travel-agency-travelling").innerHTML = "";

	if (travel_market.length === 0 || !("date" in travel_market) || new Date() - new Date(travel_market.date) >= 2 * 60 * 1000) // 2 minutes
	{
		travel_market = await updateTravelMarket();
	}

	let container = content.newContainer("Travel Destinations", { id: "ttTravelTable" }).find(".content");

	addLegend();

	console.log("travel items", travel_items)
	doc.find("#ttTravelTable #tt-items").value = travel_items;

	let table = doc.new({ type: "div", class: "table" });
	container.appendChild(table);

	addTableContent(travel_items);

	// Set initial table mode
	if (filters.travel.table_type === "basic") {
		doc.find("#ttTravelTable .table-type-button span[type='basic']").click();
	} else if (filters.travel.table_type === "advanced") {
		doc.find("#ttTravelTable .table-type-button span[type='advanced']").click();
	}

	// Sort by country
	sort(doc.find("#ttTravelTable .table"), 1, "text");

	filterTable();

	// Updater
	setInterval(() => {
		reloadTable();
	}, 2 * 60 * 1000);
}

function addLegend() {
	let legend =
		`
<div class="legend">
    <div class="top-row">
        <div class="filter-button"><i class="fas ${filters.travel.open ? 'fa-chevron-up' : 'fa-chevron-down'}"></i><div>&nbsp;Filters</div></div>
        <div class="table-type-button">
            <span class="table-type" type="advanced">Advanced</span>
            <span>&nbsp;/&nbsp;</span>
            <span class="table-type" type="basic">Basic</span>
        </div>
    </div>
    <div class="legend-content ${filters.travel.open ? "" : "collapsed"}">
        <div class="row">
            <div>Travel items:&nbsp;<input type="number" id="tt-items"></div>
        </div>
        <div class="heading">Items</div>
        <div class="row">
            <div class="checkbox-item"><input type="checkbox" name="item" _type="plushie">Plushies</div>
            <div class="checkbox-item"><input type="checkbox" name="item" _type="flower">Flowers</div>
            <div class="checkbox-item"><input type="checkbox" name="item" _type="drug">Drugs</div>
            <div class="checkbox-item"><input type="checkbox" name="item" _type="other">Other</div>
        </div>
        <div class="heading">Countries</div>
        <div class="row">
            <div class="radio-item"><input type="radio" name="country" _type="all">All</div>
            <div class="radio-item"><input type="radio" name="country" _type="mexico">Mexico</div>
            <div class="radio-item"><input type="radio" name="country" _type="cayman islands">Cayman Islands</div>
            <div class="radio-item"><input type="radio" name="country" _type="canada">Canada</div>
            <div class="radio-item"><input type="radio" name="country" _type="hawaii">Hawaii</div>
            <div class="radio-item"><input type="radio" name="country" _type="united kingdom">United Kingdom</div>
            <div class="radio-item"><input type="radio" name="country" _type="argentina">Argentina</div>
            <div class="radio-item"><input type="radio" name="country" _type="switzerland">Switzerland</div>
            <div class="radio-item"><input type="radio" name="country" _type="japan">Japan</div>
            <div class="radio-item"><input type="radio" name="country" _type="china">China</div>
            <div class="radio-item"><input type="radio" name="country" _type="uae">UAE</div>
            <div class="radio-item"><input type="radio" name="country" _type="south africa">South Africa</div>
        </div>
    </div>
</div>
    `

	doc.find("#ttTravelTable .content").innerHTML += legend;

	// Set right filters
	if (!Array.isArray(filters.travel.item_type)) filters.travel.item_type = ["plushie", "flower", "drug", "other"]

	console.log(filters.travel.item_type)

	for (let type of filters.travel.item_type) {
		doc.find(`#ttTravelTable .legend-content input[name='item'][_type='${type}']`).checked = true;
	}

	doc.find(`#ttTravelTable .legend-content input[name='country'][_type='${filters.travel.country}']`).checked = true;

	// Open/Close filter
	for (let el of doc.findAll("#ttTravelTable .content .filter-button *")) {
		el.onclick = () => {
			doc.find("#ttTravelTable .content .legend-content").classList.toggle("collapsed");
			rotateElement(doc.find("#ttTravelTable .content .filter-button i"), 180);

			saveSettings();
		}
	}

	// Switch between modes
	let basic_mode_button = doc.find("#ttTravelTable .table-type-button span[type='basic']");
	let advanced_mode_button = doc.find("#ttTravelTable .table-type-button span[type='advanced']");

	basic_mode_button.onclick = () => {
		if (!basic_mode_button.classList.contains("active")) {
			basic_mode_button.classList.add("active");
		}
		advanced_mode_button.classList.remove("active");

		// Hide advanced elements
		for (let el of doc.findAll("#ttTravelTable .table .advanced")) {
			if (!el.classList.contains("hidden")) {
				el.classList.add("hidden");
			}
		}

		saveSettings();
	}
	advanced_mode_button.onclick = () => {
		if (!advanced_mode_button.classList.contains("active")) {
			advanced_mode_button.classList.add("active");
		}
		basic_mode_button.classList.remove("active");

		// Show advanced elements
		for (let el of doc.findAll("#ttTravelTable .table .advanced")) {
			el.classList.remove("hidden");
		}

		saveSettings();
	}

	// Filtering
	for (let el of doc.findAll("#ttTravelTable .legend-content .row .radio-item input, #ttTravelTable .legend-content .row .checkbox-item input")) {
		el.onclick = () => {
			filterTable();
			saveSettings();
		}
	}

	// Change travel items count
	doc.find("#ttTravelTable .legend-content #tt-items").onchange = () => {
		reloadTable();
	}
}

function addTableContent(travel_items) {
	addTableHeader();

	let body = doc.new({ type: "div", class: "body" });
	doc.find("#ttTravelTable .table").appendChild(body);

	let body_html = ``;

	// Add rows
	for (let item of travel_market.stocks) {
		let time = country_dict[item.country_name.toLowerCase()].time * 2;
		let cost = country_dict[item.country_name.toLowerCase()].cost;

		body_html += addRow(item, time, cost, travel_items);
	}
	body.innerHTML = body_html;
}

function addTableHeader() {
	let row =
		`
<div class="row header-row">
    <div>Destination</div>
    <div>Item</div>
    <div>Stock</div>
    <div class="advanced" sort-type="value">Buy Price</div>
    <div class="advanced" sort-type="value">Market Value</div>
    <div class="advanced" sort-type="value">Profit/Item</div>
    <div sort-type="value">Profit/Minute</div>
    <div class="advanced" sort-type="value">Total Profit</div>
    <div class="advanced" sort-type="value">Cash Needed</div>
</div>
    `
	doc.find("#ttTravelTable .table").innerHTML += row;

	doc.addEventListener("click", event => {

		if (hasParent(event.target, { class: "header-row" })) {
			let parent = event.target;

			if (event.target.nodeName === "I") parent = event.target.parentElement;

			sort(doc.find("#ttTravelTable .table"), [...parent.parentElement.children].indexOf(parent) + 1, parent.getAttribute("sort-type") === "value" ? "value" : "text");
		}
	});
}

function addRow(item, time, cost, travel_items) {
	let market_value = itemlist.items[item.item_id].market_value;
	let total_profit = (market_value - item.abroad_cost) * travel_items - cost;
	let profit_per_minute = (total_profit / time).toFixed(0);
	let profit_per_item = (total_profit / travel_items).toFixed(0);
	let update_time = timeAgo(item.timestamp * 1000);
	let item_types = ["plushie", "flower", "drug"];
	let background_style = `url(/images/v2/travel_agency/flags/fl_${item.country_name.toLowerCase().replace("united kingdom", "uk").replace(" islands", "").replace(" ", "_")}.svg) center top no-repeat`
	let item_type = item_types.includes(item.item_type.toLowerCase()) ? item.item_type.toLowerCase() : "other";

	let row =
		`
<div class="row">
    <div country='${item.country_name.toLowerCase()}'><div class="flag" style="background: ${background_style}"></div>${item.country_name}</div>
    <div item='${item_type}'>
        <div class="item-image" style='background-image: url(https://www.torn.com/images/items/${item.item_id}/small.png)'></div>
      <a target="_blank" href="https://www.torn.com/imarket.php#/p=shop&type=${item.item_id}">${item.item_name}</a>
    </div>
    <div>${item.abroad_quantity.toString()} <br class="advanced"> <span class="update-time">(${update_time})</span></div>
    <div class="advanced" value="${item.abroad_cost}">$${numberWithCommas(item.abroad_cost, item.abroad_cost >= 1e6)}</div>
    <div class="advanced" value="${market_value}">$${numberWithCommas(market_value, market_value >= 1e6)}</div>
    
    `
	let profit_per_item_div;
	if (profit_per_item > 0) {
		profit_per_item_div = `<div class="positive profit advanced" value="${profit_per_item}">+$${numberWithCommas(profit_per_item, profit_per_item >= 1e6)}</div>`
	} else if (profit_per_item < 0) {
		profit_per_item_div = `<div class="negative profit advanced" value="${profit_per_item}">-$${numberWithCommas(Math.abs(profit_per_item), profit_per_item <= -1e6)}</div>`
	} else {
		profit_per_item_div = `<div class="advanced" value="0">$0</div>`
	}
	row += profit_per_item_div;

	let profit_per_minute_div;
	if (profit_per_minute > 0) {
		profit_per_minute_div = `<div class="positive profit" value="${profit_per_minute}">+$${numberWithCommas(profit_per_minute, profit_per_minute >= 1e6)}</div>`
	} else if (profit_per_minute < 0) {
		profit_per_minute_div = `<div class="negative profit" value="${profit_per_minute}">-$${numberWithCommas(Math.abs(profit_per_minute), profit_per_minute <= -1e6)}</div>`
	} else {
		profit_per_minute_div = `<div value="0">$0</div>`
	}
	row += profit_per_minute_div;

	let total_profit_div;
	if (total_profit > 0) {
		total_profit_div = `<div class="positive profit advanced" value="${total_profit}">+$${numberWithCommas(total_profit, total_profit >= 1e6)}</div>`
	} else if (total_profit < 0) {
		total_profit_div = `<div class="negative profit advanced" value="${total_profit}">-$${numberWithCommas(Math.abs(total_profit), total_profit <= -1e6)}</div>`
	} else {
		total_profit_div = `<div class="advanced" value="0">$0</div>`
	}
	row += total_profit_div;

	row += `<div class="advanced" value="${item.abroad_cost * travel_items}">$${numberWithCommas((item.abroad_cost * travel_items), item.abroad_cost >= 1e6)}</div>`

	row += "</div>"
	return row;
}

function filterTable() {
	const country = doc.find("#ttTravelTable .legend-content .radio-item input[name='country']:checked").getAttribute("_type");
	const item_types = [...doc.findAll("#ttTravelTable .legend-content .checkbox-item input[name='item']:checked")].map(x => x.getAttribute("_type"));

	let cols = {
		"country": 1,
		"item": 2
	}

	// Switch destination on map
	// let name = country.replace(/ /g, "-");
	// if (country === "cayman islands") name = "cayman";
	// if (country === "united kingdom") name = "uk";
	// doc.find(`div[role='tabpanel'][aria-expanded='true'] .path.to-${name}`).previousElementSibling.click();

	for (let row of doc.findAll("#ttTravelTable .table .body .row")) {
		row.classList.remove("hidden");

		// Country
		if (country !== 'all' && [...row.children][cols['country'] - 1].getAttribute('country') !== country) {
			row.classList.add("hidden");
			continue;
		}

		// Item type
		let is_in_list = false;
		for (let type of item_types) {
			if (item_types.includes([...row.children][cols['item'] - 1].getAttribute('item'))) {
				is_in_list = true;
				break;
			}
		}

		if (!is_in_list) {
			row.classList.add("hidden");
		}
	}
}

function saveSettings() {
	let travel = {
		table_type: doc.find(".table-type.active") ? doc.find(".table-type.active").getAttribute("type") : "basic",
		open: !doc.find(".legend-content").classList.contains("collapsed"),
		item_type: [...doc.findAll(".legend-content input[name='item']:checked")].map(x => x.getAttribute("_type")),
		country: doc.find(".legend-content input[name='country']:checked").getAttribute("_type")
	}

	ttStorage.change({ "filters": { "travel": travel } });
}

function reloadTable() {
	console.log("Reloading table");
	ttStorage.get(['filters', 'travel_market'], async ([filters, travel_market]) => {
		if (travel_market.length === 0 || !travel_market.date || new Date() - new Date(travel_market.date) >= 2 * 60 * 1000) // 2 minutes
		{
			travel_market = await updateTravelMarket();
		}

		let travel_items = doc.find("#tt-items").value;

		doc.find("#ttTravelTable .table .body").innerHTML = "";
		let body_html = ``;

		// Add rows
		for (let item of travel_market.stocks) {
			let time = country_dict[item.country_name.toLowerCase()].time;
			let cost = country_dict[item.country_name.toLowerCase()].cost;

			body_html += addRow(item, time, cost, travel_items);
		}
		doc.find("#ttTravelTable .table .body").innerHTML = body_html;

		// Set Table mode
		if (filters.travel.table_type === "basic") {
			doc.find("#ttTravelTable .table-type-button span[type='basic']").click();
		} else if (filters.travel.table_type === "advanced") {
			doc.find("#ttTravelTable .table-type-button span[type='advanced']").click();
		}

		// Sort by country
		doc.find("#ttTravelTable .header-row i").remove();
		sort(doc.find("#ttTravelTable .table"), 1, "text");

		filterTable();
	});
}

function updateTravelMarket() {
	console.log("Updating Travel Market info.");
	return new Promise((resolve) => {
		fetchRelay('yata', { section: 'bazaar/abroad/export' })
			.then(result => {
				console.log("Travel market result", result);
				result.date = new Date().toString();
				ttStorage.set({ "travel_market": result }, () => {
					console.log("	Travel market info set.");
					return resolve(result);
				});
			})
			.catch(err => {
				console.log("ERROR", err);
				return resolve(err);
			});
	});
}

async function showUserInfo() {
	if (!(settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.abroad))
		return;

	estimateStatsInList(".users-list > li", (row) => {
		return {
			userId: row.find("a.user.name").getAttribute("data-placeholder") ? row.find("a.user.name").getAttribute("data-placeholder").split(" [")[1].split("]")[0] : row.find("a.user.name").getAttribute("href").split("XID=")[1]
		};
	});
}