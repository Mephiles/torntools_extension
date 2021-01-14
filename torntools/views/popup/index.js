let previous_chain_timer;
let initiated_pages = {
	info: false,
	market: false,
	stocks: false,
	calculator: false,
};

window.addEventListener("load", () => {
	loadingPlaceholder(doc.find("body"), true);
});

requireDatabase(false)
	.then(() => {
		console.log("Starting POPUP");

		loadPage(settings.tabs.default);

		// Show api error if any
		if (!api.online) {
			doc.find(".error").style.display = "block";
			doc.find(".error").innerText = api.error;
		}

		// Setup links
		for (let tab of doc.findAll("body>.header .page-tab")) {
			let name = tab.id.split("-")[0];
			tab.onclick = () => {
				if (doc.find(`body>.header .page-tab.active-tab`).id.split("-")[0] !== name) {
					loadPage(name);
				}
			};

			if (settings.tabs[name] === false) tab.style.display = "none";
		}

		// Show loaded page
		loadingPlaceholder(doc.find("body"), false);
		doc.find("body").classList.remove("loading");
	})
	.catch(() => {
		if (api_key) return;
		loadPage("initialize");

		setTimeout(() => {
			// Show loaded page
			loadingPlaceholder(doc.find("body"), false);
			doc.find("body").classList.remove("loading");
		}, 100);
	});

function loadPage(name) {
	console.log("Loading page:", name);
	for (let page of doc.findAll(".subpage")) {
		if (page.id === name) {
			page.classList.add("active");
		} else {
			page.classList.remove("active");
		}
	}

	// Setup settings button
	doc.find(".settings").onclick = () => {
		window.open("../settings/settings.html");
	};

	// Hide header when initializing
	if (name === "initialize") doc.find("body>.header").style.display = "none";
	else {
		doc.find("body>.header").style.display = "block";
		doc.find("body>.header .page-tab.active-tab").classList.remove("active-tab");
		doc.find(`body>.header .page-tab#${name}-html`).classList.add("active-tab");
	}

	// Run page script
	let dict = {
		info: mainInfo,
		market: mainMarket,
		stocks: mainStocks,
		calculator: mainCalculator,
		initialize: mainInitialize,
	};
	if (!initiated_pages[name]) {
		dict[name]();
		initiated_pages[name] = true;
	}
}

