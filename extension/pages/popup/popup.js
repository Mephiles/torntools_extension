let initiatedPages = {};

(async () => {
	showLoadingPlaceholder(document.body, true);

	await loadDatabase();

	for (let navigation of document.findAll("#pages li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}

	if (!settings.pages.popup.dashboard) document.find('#pages li[to="dashboard"]').classList.add("hidden");
	if (!settings.pages.popup.marketSearch) document.find('#pages li[to="market"]').classList.add("hidden");
	if (!settings.pages.popup.stocksOverview) document.find('#pages li[to="stocks"]').classList.add("hidden");

	if (!api.torn.key) {
		await showPage("initialize");
	} else {
		await showPage(settings.pages.popup.defaultTab);
	}

	showLoadingPlaceholder(document.body, false);
	document.body.classList.remove("loading");
})();

async function showPage(name) {
	document.find(`#${name}`).classList.add("active");

	for (let active of document.findAll("body > main.subpage.active, #pages li.active")) active.classList.remove("active");

	document.find(`#pages li[to="${name}"]`)?.classList.add("active");
	document.find(`#${name}`).classList.add("active");

	let setup = {
		initialize: setupInitialize,
		dashboard: setupDashboard,
		market: setupMarketSearch,
		stocks: setupStocksOverview,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		await setup[name]();
		initiatedPages[name] = true;
	}
}

async function setupInitialize() {
	document.find("#pages").classList.add("hidden");

	document.find("#set_api_key").addEventListener("click", () => {
		const key = document.find("#api_key").value;

		changeAPIKey(key)
			.then(async () => {
				document.find("#pages").classList.remove("hidden");

				await showPage(settings.pages.popup.defaultTab);
			})

			.catch((error) => {
				document.find(".error").classList.remove("hidden");
				document.find(".error").innerText = error.error;
			});
	});

	document.find("#api_quicklink").addEventListener("click", () => {
		chrome.tabs.update({
			url: "https://www.torn.com/preferences.php#tab=api",
		});
	});
}

async function setupDashboard() {
	updateDashboard();
	storageListeners.userdata.push(updateDashboard);

	setTimeout(() => {
		setInterval(() => {
			for (let bar of dashboard.findAll(".bar")) {
				updateBarTimer(bar);
			}
			for (let cooldown of dashboard.findAll(".cooldowns .cooldown")) {
				updateCooldownTimer(cooldown);
			}
		}, 1000);
	}, 1000 - (new Date().getTime() % 1000));

	function updateDashboard() {
		const dashboard = document.find("#dashboard");

		// Country and status
		updateStatus();
		// Bars
		for (let bar of ["energy", "nerve", "happy", "life", "chain"]) {
			updateBar(bar, userdata[bar]);
		}
		updateTravelBar();
		// Cooldowns
		for (let cooldown of ["drug", "booster", "medical"]) {
			updateCooldown(cooldown, userdata.cooldowns[cooldown]);
		}
		// Extra information
		updateExtra();

		function updateStatus() {
			if (userdata.travel.time_left) {
				dashboard.find("#country").innerText = `Traveling to ${userdata.travel.destination}`;
				dashboard.find(".status-wrap").classList.add("hidden");
			} else {
				dashboard.find("#country").innerText = userdata.travel.destination;

				const status = userdata.status.state === "abroad" ? "okay" : userdata.status.state.toLowerCase();

				dashboard.find("#status").innerText = capitalizeText(status);
				dashboard.find("#status").setAttribute("class", status);
				dashboard.find(".status-wrap").classList.remove("hidden");
			}
		}

		function updateBar(name, bar) {
			const current = bar?.current || 0;
			let maximum = bar?.maximum || 100;
			let tickAt = (userdata.server_time + bar?.ticktime) * 1000;
			let fullAt = (userdata.server_time + bar.fulltime) * 1000;

			if (current === maximum) fullAt = "full";
			else if (current > maximum) fullAt = "over";

			if (name === "chain") {
				if (current === 0) {
					dashboard.find(`#${name}`).classList.add("hidden");
					return;
				}
				dashboard.find(`#${name}`).classList.remove("hidden");

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
			dashboard.find(`#${name} .bar-info .bar-label`).innerText = `${current}/${maximum}`;

			// noinspection JSValidateTypes
			dashboard.find(`#${name} .bar-info`).dataset.full_at = fullAt;
			// noinspection JSValidateTypes
			dashboard.find(`#${name} .bar-info`).dataset.tick_at = tickAt;

			updateBarTimer(dashboard.find(`#${name}`));
		}

		function updateTravelBar() {
			if (!userdata.travel.time_left) {
				dashboard.find(`#traveling`).classList.add("hidden");
				return;
			}
			dashboard.find(`#traveling`).classList.remove("hidden");

			const maximum = userdata.travel.timestamp - userdata.travel.departed;
			const current = maximum - userdata.travel.time_left;

			dashboard.find(`#traveling .progress .value`).style.width = `${(current / maximum) * 100}%`;
			dashboard.find("#traveling .bar-info .bar-label").innerText = formatTime(userdata.travel.timestamp * 1000);

			// noinspection JSValidateTypes
			dashboard.find(`#traveling .bar-info`).dataset.tick_at = userdata.travel.timestamp * 1000;
			dashboard.find(`#traveling .bar-info`).dataset.full_at = userdata.travel.timestamp * 1000;

			updateBarTimer(dashboard.find(`#traveling`));
		}

		function updateCooldown(name, cooldown) {
			dashboard.find(`#${name}-cooldown`).dataset.completed_at = (userdata.timestamp + cooldown) * 1000;

			updateCooldownTimer(dashboard.find(`#${name}-cooldown`));
		}

		function updateExtra() {
			dashboard.find(".extra .events .count").innerText = Object.values(userdata.events).filter((event) => !event.seen).length;
			dashboard.find(".extra .messages .count").innerText = Object.values(userdata.messages).filter((message) => !message.seen).length;
			dashboard.find(".extra .wallet .count").innerText = `$${formatNumber(userdata.money_onhand, { shorten: false })}`;
		}
	}

	function updateBarTimer(bar) {
		const name = bar.id;
		const current = Date.now();

		const barInfo = bar.find(`.bar-info`);
		const dataset = barInfo.dataset;

		const full_at = parseInt(dataset.full_at) || dataset.full_at;
		const tick_at = parseInt(dataset.tick_at) || dataset.tick_at;

		let full;
		if (full_at === "full" || full_at === "over") full = "FULL";
		else if (name === "chain" || (name === "happy" && full_at === "over"))
			full = `${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", hideHours: true })}`;
		else if (name === "traveling") full = `Landing in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer" })}`;
		else full = `Full in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer" })}`;

		let tick;
		if (name === "traveling") tick = formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer" });
		else tick = formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer", hideHours: true });

		if (name === "happy") {
			if (full_at === "over") {
				full = `Resets in ${full}`;
				barInfo.classList.add("reset-timer");
			} else {
				barInfo.classList.remove("reset-timer");
			}
		} else if (name === "chain") {
			if (bar.classList.contains("cooldown")) full = `Cooldown over in ${full}`;
		}

		dataset.full = full;
		dataset.tick = tick;
	}

	function updateCooldownTimer(cooldown) {
		const dataset = cooldown.dataset;
		const current = Date.now();

		const completed_at = parseInt(dataset.completed_at) || dataset.completed_at;

		console.log("CD", cooldown);
		cooldown.find(".cooldown-label").innerText = formatTime({ milliseconds: completed_at - current }, { type: "timer" });
	}
}

async function setupMarketSearch() {}

async function setupStocksOverview() {}
