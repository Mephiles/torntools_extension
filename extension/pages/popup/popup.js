let initiatedPages = {};

(async () => {
	showLoadingPlaceholder(document.body, true);

	await loadDatabase();

	if (!api.torn.key) {
		await showPage("initialize");
	} else {
		await showPage("dashboard");
	}

	showLoadingPlaceholder(document.body, false);
	document.body.classList.remove("loading");
})();

async function showPage(name) {
	/*
	for (let active of document.findAll("body > main.active, header nav.on-page > ul > li.active")) active.classList.remove("active");

	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");
	document.find(`#${name}`).classList.add("active");
	 */

	for (let active of document.findAll("body > main.subpage.active")) active.classList.remove("active");

	document.find(`#${name}`).classList.add("active");

	let setup = {
		initialize: setupInitialize,
		dashboard: setupDashboard,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		await setup[name]();
		initiatedPages[name] = true;
	}
}

async function setupInitialize() {
	document.find("#set_api_key").addEventListener("click", () => {
		const key = document.find("#api_key").value;

		fetchApi("torn", { section: "user", selections: ["profile"], key, silent: true })
			.then(async (response) => {
				console.log("initialize response", response);

				await ttStorage.change({ api: { torn: { key } } });

				chrome.runtime.sendMessage({ action: "initialize" }, async (response) => {
					await showPage("dashboard");
				});
			})
			.catch((error) => {
				document.find(".error").style.display = "block";
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
