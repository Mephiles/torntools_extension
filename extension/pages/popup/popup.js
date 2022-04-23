"use strict";

const SETUP_PAGES = {
	initialize: setupInitialize,
	dashboard: setupDashboard,
	market: setupMarketSearch,
	calculator: setupCalculator,
	stocks: setupStocksOverview,
	notifications: setupNotifications,
};
const LOAD_PAGES = {
	market: loadMarketSearch,
	calculator: loadCalculator,
};

const initiatedPages = {};

(async () => {
	document.body.style.minWidth = `${Math.min(416, screen.availWidth * 0.8)}px`;

	showLoadingPlaceholder(document.body, true);

	const database = await loadDatabase();
	notificationHistory = database.notificationHistory;

	document.body.classList.add(getPageTheme());

	handleAPIError();
	storageListeners.api.push(handleAPIError);

	for (const navigation of document.findAll("#pages .main-nav li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
	document.find("#pages .right-nav li[to='settings']").addEventListener("click", () => chrome.runtime.openOptionsPage());

	if (!settings.pages.popup.dashboard) document.find("#pages li[to='dashboard']").classList.add("tt-hidden");
	if (!settings.pages.popup.marketSearch) document.find("#pages li[to='market']").classList.add("tt-hidden");
	if (!settings.pages.popup.calculator) document.find("#pages li[to='calculator']").classList.add("tt-hidden");
	if (!settings.pages.popup.stocksOverview) document.find("#pages li[to='stocks']").classList.add("tt-hidden");
	if (!settings.pages.popup.notifications) document.find("#pages li[to='notifications']").classList.add("tt-hidden");

	if (!api.torn.key) {
		await showPage("initialize");
	} else {
		await showPage(settings.pages.popup.defaultTab);
	}

	showLoadingPlaceholder(document.body, false);
	document.body.classList.remove("loading");

	function handleAPIError() {
		if (api.torn.error) {
			document.find(".error").classList.remove("tt-hidden");
			document.find(".error").textContent = api.torn.error;
		} else {
			document.find(".error").classList.add("tt-hidden");
			document.find(".error").textContent = "";
		}
	}
})();

async function showPage(name) {
	document.find(`#${name}`).classList.add("active");

	for (const active of document.findAll("body > main.subpage.active, #pages li.active")) active.classList.remove("active");

	if (document.find(`#pages li[to="${name}"]`)) document.find(`#pages li[to="${name}"]`).classList.add("active");
	document.find(`#${name}`).classList.add("active");

	if ((name in SETUP_PAGES && !(name in initiatedPages)) || !initiatedPages[name]) {
		await SETUP_PAGES[name]();
		initiatedPages[name] = true;
	}
	if (name in LOAD_PAGES) {
		await LOAD_PAGES[name]();
	}
}

async function setupInitialize() {
	document.find("#pages").classList.add("tt-hidden");

	document.find("#set_api_key").addEventListener("click", () => {
		const key = document.find("#api_key").value;

		checkAPIPermission(key)
			.then((granted) => {
				changeAPIKey(key)
					.then(async () => {
						document.find("#pages").classList.remove("tt-hidden");

						if (granted) {
							// await showPage(settings.pages.popup.defaultTab);
						} else {
							document.find(".permission-error").classList.remove("tt-hidden");
							document.find(".permission-error").textContent = "Your API key is not the correct API level. This will affect a lot of features.";

							setTimeout(() => {
								document.find(".permission-error").classList.add("tt-hidden");
								document.find(".permission-error").textContent = "";

								showPage(settings.pages.popup.defaultTab);
							}, 10 * TO_MILLIS.SECONDS);
						}
					})

					.catch((error) => showError(error.error));
			})
			.catch((error) => showError(error.error));
	});

	document.find("#api_quicklink").addEventListener("click", () => {
		chrome.tabs.update({
			url: "https://www.torn.com/preferences.php#tab=api",
		});
	});

	function showError(message) {
		document.find(".error").classList.remove("tt-hidden");
		document.find(".error").textContent = message;
	}
}

async function setupDashboard() {
	const dashboard = document.find("#dashboard");

	dashboard.find("#mute-notifications").classList.add(settings.notifications.types.global ? "enabled" : "disabled");
	dashboard.find("#mute-notifications i").classList.add(settings.notifications.types.global ? "fa-bell" : "fa-bell-slash");
	dashboard.find("#mute-notifications span").textContent = settings.notifications.types.global ? "Notifications enabled" : "Notifications disabled";
	dashboard.find("#mute-notifications").addEventListener("click", () => {
		const newStatus = !settings.notifications.types.global;

		ttStorage.change({ settings: { notifications: { types: { global: newStatus } } } });

		if (newStatus) {
			dashboard.find("#mute-notifications").classList.add("enabled");
			dashboard.find("#mute-notifications").classList.remove("disabled");
			dashboard.find("#mute-notifications i").classList.add("fa-bell");
			dashboard.find("#mute-notifications i").classList.remove("fa-bell-slash");
			dashboard.find("#mute-notifications span").textContent = "Notifications enabled";
		} else {
			dashboard.find("#mute-notifications").classList.remove("enabled");
			dashboard.find("#mute-notifications").classList.add("disabled");
			dashboard.find("#mute-notifications i").classList.remove("fa-bell");
			dashboard.find("#mute-notifications i").classList.add("fa-bell-slash");
			dashboard.find("#mute-notifications span").textContent = "Notifications disabled";
		}
	});

	updateDashboard();
	storageListeners.userdata.push(updateDashboard);
	updateStakeouts();
	storageListeners.stakeouts.push(updateStakeouts);

	setInterval(() => {
		if (settings.apiUsage.user.bars)
			for (const bar of dashboard.findAll(".bar")) {
				updateBarTimer(bar);
			}
		if (settings.apiUsage.user.cooldowns)
			for (const cooldown of dashboard.findAll(".cooldowns .cooldown")) {
				updateCooldownTimer(cooldown);
			}
		updateUpdateTimer();
		updateStatusTimer();

		for (const countdown of document.findAll(".countdown.automatic[data-seconds]")) {
			const seconds = parseInt(countdown.dataset.seconds) - 1;

			if (seconds <= 0) {
				countdown.textContent = countdown.dataset.doneText || "Ready";
				// delete countdown.dataset.seconds;
				continue;
			}

			countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
			countdown.dataset.seconds = seconds;
		}
	}, 1000);

	dashboard.find(".stakeouts .heading a").href = `${chrome.runtime.getURL("pages/targets/targets.html")}?page=stakeouts`;
	dashboard.find(".stakeouts .heading i").addEventListener("click", () => {
		const stakeoutSection = dashboard.find(".stakeouts .stakeout-list");

		if (stakeoutSection.classList.contains("tt-hidden")) {
			stakeoutSection.classList.remove("tt-hidden");
			dashboard.find(".stakeouts .heading i").classList.add("fa-caret-down");
			dashboard.find(".stakeouts .heading i").classList.remove("fa-caret-right");
		} else {
			stakeoutSection.classList.add("tt-hidden");
			dashboard.find(".stakeouts .heading i").classList.remove("fa-caret-down");
			dashboard.find(".stakeouts .heading i").classList.add("fa-caret-right");
		}
	});

	function updateDashboard() {
		// Country and status
		if (settings.apiUsage.user.travel) updateStatus();
		// Bars
		if (settings.apiUsage.user.bars)
			for (const bar of ["energy", "nerve", "happy", "life", "chain"]) {
				updateBar(bar, userdata[bar]);
			}
		if (settings.apiUsage.user.travel) updateTravelBar();
		// Cooldowns
		if (settings.apiUsage.user.cooldowns)
			for (const cooldown of ["drug", "booster", "medical"]) {
				updateCooldown(cooldown, userdata.cooldowns[cooldown]);
			}
		// Extra information
		updateExtra();
		updateActions();
		setupStakeouts();

		function updateStatus() {
			if (userdata.travel.time_left) {
				dashboard.find("#country").textContent = `Traveling to ${userdata.travel.destination}`;
				dashboard.find(".status-wrap").classList.add("tt-hidden");
			} else {
				dashboard.find("#country").textContent = userdata.travel.destination;

				const status = userdata.status.state === "abroad" ? "okay" : userdata.status.state.toLowerCase();

				dashboard.find("#status").textContent = capitalizeText(status);
				dashboard.find("#status").setAttribute("class", status);
				dashboard.find(".status-wrap").classList.remove("tt-hidden");

				if (userdata.status.until) {
					dashboard.find("#status").dataset.until = userdata.status.until * 1000;
				} else delete dashboard.find("#status").dataset.until;

				updateStatusTimer();
			}
		}

		function updateBar(name, bar) {
			const current = bar ? bar.current : 0;
			let maximum = bar ? bar.maximum : 100;
			let tickAt = (userdata.server_time + (bar ? bar.ticktime : 0)) * 1000;
			let fullAt = (userdata.server_time + bar.fulltime) * 1000;

			if (current === maximum) fullAt = "full";
			else if (current > maximum) fullAt = "over";

			if (name === "chain") {
				if (current === 0) {
					dashboard.find(`#${name}`).classList.add("tt-hidden");
					return;
				}
				dashboard.find(`#${name}`).classList.remove("tt-hidden");

				if (current !== maximum) maximum = getNextChainBonus(current);
				if (bar.cooldown !== 0) {
					dashboard.find(`#${name}`).classList.add("cooldown");
					fullAt = (userdata.server_time + bar.cooldown) * 1000;
					tickAt = (userdata.server_time + bar.cooldown) * 1000;
				} else {
					dashboard.find(`#${name}`).classList.remove("cooldown");
					fullAt = (userdata.server_time + bar.timeout) * 1000;
					tickAt = (userdata.server_time + bar.timeout) * 1000;
				}
			}

			dashboard.find(`#${name} .progress .value`).style.width = `${(current / maximum) * 100}%`;
			dashboard.find(`#${name} .bar-info .bar-label`).textContent = `${current}/${maximum}`;

			dashboard.find(`#${name} .bar-info`).dataset.full_at = fullAt;
			dashboard.find(`#${name} .bar-info`).dataset.tick_at = tickAt;
			if (bar.interval) {
				dashboard.find(`#${name} .bar-info`).dataset.tick_time = bar.interval * 1000;
			}

			updateBarTimer(dashboard.find(`#${name}`));
		}

		function updateTravelBar() {
			if (!userdata.travel.time_left) {
				dashboard.find("#traveling").classList.add("tt-hidden");
				return;
			}
			dashboard.find("#traveling").classList.remove("tt-hidden");

			const maximum = userdata.travel.timestamp - userdata.travel.departed;
			const current = maximum - userdata.travel.time_left;

			dashboard.find("#traveling .progress .value").style.width = `${(current / maximum) * 100}%`;
			dashboard.find("#traveling .bar-info .bar-label").textContent = formatTime(userdata.travel.timestamp * 1000);

			dashboard.find("#traveling .bar-info").dataset.tick_at = userdata.travel.timestamp * 1000;
			dashboard.find("#traveling .bar-info").dataset.full_at = userdata.travel.timestamp * 1000;

			updateBarTimer(dashboard.find("#traveling"));
		}

		function updateCooldown(name, cooldown) {
			dashboard.find(`#${name}-cooldown`).dataset.completed_at = userdata.timestamp && cooldown ? (userdata.timestamp + cooldown) * 1000 : 0;

			updateCooldownTimer(dashboard.find(`#${name}-cooldown`));
		}

		function updateExtra() {
			if (settings.apiUsage.user.newevents)
				dashboard.find(".extra .events .count").textContent = Object.values(userdata.events).filter((event) => !event.seen).length;
			if (settings.apiUsage.user.newmessages)
				dashboard.find(".extra .messages .count").textContent = Object.values(userdata.messages).filter((message) => !message.seen).length;
			if (settings.apiUsage.user.money) dashboard.find(".extra .wallet .count").textContent = `$${formatNumber(userdata.money_onhand)}`;
		}

		function updateActions() {
			dashboard.find("#last-update").dataset.updated_at = userdata.date;

			updateUpdateTimer();
		}

		function setupStakeouts() {
			if (settings.pages.popup.showStakeouts && Object.keys(stakeouts).length && !(Object.keys(stakeouts).length === 1 && stakeouts.date))
				dashboard.find(".stakeouts").classList.remove("tt-hidden");
			else dashboard.find(".stakeouts").classList.add("tt-hidden");
		}
	}

	function updateStatusTimer() {
		const current = Date.now();
		const status = dashboard.find("#status");
		if (!status.dataset.until) return;

		if (status.classList.contains("jail")) {
			status.textContent = `Jailed for ${formatTime({ milliseconds: status.dataset.until - current }, { type: "timer" })}`;
		} else if (status.classList.contains("hospital")) {
			status.textContent = `Hospitalized for ${formatTime({ milliseconds: status.dataset.until - current }, { type: "timer" })}`;
		}
	}

	function updateBarTimer(bar) {
		const name = bar.id;
		const current = Date.now();

		const barInfo = bar.find(".bar-info");
		const dataset = barInfo.dataset;

		let full_at = parseInt(dataset.full_at) || dataset.full_at;
		let tick_at = parseInt(dataset.tick_at);
		if (full_at <= current) full_at = "full";

		if (tick_at <= current) {
			if (name === "traveling" || name === "chain") tick_at = current;
			else tick_at += parseInt(dataset.tick_time);
		}

		let full;
		if (full_at === "full" || full_at === "over") full = "FULL";
		else if (name === "chain" && bar.classList.contains("cooldown"))
			full = `Cooldown over in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", daysToHours: true })}`;
		else if (name === "chain" || (name === "happy" && full_at === "over"))
			full = `${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", hideHours: true })}`;
		else if (name === "traveling") full = `Landing in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer" })}`;
		else {
			full = `Full in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", daysToHours: true })}`;

			if (settings.pages.popup.hoverBarTime) full += ` (${formatTime({ milliseconds: full_at }, { type: "normal" })})`;
		}

		let tick;
		if (name === "traveling") tick = formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer" });
		else if (name === "chain" && bar.classList.contains("cooldown"))
			tick = formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer", daysToHours: true });
		else tick = formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer", hideHours: true });

		if (name === "happy") {
			if (full_at === "over") {
				full = `Resets in ${full}`;
				barInfo.classList.add("reset-timer");
			} else {
				barInfo.classList.remove("reset-timer");
			}
		}

		dataset.full = full;
		dataset.tick = tick;
	}

	function updateCooldownTimer(cooldown) {
		const dataset = cooldown.dataset;
		const current = Date.now();

		const completed_at = !isNaN(parseInt(dataset.completed_at)) ? parseInt(dataset.completed_at) : false;

		cooldown.find(".cooldown-label").textContent = formatTime({ milliseconds: completed_at ? Math.max(completed_at - current, 0) : 0 }, { type: "timer" });
	}

	function updateUpdateTimer() {
		const updatedAt = parseInt(dashboard.find("#last-update").dataset.updated_at);

		dashboard.find("#last-update").textContent = formatTime({ milliseconds: updatedAt }, { type: "ago", agoFilter: TO_MILLIS.SECONDS });
	}

	function updateStakeouts() {
		if (settings.pages.popup.showStakeouts && Object.keys(stakeouts).length && !(Object.keys(stakeouts).length === 1 && stakeouts.date)) {
			dashboard.find(".stakeouts").classList.remove("tt-hidden");

			const stakeoutList = dashboard.find(".stakeouts .stakeout-list");
			stakeoutList.innerHTML = "";

			for (const id in stakeouts) {
				if (isNaN(parseInt(id))) continue;

				let activity, name, lastAction, lifeCurrent, lifeMaximum, state, stateColor;

				if (stakeouts[id].info && Object.keys(stakeouts[id].info).length) {
					activity = stakeouts[id].info.last_action.status;
					name = stakeouts[id].info.name;
					lastAction = stakeouts[id].info.last_action.relative;
					lifeCurrent = stakeouts[id].info.life.current;
					lifeMaximum = stakeouts[id].info.life.maximum;
					state = stakeouts[id].info.status.description;
					stateColor = stakeouts[id].info.status.color;
				} else {
					activity = "N/A";
					name = id;
					lastAction = "N/A";
					lifeCurrent = 0;
					lifeMaximum = 100;
					state = "Unknown";
					stateColor = "gray";
				}

				const removeStakeoutButton = document.newElement({
					type: "div",
					class: "delete-stakeout-wrap",
					children: [document.newElement({ type: "i", class: "delete-stakeout fas fa-trash-alt" })],
				});
				removeStakeoutButton.addEventListener("click", () => {
					delete stakeouts[id];

					ttStorage.set({ stakeouts });
				});

				const lifeBar = document.newElement({
					type: "div",
					children: [
						document.newElement({ type: "span", text: "Life: " }),
						document.newElement({
							type: "div",
							class: "progress",
							children: [
								document.newElement({
									type: "div",
									class: "value",
									style: { width: `${((lifeCurrent / lifeMaximum) * 100).toFixed(0)}%` },
								}),
							],
						}),
					],
				});

				stakeoutList.appendChild(
					document.newElement({
						type: "div",
						class: "user",
						children: [
							document.newElement({
								type: "div",
								class: "row information",
								children: [
									document.newElement({
										type: "div",
										class: "activity",
										children: [
											document.newElement({ type: "span", class: `status ${activity.toLowerCase()}` }),
											document.newElement({
												type: "a",
												href: `https://www.torn.com/profiles.php?XID=${id}`,
												text: name,
												attributes: { target: "_blank" },
											}),
										],
									}),
									removeStakeoutButton,
								],
							}),
							document.newElement({
								type: "div",
								class: "row detailed",
								children: [lifeBar, document.newElement({ type: "span", class: "lastAction", text: `Last action: ${lastAction}` })],
							}),
							document.newElement({
								type: "div",
								class: `row state ${stateColor}`,
								children: [document.newElement({ type: "span", class: "state ", text: state })],
							}),
						],
					})
				);
			}
		} else dashboard.find(".stakeouts").classList.add("tt-hidden");
	}
}

async function setupMarketSearch() {
	// setup itemlist
	const itemSelection = document.find("#market .item-list");

	for (const id in torndata.items) {
		const name = torndata.items[id].name;

		const div = document.newElement({
			type: "li",
			class: "item",
			id: name.toLowerCase().replace(/\s+/g, "").replace(":", "_"),
			text: name,
			dataset: { id },
		});

		itemSelection.appendChild(div);

		// display item if clicked on it
		div.addEventListener("click", async () => {
			itemSelection.classList.add("tt-hidden");

			showMarketInfo(id);
		});
	}

	// setup searchbar
	document.find("#market #search-bar").addEventListener("keyup", (event) => {
		const keyword = event.target.value.toLowerCase();

		if (!keyword) {
			itemSelection.classList.add("tt-hidden");
			return;
		}

		let id;
		if (!isNaN(keyword)) id = parseInt(keyword);

		for (const item of document.findAll("#market .item-list li")) {
			if (item.textContent.toLowerCase().includes(keyword) || (id && parseInt(item.dataset.id) === id)) {
				item.classList.remove("tt-hidden");
				itemSelection.classList.remove("tt-hidden");
			} else {
				item.classList.add("tt-hidden");
			}
		}
	});
	document.find("#market #search-bar").addEventListener("click", (event) => {
		event.target.value = "";

		document.find("#market .item-list").classList.add("tt-hidden");
		document.find("#market #item-information").classList.add("tt-hidden");
	});

	function showMarketInfo(id) {
		const viewItem = document.find("#market #item-information");
		viewItem.find(".market").classList.add("tt-hidden");

		if (ttCache.hasValue("livePrice", id)) {
			handleMarket(ttCache.get("livePrice", id));
		} else {
			fetchData("torn", { section: "market", id, selections: ["bazaar", "itemmarket"] })
				.then((result) => {
					handleMarket(result);

					ttCache.set({ [id]: result }, TO_MILLIS.SECONDS * 30, "livePrice");
				})
				.catch((error) => {
					document.find(".error").classList.remove("tt-hidden");
					document.find(".error").textContent = error.error;
				});
		}

		const item = torndata.items[id];
		viewItem.find(".circulation").textContent = formatNumber(item.circulation);
		viewItem.find(".value").textContent = `$${formatNumber(item.market_value)}`;
		viewItem.find(".name").textContent = item.name;
		viewItem.find(".name").href = `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${item.name}`;
		viewItem.find(".image").src = item.image;

		viewItem.classList.remove("tt-hidden");

		function handleMarket(result) {
			const list = viewItem.find(".market");
			list.innerHTML = "";

			let found = false;

			for (const type of Object.keys(result)) {
				let text;
				if (type === "itemmarket") text = "Item Market";
				else text = capitalizeText(type);

				const wrap = document.newElement({ type: "div" });

				wrap.appendChild(document.newElement({ type: "h4", text }));

				if (result[type]) {
					found = true;

					for (const item of result[type].slice(0, 3)) {
						wrap.appendChild(
							document.newElement({
								type: "div",
								class: "price",
								text: `${item.quantity}x | $${formatNumber(item.cost)}`,
							})
						);
					}
				} else {
					wrap.appendChild(
						document.newElement({
							type: "div",
							class: "price no-price",
							text: "No price found.",
						})
					);
				}

				list.appendChild(wrap);
			}

			if (!isSellable(id) && !found) {
				list.classList.add("untradable");
				list.innerHTML = "Item is not sellable!";
			}
			viewItem.find(".market").classList.remove("tt-hidden");
		}
	}
}

async function loadMarketSearch() {
	document.find("#market #search-bar").focus();
}

async function setupCalculator() {
	const calculator = document.find("#calculator");

	// setup itemlist
	const itemSelection = calculator.find(".item-list");

	let selectedItems = localdata.popup.calculatorItems;

	for (const id in torndata.items) {
		const name = torndata.items[id].name;

		const identifier = `calculator-${id}`;

		itemSelection.appendChild(
			document.newElement({
				type: "li",
				class: "item",
				id: name.toLowerCase().replace(/\s+/g, "").replace(":", "_"),
				children: [
					document.newElement({ type: "label", text: name, attributes: { for: identifier } }),
					document.newElement({
						type: "input",
						id: identifier,
						attributes: { type: "number" },
						events: {
							input(event) {
								let item = selectedItems.find((i) => i.id === id);

								const amount = event.target.value;
								if (amount === "") {
									if (item) {
										selectedItems = selectedItems.filter((i) => i.id !== id);
										updateSelection();
									}

									return;
								}

								if (!item) {
									item = { id };
									selectedItems.push(item);
								}
								item.amount = parseInt(amount);
								updateSelection();
							},
						},
					}),
				],
			})
		);
	}

	// setup searchbar
	const search = calculator.find(".search");
	search.addEventListener("keyup", (event) => {
		const keyword = event.target.value.toLowerCase();

		if (!keyword) {
			itemSelection.classList.add("tt-hidden");
			return;
		}

		for (const item of calculator.findAll(".item-list > li")) {
			if (item.textContent.toLowerCase().includes(keyword)) {
				item.classList.remove("tt-hidden");
				itemSelection.classList.remove("tt-hidden");
			} else {
				item.classList.add("tt-hidden");
			}
		}
	});
	search.addEventListener("click", (event) => {
		event.target.value = "";

		calculator.find(".item-list").classList.add("tt-hidden");
	});

	const clear = calculator.find(".clear");
	clear.addEventListener("click", () => {
		selectedItems = [];

		updateSelection();
	});

	updateSelection();

	function updateSelection() {
		const receipt = calculator.find(".receipt");
		receipt.innerHTML = "";

		if (!selectedItems.length) {
			clear.classList.add("tt-hidden");
			ttStorage.change({ localdata: { popup: { calculatorItems: [] } } });
			return;
		}
		clear.classList.remove("tt-hidden");

		const items = document.newElement({ type: "ul" });

		let totalValue = 0;
		for (const { id, amount } of selectedItems) {
			const { market_value: value, name } = torndata.items[id];
			const price = amount * value;

			items.appendChild(
				document.newElement({
					type: "li",
					children: [
						document.newElement({ type: "span", class: "amount", text: `${formatNumber(amount)}x` }),
						document.newElement({ type: "span", class: "item", text: name }),
						document.createTextNode("="),
						document.newElement({ type: "span", class: "price", text: formatNumber(price, { currency: true, decimals: 0 }) }),
					],
				})
			);

			totalValue += price;
		}

		receipt.appendChild(items);
		receipt.appendChild(document.newElement({ type: "div", class: "total", text: `Total: ${formatNumber(totalValue, { currency: true, decimals: 0 })}` }));

		ttStorage.change({ localdata: { popup: { calculatorItems: selectedItems } } });
	}
}

async function loadCalculator() {
	document.find("#calculator .search").focus();
}

async function setupStocksOverview() {
	const stocksOverview = document.find("#stocks");
	const allStocks = stocksOverview.find("#all-stocks");

	for (let id in stockdata) {
		if (id === "date") continue;
		id = parseInt(id);

		allStocks.appendChild(buildSection(id));
	}

	// setup searchbar
	stocksOverview.find("#stock-search-bar").addEventListener("keyup", (event) => {
		const keyword = event.target.value.toLowerCase();

		if (!keyword) {
			for (const item of allStocks.findAll(".stock-wrap[data-user='false']")) {
				item.classList.add("tt-hidden");
			}
			for (const item of allStocks.findAll(".stock-wrap[data-user='true']")) {
				item.classList.remove("tt-hidden");
			}
			return;
		}

		for (const item of allStocks.findAll(".stock-wrap")) {
			if (keyword === "*" || item.dataset.name.includes(keyword)) {
				item.classList.remove("tt-hidden");
			} else {
				item.classList.add("tt-hidden");
			}
		}
	});
	stocksOverview.find("#stock-search-bar").addEventListener("click", (event) => {
		event.target.value = "";

		for (const item of allStocks.findAll(".stock-wrap[data-user='false']")) {
			item.classList.add("tt-hidden");
		}
		for (const item of allStocks.findAll(".stock-wrap[data-user='true']")) {
			item.classList.remove("tt-hidden");
		}
	});

	for (const item of allStocks.findAll(".stock-wrap[data-user='false']")) {
		item.classList.add("tt-hidden");
	}

	function buildSection(id) {
		const stock = stockdata[id];
		const userStock = settings.apiUsage.user.stocks ? userdata.stocks[id] || false : false;

		const wrapper = document.newElement({
			type: "div",
			class: "stock-wrap",
			dataset: { name: `${stock.name} (${stock.acronym})`.toLowerCase(), user: !!userStock },
			children: [document.newElement("hr")],
		});

		let boughtPrice, profit;
		if (userStock) {
			boughtPrice = getStockBoughtPrice(userStock).boughtPrice;
			profit = ((stock.current_price - boughtPrice) * userStock.total_shares).dropDecimals();
		}

		createHeading();
		createPriceInformation();
		createBenefitInformation();
		createAlertsSection();

		return wrapper;

		function createHeading() {
			const heading = document.newElement({
				type: "a",
				class: "heading",
				href: `https://www.torn.com/stockexchange.php?stock=${stock.acronym}`,
				attributes: { target: "_blank" },
				children: [
					document.newElement({
						type: "span",
						class: "name",
						text: `${stock[stock.name.length > 35 ? "acronym" : "name"]}`,
					}),
					document.newElement("br"),
				],
			});
			wrapper.appendChild(heading);

			if (userStock) {
				heading.appendChild(
					document.newElement({
						type: "span",
						class: "quantity",
						text: `(${formatNumber(userStock.total_shares, { shorten: 2 })} share${applyPlural(userStock.total_shares)})`,
					})
				);
				wrapper.appendChild(
					document.newElement({
						type: "div",
						class: `profit ${getProfitClass(profit)}`,
						text: `${getProfitIndicator(profit)}${formatNumber(Math.abs(profit), { currency: true })}`,
					})
				);
			}

			function getProfitClass(profit) {
				return profit > 0 ? "positive" : profit < 0 ? "negative" : "";
			}

			function getProfitIndicator(profit) {
				return profit > 0 ? "+" : profit < 0 ? "-" : "";
			}
		}

		function createPriceInformation() {
			const priceContent = document.newElement({
				type: "div",
				class: "content price tt-hidden",
				children: [
					document.newElement({
						type: "span",
						text: `Current price: ${formatNumber(stock.current_price, { decimals: 3, currency: true })}`,
					}),
					document.newElement({
						type: "span",
						text: `Total shares: ${formatNumber(stock.total_shares)}`,
					}),
				],
			});
			wrapper.append(
				document.newElement({
					type: "div",
					class: "information-section",
					children: [getHeadingElement("Price Information", priceContent), priceContent],
				})
			);

			if (userStock) {
				priceContent.appendChild(document.newElement({ type: "div", class: "flex-break" }));
				priceContent.appendChild(
					document.newElement({
						type: "span",
						text: `Bought at: ${formatNumber(boughtPrice, { decimals: 3, currency: true })}`,
					})
				);
			}
		}

		function createBenefitInformation() {
			const benefitContent = document.newElement({
				type: "div",
				class: "content benefit tt-hidden",
				children: [],
			});
			wrapper.append(
				document.newElement({
					type: "div",
					class: "information-section",
					children: [getHeadingElement("Benefit Information", benefitContent), benefitContent],
				})
			);

			if (userStock) {
				if (isDividendStock(id)) {
					benefitContent.appendChild(
						document.newElement({
							type: "span",
							text: userStock.dividend
								? userStock.dividend.ready
									? "Ready now!"
									: `Available in ${stock.benefit.frequency - userStock.dividend.progress}/${stock.benefit.frequency} days.`
								: `Available every ${stock.benefit.frequency} days.`,
						})
					);

					benefitContent.appendChild(createRoiTable(stock, userStock));
				} else {
					benefitContent.appendChild(
						document.newElement({
							type: "span",
							text: `Required stocks: ${formatNumber(userStock.total_shares)}/${formatNumber(stock.benefit.requirement)}`,
						})
					);
					benefitContent.appendChild(document.newElement("br"));

					let color;
					let duration;

					if (userStock.benefit) {
						if (userStock.benefit.ready) {
							color = "completed";
						} else {
							color = "awaiting";
							duration = `in ${userStock.benefit.progress}/${stock.benefit.frequency} days.`;
						}
					} else {
						color = "not-completed";
						duration = `after ${stock.benefit.frequency} days.`;
					}

					benefitContent.appendChild(document.newElement({ type: "span", class: `description ${color}`, text: `${stock.benefit.description}` }));
					if (duration) benefitContent.appendChild(document.newElement({ type: "span", class: "duration", text: duration }));
				}
			} else {
				if (isDividendStock(id)) {
					benefitContent.appendChild(
						document.newElement({
							type: "span",
							text: `Available every ${stock.benefit.frequency} days.`,
						})
					);

					benefitContent.appendChild(createRoiTable(stock, undefined));
				} else {
					benefitContent.appendChild(document.newElement({ type: "span", text: `Required stocks: ${formatNumber(stock.benefit.requirement)}` }));
					benefitContent.appendChild(document.newElement("br"));
					benefitContent.appendChild(document.newElement({ type: "span", class: "description not-completed", text: `${stock.benefit.description}` }));
					benefitContent.appendChild(document.newElement({ type: "span", class: "duration", text: `after ${stock.benefit.frequency} days.` }));
				}
			}
		}

		function createAlertsSection() {
			const alertsContent = document.newElement({
				type: "div",
				class: "content alerts tt-hidden",
				children: [],
			});
			wrapper.append(
				document.newElement({
					type: "div",
					class: "information-section",
					children: [getHeadingElement("Alerts", alertsContent), alertsContent],
				})
			);

			alertsContent.appendChild(document.newElement({ type: "span", class: "title", text: "Price" }));
			alertsContent.appendChild(
				document.newElement({
					type: "div",
					children: [
						document.newElement({ type: "label", attributes: { for: `stock-${id}-alert__reaches` }, text: "reaches" }),
						document.newElement({
							type: "input",
							id: `stock-${id}-alert__reaches`,
							attributes: { type: "number", min: 0 },
							value: () => {
								if (!(id in settings.notifications.types.stocks)) return "";

								return settings.notifications.types.stocks[id].priceReaches || "";
							},
							events: {
								change: async (event) => {
									await ttStorage.change({
										settings: {
											notifications: { types: { stocks: { [id]: { priceReaches: parseFloat(event.target.value) } } } },
										},
									});
								},
							},
						}),
					],
				})
			);
			alertsContent.appendChild(
				document.newElement({
					type: "div",
					children: [
						document.newElement({ type: "label", attributes: { for: `stock-${id}-alert__falls` }, text: "falls to" }),
						document.newElement({
							type: "input",
							id: `stock-${id}-alert__falls`,
							attributes: { type: "number", min: 0 },
							value: () => {
								if (!(id in settings.notifications.types.stocks)) return "";

								return settings.notifications.types.stocks[id].priceFalls || "";
							},
							events: {
								change: async (event) => {
									await ttStorage.change({
										settings: {
											notifications: { types: { stocks: { [id]: { priceFalls: parseFloat(event.target.value) } } } },
										},
									});
								},
							},
						}),
					],
				})
			);
		}

		function getHeadingElement(title, content) {
			return document.newElement({
				type: "div",
				class: "heading",
				children: [
					document.newElement({ type: "span", class: "title", text: title }),
					document.newElement({ type: "i", class: "fas fa-chevron-down" }),
				],
				events: {
					click: (event) => {
						content.classList[content.classList.contains("tt-hidden") ? "remove" : "add"]("tt-hidden");

						rotateElement((event.target.classList.contains("heading") ? event.target : event.target.parentElement).find("i"), 180);
					},
				},
			});
		}

		function createRoiTable(stock, userStock) {
			const benefitTable = document.newElement({
				type: "table",
				children: [
					document.newElement({
						type: "tr",
						children: [
							document.newElement({ type: "th", text: "Increment" }),
							document.newElement({ type: "th", text: "Stocks" }),
							document.newElement({ type: "th", text: "Cost" }),
							document.newElement({ type: "th", text: "Reward" }),
							document.newElement({ type: "th", text: "ROI" }),
						],
					}),
				],
			});

			let ownedLevel, activeLevel;
			if (userStock) {
				ownedLevel = getStockIncrement(stock.benefit.requirement, userStock.total_shares);
				activeLevel = userStock.dividend ? userStock.dividend.increment : 0;
			} else {
				ownedLevel = 0;
				activeLevel = 0;
			}

			const rewardValue = getRewardValue(stock.benefit.description);
			const yearlyValue = (rewardValue / stock.benefit.frequency) * 365;
			for (let i = 0; i < 5; i++) {
				const level = i + 1;
				const stocks = getRequiredStocks(stock.benefit.requirement, level);
				const previousStocks = getRequiredStocks(stock.benefit.requirement, level - 1);
				const reward = getStockReward(stock.benefit.description, level);

				const roi = (yearlyValue / ((stocks - previousStocks) * stock.current_price)) * 100;

				benefitTable.appendChild(
					document.newElement({
						type: "tr",
						class: ["increment", level <= ownedLevel ? (level <= activeLevel ? "completed" : "awaiting") : ""],
						children: [
							document.newElement({ type: "td", text: level }),
							document.newElement({ type: "td", text: formatNumber(stocks) }),
							document.newElement({ type: "td", text: formatNumber(stocks * stock.current_price, { decimals: 0, currency: true }) }),
							document.newElement({ type: "td", text: reward }),
							document.newElement({ type: "td", text: rewardValue > 0 ? `${formatNumber(roi, { decimals: 1 })}%` : "N/A" }),
						],
					})
				);
			}

			return benefitTable;
		}
	}
}

async function setupNotifications() {
	const notifications = document.find("#notifications ul");

	notificationHistory.map(createEntry).forEach((entry) => notifications.appendChild(entry));

	function createEntry(notification) {
		const { message, date } = notification;
		const title = notification.title.replace("TornTools - ", "");

		return document.newElement({
			type: "li",
			children: [
				document.newElement({
					type: "div",
					class: "title",
					children: [document.newElement({ type: "span", text: title }), document.newElement({ type: "span", text: formatTime(date) })],
				}),
				document.newElement({ type: "span", text: message }),
			],
		});
	}
}
