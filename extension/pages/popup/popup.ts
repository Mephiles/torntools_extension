const SETUP_PAGES = {
	initialize: setupInitialize,
	dashboard: setupDashboard,
	market: setupMarketSearch,
	calculator: setupCalculator,
	stocks: setupStocksOverview,
	notifications: setupNotifications,
} as const satisfies Record<string, () => Promise<void>>;
const LOAD_PAGES = {
	market: loadMarketSearch,
	calculator: loadCalculator,
} as const satisfies Record<string, () => Promise<void>>;

// @ts-ignore Detects reassignment, but those pages are never loaded in the same context.
const initiatedPages: string[] = [];

(async () => {
	document.body.style.minWidth = `${Math.min(416, screen.availWidth * 0.8)}px`;

	showLoadingPlaceholder(document.body, true);

	const database = await loadDatabase();
	notificationHistory = database.notificationHistory;

	document.body.classList.add(getPageTheme());

	handleAPIError();
	storageListeners.api.push(handleAPIError);

	for (const navigation of findAllElements("#pages .main-nav li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
	document.querySelector("#pages .right-nav li[to='settings']").addEventListener("click", () => chrome.runtime.openOptionsPage());

	if (!settings.pages.popup.dashboard) document.querySelector("#pages li[to='dashboard']").classList.add("tt-hidden");
	if (!settings.pages.popup.marketSearch) document.querySelector("#pages li[to='market']").classList.add("tt-hidden");
	if (!settings.pages.popup.calculator) document.querySelector("#pages li[to='calculator']").classList.add("tt-hidden");
	if (!settings.pages.popup.stocksOverview) document.querySelector("#pages li[to='stocks']").classList.add("tt-hidden");
	if (!settings.pages.popup.notifications) document.querySelector("#pages li[to='notifications']").classList.add("tt-hidden");

	if (!api.torn.key) {
		await showPage("initialize");
	} else {
		await showPage(settings.pages.popup.defaultTab);
	}

	showLoadingPlaceholder(document.body, false);
	document.body.classList.remove("loading");

	function handleAPIError() {
		if (api.torn.error) {
			document.querySelector(".error").classList.remove("tt-hidden");
			document.querySelector(".error").textContent = api.torn.error;
		} else {
			document.querySelector(".error").classList.add("tt-hidden");
			document.querySelector(".error").textContent = "";
		}
	}
})();

// @ts-ignore Detects reassignment, but those pages are never loaded in the same context.
async function showPage(name: keyof typeof SETUP_PAGES) {
	document.querySelector(`#${name}`).classList.add("active");

	for (const active of findAllElements("body > main.subpage.active, #pages li.active")) active.classList.remove("active");

	if (document.querySelector(`#pages li[to="${name}"]`)) document.querySelector(`#pages li[to="${name}"]`).classList.add("active");
	document.querySelector(`#${name}`).classList.add("active");

	if (name in SETUP_PAGES && !initiatedPages.includes(name)) {
		await SETUP_PAGES[name]();
		initiatedPages.push(name);
	}
	if (name in LOAD_PAGES) {
		await LOAD_PAGES[name]();
	}
}

async function setupInitialize() {
	document.querySelector("#pages").classList.add("tt-hidden");
	document.querySelector<HTMLAnchorElement>("#tos").href = chrome.runtime.getURL("pages/tos/tos.html");

	document
		.querySelector("#import-previous-settings")
		.addEventListener("click", () => window.open(chrome.runtime.getURL("pages/settings/settings.html?page=export")));

	document.querySelector("#set_api_key").addEventListener("click", () => {
		const key = document.querySelector<HTMLInputElement>("#api_key").value;

		checkAPIPermission(key)
			.then(({ access }) => {
				if (!access) {
					const permissionError = document.querySelector(".permission-error");
					permissionError.classList.remove("tt-hidden");
					permissionError.textContent =
						"TornTools needs a limited access key. Your API key is not the correct API level. This will affect a lot of features.";

					setTimeout(() => {
						permissionError.classList.add("tt-hidden");
						permissionError.textContent = "";
					}, 10 * TO_MILLIS.SECONDS);

					return;
				}

				changeAPIKey(key)
					.then(async () => {
						document.querySelector("#pages").classList.remove("tt-hidden");

						console.log("TT just got initialised, initial popup data load.");
						// Wait till userdata loads for the first time.
						new Promise(async () => {
							while (!userdata.timestamp) {
								await sleep(TO_MILLIS.SECONDS);
							}

							await showPage(settings.pages.popup.defaultTab);
						});
					})
					.catch((error) => showError(error.error));
			})
			.catch((error) => showError(error.error));
	});

	document.querySelector("#api_quicklink").addEventListener("click", () => {
		chrome.tabs.update({
			url: "https://www.torn.com/preferences.php#tab=api",
		});
	});

	function showError(message: string) {
		document.querySelector(".error").classList.remove("tt-hidden");
		document.querySelector(".error").textContent = message;
	}
}

async function setupDashboard() {
	const dashboard = document.querySelector("#dashboard");

	const iconsWrap = dashboard.querySelector(".icons-wrap");
	for (const { icon, id, description, ...r } of ALL_ICONS) {
		let url = "url" in r ? r.url : null;

		iconsWrap.appendChild(
			elementBuilder({
				type: url ? "a" : "div",
				class: ["icon", "tt-hidden", "hover_tooltip"],
				children: [
					elementBuilder({ type: "div", class: icon, style: { backgroundPosition: `-${(id - 1) * 18}px 0` } }),
					elementBuilder({ type: "span", class: "hover_tooltip_text", text: description }),
				],
				attributes: url ? { href: url, target: "_blank" } : {},
			})
		);
	}

	dashboard.querySelector("#mute-notifications").classList.add(settings.notifications.types.global ? "enabled" : "disabled");
	dashboard.querySelector("#mute-notifications i").classList.add(settings.notifications.types.global ? "fa-bell" : "fa-bell-slash");
	dashboard.querySelector("#mute-notifications span").textContent = settings.notifications.types.global ? "Notifications enabled" : "Notifications disabled";
	dashboard.querySelector("#mute-notifications").addEventListener("click", () => {
		const newStatus = !settings.notifications.types.global;

		ttStorage.change({ settings: { notifications: { types: { global: newStatus } } } });

		if (newStatus) {
			dashboard.querySelector("#mute-notifications").classList.add("enabled");
			dashboard.querySelector("#mute-notifications").classList.remove("disabled");
			dashboard.querySelector("#mute-notifications i").classList.add("fa-bell");
			dashboard.querySelector("#mute-notifications i").classList.remove("fa-bell-slash");
			dashboard.querySelector("#mute-notifications span").textContent = "Notifications enabled";
		} else {
			dashboard.querySelector("#mute-notifications").classList.remove("enabled");
			dashboard.querySelector("#mute-notifications").classList.add("disabled");
			dashboard.querySelector("#mute-notifications i").classList.remove("fa-bell");
			dashboard.querySelector("#mute-notifications i").classList.add("fa-bell-slash");
			dashboard.querySelector("#mute-notifications span").textContent = "Notifications disabled";
		}
	});

	updateDashboard();
	storageListeners.userdata.push(updateDashboard);
	updateStakeouts();
	storageListeners.stakeouts.push(updateStakeouts);
	updateFactionStakeouts();
	storageListeners.factionStakeouts.push(updateFactionStakeouts);

	setInterval(() => {
		if (settings.apiUsage.user.bars)
			for (const bar of findAllElements(".bar", dashboard)) {
				updateBarTimer(bar);
			}
		if (settings.apiUsage.user.cooldowns)
			for (const cooldown of findAllElements(".cooldowns .cooldown", dashboard)) {
				updateCooldownTimer(cooldown);
			}
		updateUpdateTimer();
		updateStatusTimer();

		for (const countdown of findAllElements(".countdown.automatic[data-seconds]")) {
			const seconds = parseInt(countdown.dataset.seconds) - 1;

			if (seconds <= 0) {
				countdown.textContent = countdown.dataset.doneText || "Ready";
				// delete countdown.dataset.seconds;
				continue;
			}

			countdown.textContent = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
			countdown.dataset.seconds = seconds.toString();
		}
	}, 1000);

	dashboard.querySelector<HTMLAnchorElement>(".stakeouts .heading a").href = `${chrome.runtime.getURL("pages/targets/targets.html")}?page=stakeouts`;
	dashboard.querySelector(".stakeouts .heading i").addEventListener("click", () => {
		const stakeoutSection = dashboard.querySelector(".stakeouts .stakeout-list");

		if (stakeoutSection.classList.contains("tt-hidden")) {
			stakeoutSection.classList.remove("tt-hidden");
			dashboard.querySelector(".stakeouts .heading i").classList.add("fa-caret-down");
			dashboard.querySelector(".stakeouts .heading i").classList.remove("fa-caret-right");
		} else {
			stakeoutSection.classList.add("tt-hidden");
			dashboard.querySelector(".stakeouts .heading i").classList.remove("fa-caret-down");
			dashboard.querySelector(".stakeouts .heading i").classList.add("fa-caret-right");
		}
	});
	dashboard.querySelector(".faction-stakeouts .heading i").addEventListener("click", () => {
		const factionStakeoutSection = dashboard.querySelector(".faction-stakeouts .stakeout-list");

		if (factionStakeoutSection.classList.contains("tt-hidden")) {
			factionStakeoutSection.classList.remove("tt-hidden");
			dashboard.querySelector(".faction-stakeouts .heading i").classList.add("fa-caret-down");
			dashboard.querySelector(".faction-stakeouts .heading i").classList.remove("fa-caret-right");
		} else {
			factionStakeoutSection.classList.add("tt-hidden");
			dashboard.querySelector(".faction-stakeouts .heading i").classList.remove("fa-caret-down");
			dashboard.querySelector(".faction-stakeouts .heading i").classList.add("fa-caret-right");
		}
	});

	function updateDashboard() {
		// Country and status
		if (settings.apiUsage.user.travel) updateStatus();

		// Icons
		if (settings.apiUsage.user.icons) updateIcons();

		// Bars
		if (settings.apiUsage.user.bars) {
			updateBar("energy", userdata.energy);
			updateBar("nerve", userdata.nerve);
			updateBar("happy", userdata.happy);
			updateBar("life", userdata.life);

			updateChainBar(userdata.chain);
		}

		if (settings.apiUsage.user.travel) updateTravelBar();
		// Cooldowns
		if (settings.apiUsage.user.cooldowns) {
			updateCooldown("drug", userdata.cooldowns.drug);
			updateCooldown("booster", userdata.cooldowns.booster);
			updateCooldown("medical", userdata.cooldowns.medical);
		}
		// Extra information
		updateExtra();
		updateActions();
		setupStakeouts();
		setupFactionStakeouts();

		function updateStatus() {
			if (userdata.travel.time_left) {
				dashboard.querySelector("#country").textContent = `Traveling to ${userdata.travel.destination}`;
				dashboard.querySelector(".status-wrap").classList.add("tt-hidden");
			} else {
				dashboard.querySelector("#country").textContent = userdata.travel.destination;

				const status = userdata.profile.status.state.toLowerCase() === "abroad" ? "okay" : userdata.profile.status.state.toLowerCase();

				dashboard.querySelector("#status").textContent = capitalizeText(status);
				dashboard.querySelector("#status").setAttribute("class", status);
				dashboard.querySelector(".status-wrap").classList.remove("tt-hidden");

				if (userdata.profile.status.until) {
					dashboard.querySelector<HTMLElement>("#status").dataset.until = (userdata.profile.status.until * 1000).toString();
				} else delete dashboard.querySelector<HTMLElement>("#status").dataset.until;

				updateStatusTimer();
			}
		}

		function updateIcons() {
			if (!settings.pages.popup.showIcons) {
				iconsWrap.classList.add("tt-hidden");
				findAllElements(".countdown.automatic").forEach((x) => x.classList.remove("countdown"));
				return;
			}

			iconsWrap.classList.remove("tt-hidden");
			[...iconsWrap.children].forEach((icon) => {
				if (settings.hideIcons.includes(icon.children[0].className)) {
					icon.classList.add("tt-hidden");
					return;
				}

				if (Object.keys(userdata.icons).includes(icon.children[0].className)) {
					icon.classList.remove("tt-hidden");

					let iconText = userdata.icons[icon.children[0].className];
					let iconHTML: string;

					if (iconText.includes(" - ") && iconText.includes(" seconds")) {
						let timeSplits = iconText.split(" - ");
						let time: string, text: string;

						if (timeSplits.length > 2) {
							time = timeSplits[timeSplits.length - 1];
							text = timeSplits.slice(0, -1).join(" - ");
						} else {
							text = timeSplits[0];
							time = timeSplits[1];
						}

						iconHTML =
							text +
							" - " +
							`<span class="countdown automatic" data-seconds="${(textToTime(time) - (Date.now() - userdata.timestamp * 1000)) / 1000}" data-time-settings='{ "type": "wordTimer", "showDays": true }'>
							${time}
							</span>`;
					} else iconHTML = iconText;

					icon.children[1].innerHTML = iconHTML;
				} else icon.classList.add("tt-hidden");
			});
		}

		function updateBar(name: string, bar: UserV1Bar) {
			const current = bar ? bar.current : 0;
			let maximum = bar ? bar.maximum : 100;
			let tickAt: string | number = (userdata.server_time + (bar ? bar.ticktime : 0)) * 1000;
			let fullAt: string | number = (userdata.server_time + bar.fulltime) * 1000;

			if (current === maximum) fullAt = "full";
			else if (current > maximum) fullAt = "over";

			dashboard.querySelector<HTMLElement>(`#${name} .progress .value`).style.width = `${(current / maximum) * 100}%`;
			dashboard.querySelector(`#${name} .bar-info .bar-label`).textContent = `${current}/${maximum}`;

			dashboard.querySelector<HTMLElement>(`#${name} .bar-info`).dataset.full_at = fullAt.toString();
			dashboard.querySelector<HTMLElement>(`#${name} .bar-info`).dataset.tick_at = tickAt.toString();
			if (bar.interval) {
				dashboard.querySelector<HTMLElement>(`#${name} .bar-info`).dataset.tick_time = (bar.interval * 1000).toString();
			}

			updateBarTimer(dashboard.querySelector(`#${name}`));
		}

		function updateChainBar(bar: UserV1ChainBar) {
			const current = bar ? bar.current : 0;

			if (current === 0) {
				dashboard.querySelector("#chain").classList.add("tt-hidden");
				return;
			}
			dashboard.querySelector("#chain").classList.remove("tt-hidden");

			let maximum = bar ? bar.maximum : 100;
			if (current !== maximum) maximum = getNextChainBonus(current);

			let tickAt: string | number;
			let fullAt: string | number;
			if (bar.cooldown !== 0) {
				dashboard.querySelector("#chain").classList.add("cooldown");
				fullAt = (userdata.server_time + bar.cooldown) * 1000;
				tickAt = (userdata.server_time + bar.cooldown) * 1000;
			} else {
				dashboard.querySelector("#chain").classList.remove("cooldown");
				fullAt = (userdata.server_time + bar.timeout) * 1000;
				tickAt = (userdata.server_time + bar.timeout) * 1000;
			}

			dashboard.querySelector<HTMLElement>(`#chain .progress .value`).style.width = `${(current / maximum) * 100}%`;
			dashboard.querySelector(`#chain .bar-info .bar-label`).textContent = `${current}/${maximum}`;

			dashboard.querySelector<HTMLElement>(`#chain .bar-info`).dataset.full_at = fullAt.toString();
			dashboard.querySelector<HTMLElement>(`#chain .bar-info`).dataset.tick_at = tickAt.toString();

			updateBarTimer(dashboard.querySelector("#chain"));
		}

		function updateTravelBar() {
			if (!userdata.travel.time_left) {
				dashboard.querySelector("#traveling").classList.add("tt-hidden");
				return;
			}
			dashboard.querySelector("#traveling").classList.remove("tt-hidden");

			const maximum = userdata.travel.arrival_at - userdata.travel.departed_at;
			const current = maximum - userdata.travel.time_left;

			dashboard.querySelector<HTMLElement>("#traveling .progress .value").style.width = `${(current / maximum) * 100}%`;
			dashboard.querySelector("#traveling .bar-info .bar-label").textContent = formatTime(userdata.travel.arrival_at * 1000);

			dashboard.querySelector<HTMLElement>("#traveling .bar-info").dataset.tick_at = (userdata.travel.arrival_at * 1000).toString();
			dashboard.querySelector<HTMLElement>("#traveling .bar-info").dataset.full_at = (userdata.travel.arrival_at * 1000).toString();

			updateBarTimer(dashboard.querySelector("#traveling"));
		}

		function updateCooldown(name: string, cooldown: number) {
			dashboard.querySelector<HTMLElement>(`#${name}-cooldown`).dataset.completed_at = (
				userdata.timestamp && cooldown ? (userdata.timestamp + cooldown) * 1000 : 0
			).toString();

			updateCooldownTimer(dashboard.querySelector(`#${name}-cooldown`));
		}

		function updateExtra() {
			if (settings.apiUsage.user.newevents) dashboard.querySelector(".extra .events .count").textContent = userdata.notifications.events.toString();
			if (settings.apiUsage.user.newmessages)
				dashboard.querySelector(".extra .messages .count").textContent = Object.values(userdata.messages)
					.filter((message) => !message.seen)
					.length.toString();
			if (settings.apiUsage.user.money) dashboard.querySelector(".extra .wallet .count").textContent = `$${formatNumber(userdata.money.wallet)}`;
		}

		function updateActions() {
			dashboard.querySelector<HTMLElement>("#last-update").dataset.updated_at = userdata.date.toString();

			updateUpdateTimer();
		}

		function setupStakeouts() {
			if (
				settings.pages.popup.showStakeouts &&
				Object.keys(stakeouts).length &&
				!(Object.keys(stakeouts).length === 2 && stakeouts.date && stakeouts.order)
			)
				dashboard.querySelector(".stakeouts").classList.remove("tt-hidden");
			else dashboard.querySelector(".stakeouts").classList.add("tt-hidden");
		}

		function setupFactionStakeouts() {
			if (
				settings.pages.popup.showStakeouts &&
				Object.keys(factionStakeouts).length &&
				!(Object.keys(factionStakeouts).length === 1 && factionStakeouts.date)
			)
				dashboard.querySelector(".faction-stakeouts").classList.remove("tt-hidden");
			else dashboard.querySelector(".faction-stakeouts").classList.add("tt-hidden");
		}
	}

	function updateStatusTimer() {
		const current = Date.now();
		const status = dashboard.querySelector<HTMLElement>("#status");
		if (!status.dataset.until) return;

		if (status.classList.contains("jail")) {
			const until: number = parseInt(status.dataset.until);
			status.textContent = `Jailed for ${formatTime({ milliseconds: until - current }, { type: "timer", showDays: true, short: true })}`;
		} else if (status.classList.contains("hospital")) {
			const until: number = parseInt(status.dataset.until);
			status.textContent = `Hospitalized for ${formatTime({ milliseconds: until - current }, { type: "timer", showDays: true, short: true })}`;
		}
	}

	function updateBarTimer(bar: Element) {
		const name = bar.id;
		const current = Date.now();

		const barInfo = bar.querySelector<HTMLElement>(".bar-info");
		const dataset = barInfo.dataset;

		let full_at = parseInt(dataset.full_at) || dataset.full_at;
		let tick_at = parseInt(dataset.tick_at);
		if (typeof full_at === "number" && full_at <= current) full_at = "full";

		if (tick_at <= current) {
			if (name === "traveling" || name === "chain") tick_at = current;
			else tick_at += parseInt(dataset.tick_time);
		}

		let full: string;
		if (name === "happy" && full_at === "over") full = `${formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer", hideHours: true })}`;
		else if (typeof full_at === "string") full = "FULL";
		else if (name === "chain" && bar.classList.contains("cooldown"))
			full = `Cooldown over in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", daysToHours: true })}`;
		else if (name === "chain") full = `${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", hideHours: true })}`;
		else if (name === "traveling") full = `Landing in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer" })}`;
		else {
			full = `Full in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", daysToHours: true })}`;

			if (settings.pages.popup.hoverBarTime) full += ` (${formatTime({ milliseconds: full_at }, { type: "normal" })})`;
		}

		let tick: string;
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

	function updateCooldownTimer(cooldown: HTMLElement) {
		const dataset = cooldown.dataset;
		const current = Date.now();

		const completed_at = !isNaN(parseInt(dataset.completed_at)) ? parseInt(dataset.completed_at) : false;

		cooldown.querySelector(".cooldown-label").textContent = formatTime(
			{ milliseconds: completed_at ? Math.max(completed_at - current, 0) : 0 },
			{ type: "timer", daysToHours: true }
		);
	}

	function updateUpdateTimer() {
		const updatedAt = parseInt(dashboard.querySelector<HTMLElement>("#last-update").dataset.updated_at);

		dashboard.querySelector("#last-update").textContent = formatTime({ milliseconds: updatedAt }, { type: "ago", agoFilter: TO_MILLIS.SECONDS });
	}

	function updateStakeouts() {
		if (
			settings.pages.popup.showStakeouts &&
			Object.keys(stakeouts).length &&
			!(Object.keys(stakeouts).length === 2 && stakeouts.date && stakeouts.order)
		) {
			dashboard.querySelector(".stakeouts").classList.remove("tt-hidden");

			const stakeoutList = dashboard.querySelector(".stakeouts .stakeout-list");
			stakeoutList.innerHTML = "";

			for (const id of stakeouts.order) {
				const stakeout = stakeouts[id];
				if (typeof stakeout !== "object" || Array.isArray(stakeout)) continue;

				let activity: string, name: string, lastAction: string, lifeCurrent: number, lifeMaximum: number, state: string, stateColor: string;

				if (stakeout && Object.keys(stakeout).length) {
					activity = stakeout.info.last_action.status;
					name = stakeout.info.name;
					lastAction = stakeout.info.last_action.relative;
					lifeCurrent = stakeout.info.life.current;
					lifeMaximum = stakeout.info.life.maximum;
					state = stakeout.info.status.description;
					stateColor = stakeout.info.status.color;
				} else {
					activity = "N/A";
					name = id;
					lastAction = "N/A";
					lifeCurrent = 0;
					lifeMaximum = 100;
					state = "Unknown";
					stateColor = "gray";
				}

				const removeStakeoutButton = elementBuilder({
					type: "div",
					class: "delete-stakeout-wrap",
					children: [elementBuilder({ type: "i", class: "delete-stakeout fa-solid fa-trash-can" })],
				});
				removeStakeoutButton.addEventListener("click", () => {
					delete stakeouts[id];
					stakeouts.order = Object.keys(stakeouts).filter((stakeoutID) => !isNaN(parseInt(stakeoutID)));

					ttStorage.set({ stakeouts });
				});

				const lifeBar = elementBuilder({
					type: "div",
					children: [
						elementBuilder({ type: "span", text: "Life: " }),
						elementBuilder({
							type: "div",
							class: "progress",
							children: [
								elementBuilder({
									type: "div",
									class: "value",
									style: { width: `${((lifeCurrent / lifeMaximum) * 100).toFixed(0)}%` },
								}),
							],
						}),
					],
				});

				stakeoutList.appendChild(
					elementBuilder({
						type: "div",
						class: "user",
						children: [
							elementBuilder({
								type: "div",
								class: "row information",
								children: [
									elementBuilder({
										type: "div",
										class: "activity",
										children: [
											elementBuilder({
												type: "span",
												class: `status ${activity.toLowerCase()}`,
											}),
											elementBuilder({
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
							elementBuilder({
								type: "div",
								class: "row detailed",
								children: [
									lifeBar,
									elementBuilder({
										type: "span",
										class: "lastAction",
										text: `Last action: ${lastAction}`,
									}),
								],
							}),
							elementBuilder({
								type: "div",
								class: `row state ${stateColor}`,
								children: [elementBuilder({ type: "span", class: "state ", text: state })],
							}),
						],
					})
				);
			}
		} else dashboard.querySelector(".stakeouts").classList.add("tt-hidden");
	}

	function updateFactionStakeouts() {
		if (
			settings.pages.popup.showStakeouts &&
			Object.keys(factionStakeouts).length &&
			!(Object.keys(factionStakeouts).length === 1 && factionStakeouts.date)
		) {
			dashboard.querySelector(".faction-stakeouts").classList.remove("tt-hidden");

			const stakeoutList = dashboard.querySelector(".faction-stakeouts .stakeout-list");
			stakeoutList.innerHTML = "";

			for (const factionId in factionStakeouts) {
				if (isNaN(parseInt(factionId)) || typeof factionStakeouts[factionId] === "number") continue;

				let name: string, chain: number | string, members: number | string, maxMembers: number | string;

				if (factionStakeouts[factionId].info && Object.keys(factionStakeouts[factionId].info).length) {
					name = factionStakeouts[factionId].info.name;
					chain = factionStakeouts[factionId].info.chain;
					members = factionStakeouts[factionId].info.members.current;
					maxMembers = factionStakeouts[factionId].info.members.maximum;
				} else {
					name = factionId;
					chain = "N/A";
					members = "N/A";
					maxMembers = "N/A";
				}

				const removeStakeoutButton = elementBuilder({
					type: "div",
					class: "delete-stakeout-wrap",
					children: [elementBuilder({ type: "i", class: "delete-stakeout fa-solid fa-trash-can" })],
				});
				removeStakeoutButton.addEventListener("click", () => {
					delete factionStakeouts[factionId];

					ttStorage.set({ factionStakeouts });
				});

				stakeoutList.appendChild(
					elementBuilder({
						type: "div",
						class: "faction",
						children: [
							elementBuilder({
								type: "div",
								class: "row information",
								children: [
									elementBuilder({
										type: "a",
										href: `https://www.torn.com/factions.php?step=profile&ID=${factionId}#/`,
										text: name,
										attributes: { target: "_blank" },
									}),
									elementBuilder({
										type: "div",
										class: "members",
										text: members !== "N/A" ? `${members} of ${maxMembers} members` : "unknown members",
									}),
									elementBuilder({
										type: "div",
										class: "chain",
										text: chain ? `${chain} chain` : "no chain",
									}),
									removeStakeoutButton,
								],
							}),
						],
					})
				);
			}
		} else dashboard.querySelector(".faction-stakeouts").classList.add("tt-hidden");
	}
}

async function setupMarketSearch() {
	// setup itemlist
	const itemSelection = document.querySelector("#market .item-list");

	for (const id in torndata.items) {
		const name = torndata.items[id].name;

		const div = elementBuilder({
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
	document.querySelector("#market #search-bar").addEventListener("keyup", (event) => {
		const keyword = (event.target as HTMLInputElement).value.toLowerCase();

		if (!keyword) {
			itemSelection.classList.add("tt-hidden");
			return;
		}

		let id: number | undefined;
		if (!isNaN(parseInt(keyword))) id = parseInt(keyword);

		for (const item of findAllElements("#market .item-list li")) {
			if (item.textContent.toLowerCase().includes(keyword) || (id && parseInt(item.dataset.id) === id)) {
				item.classList.remove("tt-hidden");
				itemSelection.classList.remove("tt-hidden");
			} else {
				item.classList.add("tt-hidden");
			}
		}
	});
	document.querySelector("#market #search-bar").addEventListener("click", (event) => {
		(event.target as HTMLInputElement).value = "";

		document.querySelector("#market .item-list").classList.add("tt-hidden");
		document.querySelector("#market #item-information").classList.add("tt-hidden");
	});

	function showMarketInfo(id: string) {
		const viewItem = document.querySelector("#market #item-information");
		viewItem.querySelector(".market").classList.add("tt-hidden");

		const item = torndata.items[id];
		viewItem.querySelector(".circulation").textContent = formatNumber(item.circulation);
		viewItem.querySelector(".value").textContent = `$${formatNumber(item.market_value)}`;
		viewItem.querySelector(".name").textContent = item.name;
		viewItem.querySelector<HTMLAnchorElement>(".name").href =
			`https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${id}&itemName=${item.name}&itemType=${item.type}`;
		viewItem.querySelector<HTMLImageElement>(".image").src = item.image;

		viewItem.classList.remove("tt-hidden");

		showLoadingPlaceholder(viewItem.querySelector(".market").parentElement, true);

		// Make both API calls in parallel
		Promise.all([
			// Torn market data
			ttCache.hasValue("livePrice", id)
				? Promise.resolve(ttCache.get<MarketItemMarketResponse>("livePrice", id))
				: fetchData<MarketItemMarketResponse>("tornv2", {
						section: "market",
						id,
						selections: ["itemmarket"],
						params: { limit: 3 },
					}).then((result) => {
						ttCache.set({ [id]: result }, TO_MILLIS.SECONDS * 30, "livePrice");
						return result;
					}), // TornW3B market data - only fetch if both bazaar search is enabled and connection to TornW3B is allowed
			settings.pages.popup.bazaarUsingExternal && settings.external.tornw3b
				? ttCache.hasValue("tornw3bPrice", id)
					? Promise.resolve(ttCache.get<TornW3BResult>("tornw3bPrice", id))
					: fetchData<TornW3BResult>("tornw3b", { section: `marketplace/${id}` }).then((result) => {
							ttCache.set({ [id]: result }, TO_MILLIS.SECONDS * 60, "tornw3bPrice");
							return result;
						})
				: Promise.resolve<TornW3BResult>({ listings: [] }),
		])
			.then(([tornResult, tornw3bResult]) => {
				handleMarket(tornResult, tornw3bResult);
			})
			.catch((error) => {
				document.querySelector(".error").classList.remove("tt-hidden");
				document.querySelector(".error").textContent = error.message;
			})
			.finally(() => showLoadingPlaceholder(viewItem.querySelector(".market").parentElement, false));

		function handleMarket(tornResult: MarketItemMarketResponse, tornw3bResult: TornW3BResult) {
			const list = viewItem.querySelector(".market");
			list.innerHTML = "";

			if (!isSellable(id) && !tornResult.itemmarket.listings.length) {
				list.classList.add("untradable");
				list.innerHTML = "Item is not sellable!";
			} else {
				// Item market listings.
				const itemMarketWrap = elementBuilder({ type: "div" });
				itemMarketWrap.appendChild(elementBuilder({ type: "h4", text: "Item Market" }));
				if (tornResult.itemmarket?.listings?.length) {
					for (const item of tornResult.itemmarket.listings) {
						itemMarketWrap.appendChild(
							elementBuilder({
								type: "div",
								class: "price",
								text: `${item.amount}x | $${formatNumber(item.price)}`,
							})
						);
					}
				} else {
					itemMarketWrap.appendChild(
						elementBuilder({
							type: "div",
							class: "price no-price",
							text: "No listings found.",
						})
					);
				}
				list.appendChild(itemMarketWrap);

				// TornW3B market listings
				const bazaarWrap = elementBuilder({ type: "div" });
				bazaarWrap.appendChild(elementBuilder({ type: "h4", text: "Bazaars" }));
				if (settings.pages.popup.bazaarUsingExternal && settings.external.tornw3b && tornw3bResult?.listings?.length) {
					for (const item of tornw3bResult.listings.slice(0, 3)) {
						bazaarWrap.appendChild(
							elementBuilder({
								type: "div",
								class: "price",
								text: `${item.quantity}x | $${formatNumber(item.price)}`,
							})
						);
					}
				} else {
					bazaarWrap.appendChild(
						elementBuilder({
							type: "div",
							class: "price no-price",
							text: "No listings found.",
						})
					);
				}
				if (settings.pages.popup.bazaarUsingExternal && settings.external.tornw3b) {
					list.appendChild(bazaarWrap);
				}
			}
			viewItem.querySelector(".market").classList.remove("tt-hidden");
		}
	}
}

async function loadMarketSearch() {
	document.querySelector<HTMLElement>("#market #search-bar").focus();
}

async function setupCalculator() {
	const calculator = document.querySelector("#calculator");

	// setup itemlist
	const itemSelection = calculator.querySelector(".item-list");

	let selectedItems = localdata.popup.calculatorItems;

	for (const id in torndata.items) {
		const name = torndata.items[id].name;

		const identifier = `calculator-${id}`;

		itemSelection.appendChild(
			elementBuilder({
				type: "li",
				class: "item",
				id: name.toLowerCase().replace(/\s+/g, "").replace(":", "_"),
				children: [
					elementBuilder({
						type: "label",
						text: name,
						attributes: { for: identifier },
					}),
					elementBuilder({
						type: "input",
						id: identifier,
						attributes: { type: "number" },
						events: {
							input(event) {
								let item = selectedItems.find((i) => i.id === id);

								const amount = (event.target as HTMLInputElement).value;
								if (amount === "") {
									if (item) {
										selectedItems = selectedItems.filter((i) => i.id !== id);
										updateSelection();
									}

									return;
								}

								if (!item) {
									item = { id, amount: -1 };
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
	const search = calculator.querySelector(".search");
	search.addEventListener("keyup", (event) => {
		const keyword = (event.target as HTMLInputElement).value.toLowerCase();

		if (!keyword) {
			itemSelection.classList.add("tt-hidden");
			return;
		}

		for (const item of findAllElements(".item-list > li", calculator)) {
			if (item.textContent.toLowerCase().includes(keyword)) {
				item.classList.remove("tt-hidden");
				itemSelection.classList.remove("tt-hidden");
			} else {
				item.classList.add("tt-hidden");
			}
		}
	});
	search.addEventListener("click", (event) => {
		(event.target as HTMLInputElement).value = "";

		calculator.querySelector(".item-list").classList.add("tt-hidden");
	});

	const clear = calculator.querySelector(".clear");
	clear.addEventListener("click", () => {
		selectedItems = [];

		updateSelection();
	});

	updateSelection();

	function updateSelection() {
		const receipt = calculator.querySelector(".receipt");
		receipt.innerHTML = "";

		if (!selectedItems.length) {
			clear.classList.add("tt-hidden");
			ttStorage.change({ localdata: { popup: { calculatorItems: [] } } });
			return;
		}
		clear.classList.remove("tt-hidden");

		const items = elementBuilder({ type: "ul" });

		let totalValue = 0;
		for (const { id, amount } of selectedItems) {
			const { market_value: value, name } = torndata.items[id];
			const price = amount * value;

			items.appendChild(
				elementBuilder({
					type: "li",
					children: [
						elementBuilder({
							type: "span",
							class: "amount",
							text: `${formatNumber(amount)}x`,
						}),
						elementBuilder({
							type: "span",
							class: "item",
							text: name,
						}),
						document.createTextNode("="),
						elementBuilder({
							type: "span",
							class: "price",
							text: formatNumber(price, { currency: true }),
						}),
					],
				})
			);

			totalValue += price;
		}

		receipt.appendChild(items);
		receipt.appendChild(
			elementBuilder({
				type: "div",
				class: "total",
				text: `Total: ${formatNumber(totalValue, { currency: true })}`,
			})
		);

		ttStorage.change({ localdata: { popup: { calculatorItems: selectedItems } } });
	}
}

async function loadCalculator() {
	document.querySelector<HTMLElement>("#calculator .search").focus();
}

async function setupStocksOverview() {
	const stocksOverview = document.querySelector("#stocks");
	const allStocks = stocksOverview.querySelector("#all-stocks");

	for (let id in stockdata) {
		if (id === "date") continue;

		allStocks.appendChild(buildSection(parseInt(id)));
	}

	// setup searchbar
	stocksOverview.querySelector("#stock-search-bar").addEventListener("keyup", (event) => {
		const keyword = (event.target as HTMLInputElement).value.toLowerCase();

		if (!keyword) {
			for (const item of findAllElements(".stock-wrap[data-user='false']", allStocks)) {
				item.classList.add("tt-hidden");
			}
			for (const item of findAllElements(".stock-wrap[data-user='true']", allStocks)) {
				item.classList.remove("tt-hidden");
			}
			return;
		}

		for (const item of findAllElements(".stock-wrap", allStocks)) {
			if (keyword === "*" || item.dataset.name.includes(keyword)) {
				item.classList.remove("tt-hidden");
			} else {
				item.classList.add("tt-hidden");
			}
		}
	});
	stocksOverview.querySelector("#stock-search-bar").addEventListener("click", (event) => {
		(event.target as HTMLInputElement).value = "";

		for (const item of findAllElements(".stock-wrap[data-user='false']", allStocks)) {
			item.classList.add("tt-hidden");
		}
		for (const item of findAllElements(".stock-wrap[data-user='true']", allStocks)) {
			item.classList.remove("tt-hidden");
		}
	});

	for (const item of findAllElements(".stock-wrap[data-user='false']", allStocks)) {
		item.classList.add("tt-hidden");
	}

	function buildSection(id: number) {
		const stock = typeof stockdata[id] === "number" ? null : stockdata[id];
		if (stock === null) return null;

		const userStock: UserV1Stock | null = settings.apiUsage.user.stocks ? (userdata.stocks[id] ?? null) : null;

		const wrapper = elementBuilder({
			type: "div",
			class: "stock-wrap",
			dataset: { name: `${stock.name} (${stock.acronym})`.toLowerCase(), user: !!userStock },
			children: [elementBuilder("hr")],
		});

		let boughtPrice: number, profit: number;
		if (userStock) {
			boughtPrice = getStockBoughtPrice(userStock).boughtPrice;
			profit = dropDecimals((stock.current_price - boughtPrice) * userStock.total_shares);
		}

		createHeading();
		createPriceInformation();
		createBenefitInformation();
		createAlertsSection();

		return wrapper;

		function createHeading() {
			const heading = elementBuilder({
				type: "a",
				class: "heading",
				href: `https://www.torn.com/stockexchange.php?stock=${stock.acronym}`,
				attributes: { target: "_blank" },
				children: [
					elementBuilder({
						type: "span",
						class: "name",
						text: `${stock[stock.name.length > 35 ? "acronym" : "name"]}`,
					}),
					elementBuilder("br"),
				],
			});
			wrapper.appendChild(heading);

			if (userStock) {
				heading.appendChild(
					elementBuilder({
						type: "span",
						class: "quantity",
						text: `(${formatNumber(userStock.total_shares, { shorten: 2 })} share${applyPlural(userStock.total_shares)})`,
					})
				);
				heading.appendChild(
					elementBuilder({
						type: "div",
						class: `profit ${getProfitClass(profit)}`,
						text: `${getProfitIndicator(profit)}${formatNumber(Math.abs(profit), { currency: true })}`,
					})
				);
			}

			function getProfitClass(profit: number) {
				return profit > 0 ? "positive" : profit < 0 ? "negative" : "";
			}

			function getProfitIndicator(profit: number) {
				return profit > 0 ? "+" : profit < 0 ? "-" : "";
			}
		}

		function createPriceInformation() {
			const priceContent = elementBuilder({
				type: "div",
				class: "content price tt-hidden",
				children: [
					elementBuilder({
						type: "span",
						text: `Current price: ${formatNumber(stock.current_price, { decimals: 3, currency: true })}`,
					}),
					elementBuilder({
						type: "span",
						text: `Total shares: ${formatNumber(stock.total_shares)}`,
					}),
				],
			});
			wrapper.append(
				elementBuilder({
					type: "div",
					class: "information-section",
					children: [getHeadingElement("Price Information", priceContent), priceContent],
				})
			);

			if (userStock) {
				priceContent.appendChild(elementBuilder({ type: "div", class: "flex-break" }));
				priceContent.appendChild(
					elementBuilder({
						type: "span",
						text: `Bought at: ${formatNumber(boughtPrice, { decimals: 3, currency: true })}`,
					})
				);
			}
		}

		function createBenefitInformation() {
			const benefitContent = elementBuilder({
				type: "div",
				class: "content benefit tt-hidden",
				children: [],
			});
			wrapper.append(
				elementBuilder({
					type: "div",
					class: "information-section",
					children: [getHeadingElement("Benefit Information", benefitContent), benefitContent],
				})
			);

			if (userStock) {
				if (isDividendStock(id)) {
					benefitContent.appendChild(
						elementBuilder({
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
						elementBuilder({
							type: "span",
							text: `Required stocks: ${formatNumber(userStock.total_shares)}/${formatNumber(stock.benefit.requirement)}`,
						})
					);
					benefitContent.appendChild(elementBuilder("br"));

					let color: string;
					let duration: string;

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

					benefitContent.appendChild(
						elementBuilder({
							type: "span",
							class: `description ${color}`,
							text: `${stock.benefit.description}`,
						})
					);
					if (duration)
						benefitContent.appendChild(
							elementBuilder({
								type: "span",
								class: "duration",
								text: duration,
							})
						);
				}
			} else {
				if (isDividendStock(id)) {
					benefitContent.appendChild(
						elementBuilder({
							type: "span",
							text: `Available every ${stock.benefit.frequency} days.`,
						})
					);

					benefitContent.appendChild(createRoiTable(stock, undefined));
				} else {
					benefitContent.appendChild(
						elementBuilder({
							type: "span",
							text: `Required stocks: ${formatNumber(stock.benefit.requirement)}`,
						})
					);
					benefitContent.appendChild(elementBuilder("br"));
					benefitContent.appendChild(
						elementBuilder({
							type: "span",
							class: "description not-completed",
							text: `${stock.benefit.description}`,
						})
					);
					benefitContent.appendChild(
						elementBuilder({
							type: "span",
							class: "duration",
							text: `after ${stock.benefit.frequency} days.`,
						})
					);
				}
			}
		}

		function createAlertsSection() {
			const alertsContent = elementBuilder({
				type: "div",
				class: "content alerts tt-hidden",
				children: [],
			});
			wrapper.append(
				elementBuilder({
					type: "div",
					class: "information-section",
					children: [getHeadingElement("Alerts", alertsContent), alertsContent],
				})
			);

			alertsContent.appendChild(elementBuilder({ type: "span", class: "title", text: "Price" }));
			alertsContent.appendChild(
				elementBuilder({
					type: "div",
					children: [
						elementBuilder({
							type: "label",
							attributes: { for: `stock-${id}-alert__reaches` },
							text: "reaches",
						}),
						elementBuilder({
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
											notifications: {
												types: { stocks: { [id]: { priceReaches: parseFloat((event.target as HTMLInputElement).value) } } },
											},
										},
									});
								},
							},
						}),
					],
				})
			);
			alertsContent.appendChild(
				elementBuilder({
					type: "div",
					children: [
						elementBuilder({
							type: "label",
							attributes: { for: `stock-${id}-alert__falls` },
							text: "falls to",
						}),
						elementBuilder({
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
											notifications: {
												types: { stocks: { [id]: { priceFalls: parseFloat((event.target as HTMLInputElement).value) } } },
											},
										},
									});
								},
							},
						}),
					],
				})
			);
		}

		function getHeadingElement(title: string, content: Element) {
			return elementBuilder({
				type: "div",
				class: "heading",
				children: [
					elementBuilder({
						type: "span",
						class: "title",
						text: title,
					}),
					elementBuilder({ type: "i", class: "fa-solid  fa-chevron-down" }),
				],
				events: {
					click: (event) => {
						content.classList[content.classList.contains("tt-hidden") ? "remove" : "add"]("tt-hidden");

						const target = event.target as HTMLElement;
						rotateElement((target.classList.contains("heading") ? target : target.parentElement).querySelector("i"), 180);
					},
				},
			});
		}

		function createRoiTable(stock: TornV1Stock, userStock: UserV1Stock | undefined) {
			const benefitTable = elementBuilder({
				type: "table",
				children: [
					elementBuilder({
						type: "tr",
						children: [
							elementBuilder({ type: "th", text: "Increment" }),
							elementBuilder({
								type: "th",
								text: "Stocks",
							}),
							elementBuilder({ type: "th", text: "Cost" }),
							elementBuilder({
								type: "th",
								text: "Reward",
							}),
							elementBuilder({ type: "th", text: "ROI" }),
						],
					}),
				],
			});

			let ownedLevel: number, activeLevel: number;
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
					elementBuilder({
						type: "tr",
						class: ["increment", level <= ownedLevel ? (level <= activeLevel ? "completed" : "awaiting") : ""],
						children: [
							elementBuilder({ type: "td", text: level }),
							elementBuilder({ type: "td", text: formatNumber(stocks) }),
							elementBuilder({
								type: "td",
								text: formatNumber(stocks * stock.current_price, { currency: true }),
							}),
							elementBuilder({ type: "td", text: reward }),
							elementBuilder({
								type: "td",
								text: rewardValue > 0 ? `${formatNumber(roi, { decimals: 1 })}%` : "N/A",
							}),
						],
					})
				);
			}

			return benefitTable;
		}
	}
}

async function setupNotifications() {
	const notifications = document.querySelector("#notifications ul");

	notificationHistory
		.map(createEntry)
		.filter((element) => element !== null)
		.forEach((entry) => notifications.appendChild(entry));

	function createEntry(notification: TTNotification) {
		if ("combined" in notification) return null;

		const { message, date, url } = notification;
		const title = notification.title.replace("TornTools - ", "");

		const period = isToday(date) ? formatTime(date) : `${formatDate(date)} ${formatTime(date)}`;

		return elementBuilder({
			type: "li",
			children: [
				elementBuilder({
					type: "a",
					href: url,
					children: [
						elementBuilder({
							type: "div",
							class: "title",
							children: [
								elementBuilder({
									type: "span",
									text: title,
								}),
								elementBuilder({ type: "span", text: period }),
							],
						}),
						elementBuilder({ type: "span", text: message }),
					],
					attributes: { target: "_blank" },
				}),
			],
		});
	}
}
