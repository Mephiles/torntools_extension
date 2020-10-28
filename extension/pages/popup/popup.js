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

	document.find(`#pages li[to="${name}"]`).classList.add("active");
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
}

async function setupDashboard() {
	updateDashboard();
	storageListeners.userdata.push(updateDashboard);

	function updateDashboard() {
		document.find("#name").innerText = userdata.name;
	}
}

async function setupMarketSearch() {}

async function setupStocksOverview() {}
