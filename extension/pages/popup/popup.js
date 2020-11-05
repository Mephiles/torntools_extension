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

		fetchApi("torn", { section: "user", selections: ["profile"], key, silent: true })
			.then(async (response) => {
				console.log("initialize response", response);

				await ttStorage.change({ api: { torn: { key } } });

				chrome.runtime.sendMessage({ action: "initialize" }, async (response) => {
					document.find("#pages").classList.remove("hidden");

					await showPage(settings.pages.popup.defaultTab);
				});
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
		updateBar("energy", userdata.energy);

		function updateBar(name, bar) {
			const current = bar?.current || 0;
			const maximum = bar?.maximum || 100;

			dashboard.find(`#${name} .progress .value`).style.width = `${(current / maximum) * 100}%`;
			dashboard.find(`#${name} .bar-info .bar-label`).innerText = `${current}/${maximum}`;

			// noinspection JSValidateTypes
			dashboard.find(`#${name} .bar-info`).dataset.full_at = current === maximum ? -1 : (userdata.server_time + bar.fulltime) * 1000;
			// noinspection JSValidateTypes
			dashboard.find(`#${name} .bar-info`).dataset.tick_at = (userdata.server_time + bar?.ticktime) * 1000;

			updateBarTimer(dashboard.find(`#${name}`));
		}
	}

	function updateBarTimer(bar) {
		const current = Date.now();

		const dataset = bar.find(`.bar-info`).dataset;

		const full_at = parseInt(dataset.full_at);
		const tick_at = parseInt(dataset.tick_at);

		let full, tick;
		if (full_at === -1) full = "FULL";
		else {
			full = __timeUntil(full_at - current);
		}

		tick = __timeUntil(tick_at - current);

		dataset.full = full;
		dataset.tick = tick;
	}
}

async function setupMarketSearch() {}

async function setupStocksOverview() {}
