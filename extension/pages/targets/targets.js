let initiatedPages = {};

(async () => {
	await loadDatabase();
	await showPage(getSearchParameters().get("page") || "attackHistory");

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
		attackHistory: setupAttackHistory,
		stakeouts: setupStakeouts,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		await setup[name]();
		initiatedPages[name] = true;
	}
}

async function setupAttackHistory() {
	const _attackHistory = document.find("#attackHistory");
	const historyList = _attackHistory.find("#attacksList");

	fillHistory();
	sortTable(historyList, 3, "desc");

	function fillHistory() {
		for (let id in attackHistory.history) {
			addHistoryRow(id, attackHistory.history[id]);
		}
	}

	function addHistoryRow(id, data = {}) {
		const row = document.newElement({ type: "tr", class: "row" });

		row.appendChild(
			document.newElement({
				type: "td",
				class: "id",
				children: [document.newElement({ type: "a", text: id, href: `https://www.torn.com/profiles.php?XID=${id}`, attributes: { target: "_blank" } })],
			})
		);
		row.appendChild(document.newElement({ type: "td", class: "name", text: data.name }));
		row.appendChild(
			document.newElement({
				type: "td",
				class: "last-attack",
				text: `${formatDate({ milliseconds: data.lastAttack }, { showYear: true })}, ${formatTime({ milliseconds: data.lastAttack })}`,
				attributes: { value: data.lastAttack },
			})
		);
		const totalWins = data.win;
		row.appendChild(document.newElement({ type: "td", class: `data win`, text: totalWins.toString(), attributes: { value: totalWins } }));
		for (let type of ["mug", "leave", "hospitalise", "arrest", "special", "stealth"]) {
			let element = document.newElement({ type: "td", class: `data ${type}`, text: "%", attributes: { value: data[type] } });

			const percentage = Math.round((data[type] / totalWins) * 100) || 0;

			element.innerText = `${percentage}%`;

			element.dataset.amount = data[type].toString();
			element.dataset.percentage = "25";

			row.appendChild(element);
		}
		row.appendChild(document.newElement({ type: "td", class: `data assist`, text: data.assist.toString(), attributes: { value: data.assist } }));
		row.appendChild(document.newElement({ type: "td", class: `data defend`, text: data.defend.toString(), attributes: { value: data.defend } }));
		for (let type of ["lose", "stalemate", "escapes", "defend_lost"]) {
			row.appendChild(document.newElement({ type: "td", class: `data ${type}`, text: data[type].toString(), attributes: { value: data[type] } }));
		}

		if (data.respect_base.length) {
			const respect = parseFloat((data.respect_base.reduce((a, b) => a + b, 0) / data.respect_base.length || 0).toFixed(2));

			row.appendChild(document.newElement({ type: "td", class: "data respect", text: respect.toString(), attributes: { value: respect } }));
		} else if (data.respect.length) {
			const respect = parseFloat((data.respect.reduce((a, b) => a + b, 0) / data.respect.length || 0).toFixed(2));

			row.appendChild(document.newElement({ type: "td", class: "data respect", text: `${respect}*`, attributes: { value: respect } }));
		} else {
			row.appendChild(document.newElement({ type: "td", class: "data respect", text: "-", attributes: { value: -1 } }));
		}

		historyList.appendChild(row);
	}
}

