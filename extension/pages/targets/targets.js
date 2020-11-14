let initiatedPages = {};

(async () => {
	await loadDatabase();
	await showPage(getSearchParameters().get("page") || "targetList");

	document.body.classList.add(getPageTheme());
	storageListeners.settings.push(() => {
		document.body.classList.remove("dark", "light");
		document.body.classList.add(getPageTheme());
	});

	for (let navigation of document.findAll("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

async function showPage(name) {
	window.history.replaceState("", "Title", "?page=" + name);

	for (let active of document.findAll("header nav.on-page > ul > li.active")) active.classList.remove("active");
	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (let active of document.findAll("body > main:not(.hidden)")) active.classList.add("hidden");
	document.find(`#${name}`).classList.remove("hidden");

	let setup = {
		targetList: setupTargetList,
		stakeouts: setupStakeouts,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		await setup[name]();
		initiatedPages[name] = true;
	}
}

async function setupTargetList() {}

async function setupStakeouts() {
	const _preferences = document.find("#stakeouts");
	const stakeoutList = _preferences.find("#stakeoutList");

	fillStakeouts();
	storageListeners.stakeouts.push(updateStakeouts);

	_preferences.find("#saveStakeouts").addEventListener("click", async () => await saveSettings());
	_preferences.find("#resetStakeouts").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset stakeouts",
			message: `<h3>Are you sure you want to delete all stakeouts?</h3>`,
		})
			.then(async () => {
				await ttStorage.set({ stakeouts: {} });
			})
			.catch((error) => console.error(error));
	});

	document.find("#addStakeout").addEventListener("click", async () => {
		if (!document.find("#stakeoutId").value) return;

		addStakeout(parseInt(document.find("#stakeoutId").value));

		document.find("#stakeoutId").value = "";
	});

	function fillStakeouts() {
		console.log("ST", stakeouts);
		for (let id in stakeouts) {
			addStakeout(id, stakeouts[id]);
		}
	}

	function addStakeout(id, data = {}) {
		const row = document.newElement({ type: "tr", class: "row" });

		row.appendChild(document.newElement({ type: "td", class: "id", text: id }));
		if (data?.info) {
			row.appendChild(document.newElement({ type: "td", class: "name", text: data.info.name }));
			row.appendChild(
				document.newElement({
					type: "td",
					class: `status ${data.info.last_action.status.toLowerCase()}`,
					text: data.info.last_action.status,
				})
			);
			row.appendChild(document.newElement({ type: "td", class: "last-action", text: data.info.last_action.relative }));
		} else {
			row.appendChild(document.newElement({ type: "td", class: "name", text: "" }));
			row.appendChild(document.newElement({ type: "td", class: "status", text: "" }));
			row.appendChild(document.newElement({ type: "td", class: "last-action", text: "" }));
		}

		stakeoutList.appendChild(row);
	}

	function updateStakeouts() {
		for (let id in stakeouts) {
			const row = stakeoutList.find(`tr .id=${id}`).parentElement;

			console.log("updateStakeouts", id, row);

			row.find(".status").classList.remove("offline", "idle", "online");
			if (stakeouts[id]?.info) {
				row.find(".name").innerText = stakeouts[id].info.name;
				row.find(".status").innerText = stakeouts[id].info.last_action.status;
				row.find(".status").classList.add(stakeouts[id].info.last_action.status.toLowerCase());
				row.find(".last-action").innerText = stakeouts[id].info.last_action.relative;
			} else {
				row.find(".name").innerText = "";
				row.find(".status").innerText = "";
				row.find(".last-action").innerText = "";
			}
		}
	}

	async function saveSettings() {
		const newStakeouts = {};

		for (let row of stakeoutList.findAll("tr.row")) {
			newStakeouts[parseInt(row.find(".id").innerText)] = {};
		}
		for (let id in stakeouts) {
			if (!(id in newStakeouts)) continue;

			newStakeouts[id] = stakeouts[id];
		}

		await ttStorage.set({ stakeouts: newStakeouts });
		console.log("Stakeouts updated!", newStakeouts);
	}
}