function mainInfo() {
	updateInfo();

	for (let link of doc.findAll(".subpage#info .link")) {
		link.onclick = () => {
			chrome.tabs.create({ url: link.getAttribute("href") });
		};
	}

	// Stakeouts collapsing
	doc.find(".stakeouts-heading").onclick = () => {
		doc.find(".stakeouts-heading").classList.toggle("collapsed");

		if (doc.find(".stakeouts-heading i.fa-caret-right")) {
			doc.find(".stakeouts-heading i.fa-caret-right").setAttribute("class", "fas fa-caret-down");
		} else {
			doc.find(".stakeouts-heading i.fa-caret-down").setAttribute("class", "fas fa-caret-right");
		}
	};

	doc.find("#mute").addEventListener("click", () => {
		ttStorage.get("settings", (settings) => {
			ttStorage.change({ settings: { notifications: { global: !settings.notifications.global } } }, updateInfo);
		});
	});

	// Update interval
	setInterval(() => {
		updateInfo();
	}, 15 * 1000);

	// Global time reducer
	setInterval(() => {
		for (let time of doc.findAll("*[seconds-down]")) {
			let seconds = parseInt(time.getAttribute("seconds-down"));
			seconds--;

			if (seconds === 0) {
				time.parentElement.style.display = "none";
				time.removeAttribute("seconds-down");
				continue;
			}

			time.innerText = timeUntil(seconds * 1000);
			time.setAttribute("seconds-down", seconds);
		}
	}, 1000);

	// Update time increaser
	setInterval(() => {
		let time = doc.find("#last-update span");
		let seconds = parseInt(time.getAttribute("seconds-up"));
		seconds++;

		time.innerText = timeAgo(new Date() - seconds * 1000);
		time.setAttribute("seconds-up", seconds);
	}, 1000);

	function updateInfo() {
		console.log("Updating INFO");
		ttStorage.get(["userdata", "settings"], ([userdata, settings]) => {
			let mute = doc.find("#mute");
			mute.classList = settings.notifications.global ? "unmuted" : "muted";
			mute.innerHTML = settings.notifications.global ? `Unmuted <i class="fas fa-volume-up"></i>` : `Muted <i class="fas fa-volume-mute"></i>`;

			console.log("Data", userdata);

			let time_diff = parseInt(((new Date().getTime() - new Date(userdata.date).getTime()) / 1000).toFixed(0));
			doc.find("#last-update span").innerText = timeAgo(new Date(userdata.date));
			doc.find("#last-update span").setAttribute("seconds-up", time_diff);

			// Update location
			let country = userdata.travel.destination;
			if (userdata.travel.time_left > 0) {
				doc.find("#location span").innerText = `Traveling to ${country}`;
			} else {
				doc.find("#location span").innerText = country;
			}

			// Update status
			let status =
				userdata.status.state.toLowerCase() === "traveling" || userdata.status.state.toLowerCase() === "abroad"
					? "okay"
					: userdata.status.state.toLowerCase();
			doc.find("#status span").innerText = capitalize(status);
			doc.find("#status span").setClass(status);

			// Update bars
			for (let bar of ["energy", "nerve", "happy", "life", "chain"]) {
				let current_stat = userdata[bar].current;
				let max_stat = bar === "chain" && current_stat !== userdata[bar].maximum ? getNextBonus(current_stat) : userdata[bar].maximum;

				if (bar === "chain" && current_stat === 0) {
					doc.find("#chain").style.display = "none";
					continue;
				} else {
					doc.find("#chain").style.display = "block";
				}

				if (current_stat > max_stat && ["happy"].includes(bar)) {
					let tick_times = [15, 30, 45, 60];
					let current_minutes = new Date().getMinutes();

					for (let tick of tick_times) {
						if (tick > current_minutes) {
							let next_tick_date = new Date(new Date(new Date().setMinutes(tick)).setSeconds(0));
							let ms_left = next_tick_date - new Date();
							let resets_in = timeUntil(ms_left);

							doc.find(`#${bar} .resets-in`).style.display = "block";
							doc.find(`#${bar} .resets-in span`).innerText = resets_in;
							doc.find(`#${bar} .resets-in span`).setAttribute("seconds-down", parseInt(ms_left / 1000));

							break;
						}
					}
				}

				let full_stat = userdata[bar].fulltime - time_diff;
				let time_left;
				if (!isNaN(full_stat)) time_left = timeUntil(full_stat * 1000);

				doc.find(`#${bar} .stat`).innerText = `${current_stat}/${max_stat}`;

				// Progress
				if (current_stat < max_stat) {
					let progress = ((current_stat / max_stat) * 100).toFixed(0);
					doc.find(`#${bar} .progress div`).style.width = `${progress}%`;
				} else {
					doc.find(`#${bar} .progress div`).style.width = `100%`;
				}

				if (bar === "chain") {
					continue;
				}

				// Time
				if (time_left === "0s" || time_left === -1) {
					doc.find(`#${bar} .full-in`).style.display = "none";
				} else {
					doc.find(`#${bar} .full-in`).style.display = "block";
					doc.find(`#${bar} .full-in span`).innerText = time_left;
					doc.find(`#${bar} .full-in span`).setAttribute("seconds-down", full_stat);
				}
			}

			// Update travel bar
			if (userdata.travel.time_left !== 0) {
				doc.find("#travel").style.display = "block";
				let travel_time = (userdata.travel.timestamp - userdata.travel.departed) * 1000; // ms
				let time_left = new Date(userdata.travel.timestamp * 1000) - new Date(); // ms
				let progress = parseInt(((travel_time - time_left) / travel_time) * 100);
				console.log(travel_time);
				console.log(time_left);

				if (timeUntil(time_left) === -1) {
					doc.find("#travel").style.display = "none";
				}

				doc.find("#travel .full-in span").innerText = timeUntil(time_left);
				doc.find("#travel .full-in span").setAttribute("seconds-down", (time_left / 1000).toFixed(0));
				doc.find("#travel .progress div").style.width = `${progress}%`;

				let land_date = new Date(userdata.travel.timestamp * 1000);
				let [hours, minutes, seconds] = [land_date.getHours(), land_date.getMinutes(), land_date.getSeconds()];
				doc.find("#travel .progress .stat").innerText = formatTime([hours, minutes, seconds], settings.format.time);
			} else {
				doc.find("#travel").style.display = "none";
			}

			// Update chain timer
			if (userdata.chain.timeout > 0) {
				if (!previous_chain_timer || previous_chain_timer !== userdata.chain.timeout) {
					previous_chain_timer = userdata.chain.timeout;
					doc.find("#chain").style.display = "block";

					let real_timeout = userdata.chain.timeout * 1000 - (new Date() - new Date(userdata.timestamp * 1000));

					if (real_timeout > 0) {
						doc.find(`#chain .resets-in`).style.display = "block";
						doc.find("#chain .resets-in span").innerText = timeUntil(real_timeout);
						doc.find("#chain .resets-in span").setAttribute("seconds-down", (real_timeout / 1000).toFixed(0));
					} else {
						doc.find("#chain").style.display = "none";
					}
				}
			} else {
				doc.find("#chain").style.display = "none";
			}

			// Update cooldowns
			for (let cd of ["drug", "medical", "booster"]) {
				let time_left = timeUntil((userdata.cooldowns[cd] - time_diff) * 1000);

				if (time_left === "0s" || time_left === -1) {
					doc.find(`#${cd}`).style.display = "none";
				} else {
					doc.find(`#${cd}`).style.display = "block";
					doc.find(`#${cd} .time`).innerText = time_left;
					doc.find(`#${cd} .time`).setAttribute("seconds-down", userdata.cooldowns[cd]);
				}
			}

			// Update footer info
			let event_count = 0;
			for (let event_key of Object.keys(userdata.events).reverse()) {
				if (userdata.events[event_key].seen === 0) {
					event_count++;
				} else {
					break;
				}
			}
			let message_count = 0;
			for (let message_key of Object.keys(userdata.messages).reverse()) {
				if (userdata.messages[message_key].seen === 0) {
					message_count++;
				} else {
					break;
				}
			}

			doc.find(".footer .messages span").innerText = message_count;
			doc.find(".footer .events span").innerText = event_count;
			doc.find(".footer .money span").innerText = `$${numberWithCommas(userdata.money_onhand, false)}`;

			// Update Stakeouts
			doc.find(".stakeouts").innerHTML = "";
			let even = false;
			for (let userID in stakeouts) {
				const userStatus = stakeouts[userID].info.last_action ? stakeouts[userID].info.last_action.status : "N/A";
				const userHTML = `
					<div class="row"><div class="status ${userStatus.toLowerCase()}">${userStatus}</div><div class="name">| <a>${
					stakeouts[userID].info.username || userID
				}</a></div></div>
					<div class="row"><div class="last-action">Last action: ${stakeouts[userID].info.last_action ? stakeouts[userID].info.last_action.relative : "N/A"}</div></div>
					<div class="row"></div>
				`;

				const userEL = doc.new({ type: "div", class: `user ${even ? "even" : "odd"}` });
				userEL.innerHTML = userHTML;
				userEL.find(".name a").onclick = () => {
					window.open(`https://www.torn.com/profiles.php?XID=${userID}`);
				};

				doc.find(".stakeouts").appendChild(userEL);
				even = even ? false : true;
			}
		});
	}

	function getNextBonus(current) {
		let chain_bonuses = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

		for (let bonus of chain_bonuses) {
			if (bonus > current) {
				return bonus;
			}
		}
	}
}