async function setupStakeouts() {
	const _stakeouts = document.find("#stakeouts");
	const stakeoutList = _stakeouts.find("#stakeoutList");

	fillStakeouts();
	storageListeners.stakeouts.push(updateStakeouts);

	_stakeouts.find("#saveStakeouts").addEventListener("click", async () => await saveStakeouts());
	_stakeouts.find("#resetStakeouts").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset stakeouts",
			message: `<h3>Are you sure you want to delete all stakeouts?</h3>`,
		})
			.then(async () => {
				await ttStorage.set({ stakeouts: {} });

				sendMessage("Stakeouts reset.", true);

				for (let row of document.findAll("#stakeoutList tr.row")) {
					row.remove();
				}
			})
			.catch(() => {});
	});

	document.find("#addStakeout").addEventListener("click", async () => {
		const id = document.find("#stakeoutId").value;
		if (!id) return;

		if (document.find(`#stakeout_${id}`)) {
			sendMessage("This id already has a stakeout.", false);
		} else {
			addStakeout(parseInt(id));
		}

		document.find("#stakeoutId").value = "";
	});

	function fillStakeouts() {
		for (let id in stakeouts) {
			addStakeout(id, stakeouts[id]);
		}
	}

	function addStakeout(id, data = {}) {
		const row = document.newElement({ type: "tr", class: "row", id: `stakeout_${id}` });

		row.appendChild(document.newElement({ type: "td", class: "id", text: id }));
		if (data && data.info && Object.keys(data.info).length) {
			let statusValue;
			switch (data.info.last_action.status.toLowerCase()) {
				case "offline":
					statusValue = 3;
					break;
				case "idle":
					statusValue = 2;
					break;
				case "online":
					statusValue = 1;
					break;
				default:
					statusValue = 0;
					break;
			}

			row.appendChild(document.newElement({ type: "td", class: "name", text: data.info.name }));
			row.appendChild(
				document.newElement({
					type: "td",
					class: `status ${data.info.last_action.status.toLowerCase()}`,
					text: data.info.last_action.status,
					attributes: { value: statusValue },
				})
			);
			row.appendChild(
				document.newElement({
					type: "td",
					class: "last-action",
					text: data.info.last_action.relative,
					attributes: { value: Date.now() - data.info.last_action.timestamp },
				})
			);
		} else {
			row.appendChild(document.newElement({ type: "td", class: "name", text: "" }));
			row.appendChild(document.newElement({ type: "td", class: "status", text: "", attributes: { value: 0 } }));
			row.appendChild(document.newElement({ type: "td", class: "last-action", text: "", attributes: { value: 0 } }));
		}

		const deleteButton = document.newElement({
			type: "button",
			class: "delete",
			children: [document.newElement({ type: "i", class: "remove-icon fas fa-trash-alt" })],
		});
		deleteButton.addEventListener("click", () => row.remove());

		row.appendChild(
			document.newElement({
				type: "td",
				class: "delete-wrap",
				children: [deleteButton],
			})
		);

		const alerts = [];

		alerts.push(
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "input", id: `okay-${id}`, class: "okay", attributes: { type: "checkbox" } }),
					document.newElement({ type: "label", attributes: { for: `okay-${id}` }, text: "is okay" }),
				],
			}),
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "input", id: `hospital-${id}`, class: "hospital", attributes: { type: "checkbox" } }),
					document.newElement({ type: "label", attributes: { for: `hospital-${id}` }, text: "is in hospital" }),
				],
			}),
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "input", id: `landing-${id}`, class: "landing", attributes: { type: "checkbox" } }),
					document.newElement({ type: "label", attributes: { for: `landing-${id}` }, text: "lands" }),
				],
			}),
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "input", id: `online-${id}`, class: "online", attributes: { type: "checkbox" } }),
					document.newElement({ type: "label", attributes: { for: `online-${id}` }, text: "comes online" }),
				],
			}),
			// document.newElement({
			// 	type: "div",
			// 	children: [
			// 		document.newElement({ type: "input", id: `life-${id}`, class: "life", attributes: { type: "checkbox" } }),
			// 		document.newElement({ type: "label", attributes: { for: `life-${id}` }, text: "life drops" }),
			// 	],
			// })
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "label", attributes: { for: `life-${id}` }, text: "life drops below" }),
					document.newElement({ type: "input", id: `life-${id}`, class: "life", attributes: { type: "number", min: 1, max: 100 } }),
					document.newElement({ type: "label", attributes: { for: `life-${id}` }, text: "%" }),
				],
			})
		);

		row.appendChild(
			document.newElement({
				type: "td",
				class: "alerts-wrap",
				children: alerts,
			})
		);

		if (data && data.alerts) {
			for (let key in data.alerts) {
				if (!data.alerts[key]) continue;

				switch (typeof data.alerts[key]) {
					case "boolean":
						row.find(`.${key}`).checked = true;
						break;
					case "number":
					case "string":
						row.find(`.${key}`).value = data.alerts[key];
						break;
				}
			}
		}

		stakeoutList.appendChild(row);
	}

	function updateStakeouts() {
		for (let id in stakeouts) {
			const row = stakeoutList.find(`tr .id=${id}`).parentElement;

			row.find(".status").classList.remove("offline", "idle", "online");
			if (stakeouts[id] && stakeouts[id].info && Object.keys(stakeouts[id].info).length) {
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

	async function saveStakeouts() {
		const newStakeouts = {};

		for (let row of stakeoutList.findAll("tr.row")) {
			const id = parseInt(row.find(".id").innerText);

			newStakeouts[id] = {
				info: id in stakeouts ? stakeouts[id].info : {},
				alerts: {
					okay: row.find(".okay").checked,
					hospital: row.find(".hospital").checked,
					landing: row.find(".landing").checked,
					online: row.find(".online").checked,
					// life: row.find(".life").checked,
					life: parseInt(row.find(".life").value),
				},
			};
		}

		await ttStorage.set({ stakeouts: newStakeouts });
		console.log("Stakeouts updated!", newStakeouts);

		sendMessage("Stakeouts saved.", true);
	}
}
