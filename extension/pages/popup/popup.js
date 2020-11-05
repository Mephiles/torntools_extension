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
		}, 1000);
	}, 1000 - (new Date().getTime() % 1000));

	function updateDashboard() {
		const dashboard = document.find("#dashboard");

		dashboard.find("#name").innerText = userdata.name;
		for (let bar of ["energy", "nerve", "happy", "life", "chain"]) {
			updateBar(bar, userdata[bar]);
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
					dashboard.find(`#${name}`).style.setProperty("display", "none");
					return;
				}
				dashboard.find(`#${name}`).style.setProperty("display", null);

				if (current !== maximum) maximum = getNextChainBonus(current);
				fullAt = (userdata.server_time + bar.timeout) * 1000;
				tickAt = (userdata.server_time + bar.timeout) * 1000;
			}

			dashboard.find(`#${name} .progress .value`).style.width = `${(current / maximum) * 100}%`;
			dashboard.find(`#${name} .bar-info .bar-label`).innerText = `${current}/${maximum}`;

			// noinspection JSValidateTypes
			dashboard.find(`#${name} .bar-info`).dataset.full_at = fullAt;
			// noinspection JSValidateTypes
			dashboard.find(`#${name} .bar-info`).dataset.tick_at = tickAt;

			updateBarTimer(dashboard.find(`#${name}`));
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
		else if (name === "chain") full = `${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer", hideHours: true })}`;
		else full = `Full in ${formatTime({ seconds: toSeconds(full_at - current) }, { type: "timer" })}`;

		if (name === "happy") {
			if (full_at === "over") {
				full = `Resets in ${formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer", hideHours: true })}`;
				barInfo.classList.add("reset-timer");
			} else {
				barInfo.classList.remove("reset-timer");
			}
		}

		dataset.full = full;
		dataset.tick = formatTime({ seconds: toSeconds(tick_at - current) }, { type: "timer", hideHours: true });
	}
}

async function setupMarketSearch() {}

async function setupStocksOverview() {}