function mainMarket() {
	// setup itemlist
	let list = doc.find("#market #item-list");
	for (let id in itemlist.items) {
		let name = itemlist.items[id].name;

		let div = doc.new("div");
		div.setClass("item");
		div.id = name.toLowerCase().replace(/\s+/g, "").replace(":", "_"); // remove spaces
		div.innerText = name;

		list.appendChild(div);

		// display item if clicked on it
		div.addEventListener("click", async () => {
			let view_item = doc.find("#view-item");
			view_item.style.display = "block";

			view_item.find("a").innerText = name;
			view_item.find("a").href = `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${name}`;

			list.style.display = "none";

			showMarketInfo(id);
		});
	}

	// setup searchbar
	doc.find("#market #search-bar").addEventListener("keyup", (event) => {
		let keyword = event.target.value.toLowerCase();
		let items = doc.findAll("#market #item-list div");

		if (keyword === "") {
			list.style.display = "none";
			return;
		}

		for (let item of items) {
			if (item.textContent.toLowerCase().includes(keyword)) {
				item.style.display = "block";
				list.style.display = "block";
			} else {
				item.style.display = "none";
			}
		}
	});

	doc.find("#market #search-bar").onclick = (event) => {
		event.target.value = "";

		doc.find("#view-item").style.display = "none";
		doc.find("#market #item-list").style.display = "none";
		doc.find("#market-info").style.display = "none";
	};

	function showMarketInfo(id) {
		fetchApi_v2("torn", { section: "market", objectid: id, selections: "bazaar,itemmarket" })
			.then((result) => {
				console.log("Getting Bazaar & Itemmarket info");

				let list = doc.find("#market-info");
				list.style.display = "block";
				list.innerHTML = "";

				for (let type of Object.keys(result)) {
					let heading_div = doc.new("div");
					heading_div.setClass("heading");
					heading_div.innerText = capitalize(type);

					list.appendChild(heading_div);

					if (result[type]) {
						for (let i = 0; i < 3; i++) {
							let price_div = doc.new("div");
							price_div.setClass("price");
							price_div.innerText = `${result[type][i].quantity}x | $${numberWithCommas(result[type][i].cost, false)}`;

							list.appendChild(price_div);
						}
					} else {
						list.appendChild(
							doc.new({
								type: "div",
								class: "price",
								text: "No price found.",
							})
						);
					}
				}
			})
			.catch((result) => {
				doc.find(".error").style.display = "block";
				doc.find(".error").innerText = result;
			});
	}
}

function mainStocks() {
	let torn_stocks = torndata.stocks;
	let user_stocks = userdata.stocks;

	// setup user stocks
	for (let buy_id in user_stocks) {
		let parent = doc.find("#user-stocks");
		let stock = user_stocks[buy_id];
		let id = stock.stock_id;
		let name = torn_stocks[id].name;

		let buy_price = stock.bought_price;
		let current_price = torn_stocks[id].current_price;
		let quantity = stock.shares;
		let total_profit = ((current_price - buy_price) * quantity).toFixed(0);

		let div = doc.new({ type: "div", class: "stock-item" });
		let hr = doc.new("hr");
		let heading = doc.new({
			type: "div",
			class: "heading",
			text: `${name.length > 20 ? torn_stocks[id].acronym : name}`,
		}); // use acronym if name is too long
		let quantity_span = doc.new({
			type: "div",
			class: "heading-quantity",
			text: `(${numberWithCommas(quantity)} shares)`,
		});
		heading.appendChild(quantity_span);

		heading.addEventListener("click", () => {
			chrome.tabs.create({ url: `https://www.torn.com/stockexchange.php?torntools_redirect=${name}` });
		});

		// Stock info
		let stock_info = doc.new({ type: "div", class: "stock-info-heading", text: "Price info" });
		let collapse_icon = doc.new({ type: "i", class: "fas fa-chevron-down" });
		stock_info.appendChild(collapse_icon);

		let stock_info_content = doc.new({ type: "div", class: "content" });
		let CP_div = doc.new({
			type: "div",
			class: "stock-info",
			text: `Current price: $${numberWithCommas(current_price, false)}`,
		});
		let BP_div = doc.new({
			type: "div",
			class: "stock-info",
			text: `Buy price: $${numberWithCommas(buy_price, false)}`,
		});
		let amount_div = doc.new({
			type: "div",
			class: "stock-info",
			text: `Quantity: ${numberWithCommas(quantity, false)}`,
		});
		let profit = doc.new({ type: "div", class: "profit" });
		if (total_profit > 0) {
			profit.classList.add("positive");
			profit.innerText = `+$${numberWithCommas(total_profit, false)}`;
		} else if (total_profit < 0) {
			profit.classList.add("negative");
			profit.innerText = `-$${numberWithCommas(Math.abs(total_profit), false)}`;
		} else {
			profit.innerText = `$0`;
		}

		stock_info_content.appendChild(CP_div);
		stock_info_content.appendChild(BP_div);
		stock_info_content.appendChild(amount_div);

		// Benefit info
		let benefit_description, benefit_requirement, benefit_info, benefit_info_content;

		if (torn_stocks[id].benefit) {
			benefit_description = torn_stocks[id].benefit.description;
			benefit_requirement = torn_stocks[id].benefit.requirement;
			benefit_info = doc.new({ type: "div", class: "benefit-info-heading", text: "Benefit info" });
			let collapse_icon_2 = doc.new({ type: "i", class: "fas fa-chevron-down" });
			benefit_info.appendChild(collapse_icon_2);

			benefit_info_content = doc.new({ type: "div", class: "content" });
			let BD_div = doc.new({ type: "div", text: benefit_description });
			quantity >= benefit_requirement ? BD_div.setClass("benefit-info desc complete") : BD_div.setClass("benefit-info desc incomplete");
			let BR_div = doc.new({
				type: "div",
				class: "benefit-info",
				text: `Required stocks: ${numberWithCommas(quantity, false)}/${numberWithCommas(benefit_requirement)}`,
			});

			benefit_info_content.appendChild(BR_div);
			benefit_info_content.appendChild(BD_div);
		}

		// Alerts
		let alerts_wrap = doc.new({ type: "div", class: "alerts-wrap" });
		let alerts_heading = doc.new({ type: "div", class: "alerts-heading", text: "Alerts" });

		let reach_alert = stock_alerts[id] ? stock_alerts[id].reach : "";
		let input_wrap_reach = doc.new({ type: "div", class: "alerts-input-wrap" });
		let reach_text = doc.new({ type: "div", class: "alerts-text", text: "Reaches" });
		let reach_input = doc.new({ type: "input", class: "alerts-input", value: reach_alert });
		input_wrap_reach.appendChild(reach_text);
		input_wrap_reach.appendChild(reach_input);

		let fall_alert = stock_alerts[id] ? stock_alerts[id].fall : "";
		let input_wrap_fall = doc.new({ type: "div", class: "alerts-input-wrap" });
		let fall_text = doc.new({ type: "div", class: "alerts-text", text: "Falls to" });
		let fall_input = doc.new({ type: "input", class: "alerts-input", value: fall_alert });
		input_wrap_fall.appendChild(fall_text);
		input_wrap_fall.appendChild(fall_input);

		alerts_wrap.appendChild(alerts_heading);
		alerts_wrap.appendChild(input_wrap_reach);
		alerts_wrap.appendChild(input_wrap_fall);
		stock_info_content.appendChild(alerts_wrap);

		div.appendChild(hr);
		div.appendChild(heading);
		div.appendChild(profit);

		div.appendChild(stock_info);
		div.appendChild(stock_info_content);

		if (benefit_info) {
			div.appendChild(benefit_info);
			div.appendChild(benefit_info_content);
		}

		parent.appendChild(div);

		// add event listeners to open collapsibles
		stock_info.addEventListener("click", (event) => {
			let content = event.target.nodeName === "I" ? event.target.parentElement.nextElementSibling : event.target.nextElementSibling;

			if (content.style.maxHeight) {
				content.style.maxHeight = null;
			} else {
				content.style.maxHeight = content.scrollHeight + "px";
			}

			event.target.nodeName === "I" ? rotateElement(event.target, 180) : rotateElement(event.target.find("i"), 180);
		});

		if (benefit_info) {
			benefit_info.addEventListener("click", (event) => {
				let content = event.target.nodeName === "I" ? event.target.parentElement.nextElementSibling : event.target.nextElementSibling;

				if (content.style.maxHeight) {
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight = content.scrollHeight + "px";
				}

				event.target.nodeName === "I" ? rotateElement(event.target, 180) : rotateElement(event.target.find("i"), 180);
			});
		}

		// add event listeners to price alerts
		reach_input.addEventListener("change", () => {
			ttStorage.change({
				stock_alerts: {
					[id]: {
						reach: reach_input.value,
					},
				},
			});
		});

		fall_input.addEventListener("change", () => {
			ttStorage.change({
				stock_alerts: {
					[id]: {
						fall: fall_input.value,
					},
				},
			});
		});
	}

	// setup torn stocks
	for (let id in torn_stocks) {
		if (id === "date") continue;
		let parent = doc.find("#all-stocks");
		let stock = torn_stocks[id];
		let name = stock.name;
		let current_price = torn_stocks[id].current_price;

		let div = doc.new({
			type: "div",
			class: "stock-item",
			attributes: { name: `${name.toLowerCase()} (${stock.acronym.toLowerCase()})` },
		});
		let hr = doc.new("hr");
		let heading = doc.new({ type: "div", class: "heading", text: name }); // use acronym if name is too long

		heading.addEventListener("click", () => {
			chrome.tabs.create({ url: `https://www.torn.com/stockexchange.php?torntools_redirect=${name}` });
		});

		// Stock info
		let stock_info = doc.new({ type: "div", class: "stock-info-heading", text: "Price info" });
		let collapse_icon = doc.new({ type: "i", class: "fas fa-chevron-down" });
		stock_info.appendChild(collapse_icon);

		let stock_info_content = doc.new({ type: "div", class: "content" });
		let CP_div = doc.new({
			type: "div",
			class: "stock-info",
			text: `Current price: $${numberWithCommas(current_price, false)}`,
		});
		let Q_div = doc.new({
			type: "div",
			class: "stock-info",
			text: `Available shares: ${numberWithCommas(torn_stocks[id].available_shares, false)}`,
			attributes: { style: "margin-bottom: 20px;" },
		});
		stock_info_content.appendChild(CP_div);
		stock_info_content.appendChild(Q_div);

		// Benefit info
		let benefit_description, benefit_requirement, benefit_info, benefit_info_content;

		if (torn_stocks[id].benefit) {
			benefit_description = torn_stocks[id].benefit.description;
			benefit_requirement = torn_stocks[id].benefit.requirement;

			benefit_info = doc.new({ type: "div", class: "benefit-info-heading", text: "Benefit info" });
			let collapse_icon_2 = doc.new({ type: "i", class: "fas fa-chevron-down" });
			benefit_info.appendChild(collapse_icon_2);

			benefit_info_content = doc.new({ type: "div", class: "content" });
			let BD_div = doc.new({ type: "div", text: benefit_description });
			let BR_div = doc.new({
				type: "div",
				class: "benefit-info",
				text: `Required stocks: ${numberWithCommas(benefit_requirement)}`,
			});

			benefit_info_content.appendChild(BR_div);
			benefit_info_content.appendChild(BD_div);
		}

		// Alerts
		let alerts_wrap = doc.new({ type: "div", class: "alerts-wrap" });
		let alerts_heading = doc.new({ type: "div", class: "alerts-heading", text: "Alerts" });

		let reach_alert = stock_alerts[id] ? stock_alerts[id].reach : "";
		let input_wrap_reach = doc.new({ type: "div", class: "alerts-input-wrap" });
		let reach_text = doc.new({ type: "div", class: "alerts-text", text: "Reaches" });
		let reach_input = doc.new({ type: "input", class: "alerts-input", value: reach_alert });
		input_wrap_reach.appendChild(reach_text);
		input_wrap_reach.appendChild(reach_input);

		let fall_alert = stock_alerts[id] ? stock_alerts[id].fall : "";
		let input_wrap_fall = doc.new({ type: "div", class: "alerts-input-wrap" });
		let fall_text = doc.new({ type: "div", class: "alerts-text", text: "Falls to" });
		let fall_input = doc.new({ type: "input", class: "alerts-input", value: fall_alert });
		input_wrap_fall.appendChild(fall_text);
		input_wrap_fall.appendChild(fall_input);

		alerts_wrap.appendChild(alerts_heading);
		alerts_wrap.appendChild(input_wrap_reach);
		alerts_wrap.appendChild(input_wrap_fall);
		stock_info_content.appendChild(alerts_wrap);

		div.appendChild(hr);
		div.appendChild(heading);

		div.appendChild(stock_info);
		div.appendChild(stock_info_content);

		if (benefit_description) {
			div.appendChild(benefit_info);
			div.appendChild(benefit_info_content);
		}

		parent.appendChild(div);

		// add event listeners to open collapsibles
		stock_info.addEventListener("click", (event) => {
			let content = event.target.nodeName === "I" ? event.target.parentElement.nextElementSibling : event.target.nextElementSibling;

			if (content.style.maxHeight) {
				content.style.maxHeight = null;
			} else {
				content.style.maxHeight = content.scrollHeight + "px";
			}

			event.target.nodeName === "I" ? rotateElement(event.target, 180) : rotateElement(event.target.find("i"), 180);
		});

		if (benefit_description) {
			benefit_info.addEventListener("click", (event) => {
				let content = event.target.nodeName === "I" ? event.target.parentElement.nextElementSibling : event.target.nextElementSibling;

				if (content.style.maxHeight) {
					content.style.maxHeight = null;
				} else {
					content.style.maxHeight = content.scrollHeight + "px";
				}

				event.target.nodeName === "I" ? rotateElement(event.target, 180) : rotateElement(event.target.find("i"), 180);
			});
		}

		// add event listeners to price alerts
		reach_input.addEventListener("change", () => {
			ttStorage.change({
				stock_alerts: {
					[id]: {
						reach: reach_input.value,
					},
				},
			});
		});

		fall_input.addEventListener("change", () => {
			ttStorage.change({
				stock_alerts: {
					[id]: {
						fall: fall_input.value,
					},
				},
			});
		});
	}

	// setup searchbar
	doc.find("#stocks #search-bar").addEventListener("keyup", (event) => {
		let keyword = event.target.value.toLowerCase();
		let stocks = doc.findAll("#all-stocks>div");

		if (keyword === "") {
			doc.find("#all-stocks").style.display = "none";
			doc.find("#user-stocks").style.display = "block";
			return;
		}

		doc.find("#user-stocks").style.display = "none";
		doc.find("#all-stocks").style.display = "block";

		for (let stock of stocks) {
			if (stock.getAttribute("name").indexOf(keyword) > -1) {
				stock.style.display = "block";
			} else {
				stock.style.display = "none";
			}
		}
	});

	doc.find("#stocks #search-bar").addEventListener("click", (event) => {
		event.target.value = "";

		doc.find("#all-stocks").style.display = "none";
		doc.find("#user-stocks").style.display = "block";
	});
}

function mainCalculator() {
	// setup itemlist
	let list = doc.find("#calculator #item-list");
	for (let id in itemlist.items) {
		let name = itemlist.items[id].name;

		let div = doc.new("div");
		div.setClass("item");
		div.id = name.toLowerCase().replace(/\s+/g, ""); // remove spaces
		div.innerText = name;

		let input = doc.new("input");
		input.setClass("quantity");
		input.setAttribute("type", "number");
		if (!usingChrome()) {
			input.style.right = "51px";
		}

		let add_btn = doc.new("button");
		add_btn.setClass("add");
		add_btn.innerText = "Add";

		div.appendChild(add_btn);
		div.appendChild(input);
		list.appendChild(div);

		// display item if clicked on it
		add_btn.addEventListener("click", () => {
			let quantity = input.value;

			if (!quantity) {
				return;
			}

			// add price to list
			let item_price = itemlist.items[id].market_value;
			let div = doc.new("div");
			div.innerText = `${quantity}x ${name}  = $${numberWithCommas(item_price * quantity, false)}`;

			doc.find("#items-selected").appendChild(div);

			// increase total
			let total_value = parseInt(doc.find("#total-value").getAttribute("value"));
			doc.find("#total-value").setAttribute("value", total_value + item_price * quantity);

			doc.find("#total-value").innerText = `Total: $${numberWithCommas(total_value + item_price * quantity, false)}`;

			// clear input box
			input.value = "";
		});
	}

	// setup searchbar
	doc.find("#calculator #search-bar").addEventListener("keyup", (event) => {
		let keyword = event.target.value.toLowerCase();
		let items = doc.findAll("#calculator #item-list div");

		if (keyword === "") {
			list.style.display = "none";
			return;
		}

		for (let item of items) {
			if (item.id.indexOf(keyword) > -1) {
				item.style.display = "block";
				list.style.display = "block";
			} else {
				item.style.display = "none";
			}
		}
	});

	doc.find("#calculator #search-bar").addEventListener("click", (event) => {
		event.target.value = "";

		doc.find("#item-list").style.display = "none";
	});

	// setup clear button
	doc.find("#clear-all").addEventListener("click", () => {
		doc.find("#items-selected").innerHTML = "";
		doc.find("#total-value").innerText = "";
		doc.find("#total-value").setAttribute("value", "0");
		doc.find("#calculator #search-bar").value = "";
		doc.find("#calculator #item-list").style.display = "none";
	});

	//  // Firefox
	//  if(!usingChrome()){
	//      console.log("Firefox edition.");
	//      doc.find("body").style.paddingRight = "17px";
	//  }
}

function mainInitialize() {
	doc.find("#set-button").onclick = () => {
		api_key = doc.find("#api-field").value;

		ttStorage.set({ api_key: api_key }, () => {
			console.log("API key set");

			doc.find("h3").innerText = "Loading..";
			doc.find("p").innerText = "It will take 30 seconds to fetch your data. You may close this window.";
			doc.find("input").style.display = "none";
			doc.find("button").style.display = "none";

			chrome.runtime.sendMessage({ action: "initialize" }, (response) => {
				console.log(response.message);
				doc.find("h3").innerText = response.message;
				doc.find("p").innerText = "(you may close this window)";

				if (response.success) {
					loadPage("info");
				}
			});
		});
	};
}
