"use strict";

const initiatedPages = {};

(async () => {
	initializeInternalPage({ sortTables: true });
	await loadDatabase();
	await showPage(getSearchParameters().get("page") || "attackHistory");

	document.body.classList.add(getPageTheme());
	storageListeners.settings.push(() => {
		document.body.classList.remove("dark", "light");
		document.body.classList.add(getPageTheme());
	});

	for (const navigation of document.findAll("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

// noinspection DuplicatedCode
async function showPage(name) {
	window.history.replaceState("", "Title", "?page=" + name);

	for (const active of document.findAll("header nav.on-page > ul > li.active")) active.classList.remove("active");
	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (const active of document.findAll("body > main:not(.tt-hidden)")) active.classList.add("tt-hidden");
	document.find(`#${name}`).classList.remove("tt-hidden");

	const setup = {
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

	_attackHistory.find("#percentageHistory").addEventListener("click", (event) => {
		_attackHistory.find("#attacksList").classList[event.target.checked ? "add" : "remove"]("switched");
	});

	_attackHistory.find("#resetHistory").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset attack history",
			message: "<h3>Are you sure you want to delete the attack history?</h3>",
		})
			.then(async () => {
				await ttStorage.reset("attackHistory");

				sendMessage("Attack history reset.", true);

				for (const row of _attackHistory.findAll("tr.row")) {
					row.remove();
				}
			})
			.catch(() => {});
	});

	function fillHistory() {
		for (const id in attackHistory.history) {
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
		row.appendChild(
			document.newElement({
				type: "td",
				class: "name",
				children: [
					document.newElement({ type: "a", text: data.name, href: `https://www.torn.com/profiles.php?XID=${id}`, attributes: { target: "_blank" } }),
				],
			})
		);

		const lastAttackText = `${formatDate({ milliseconds: data.lastAttack }, { showYear: true })}, ${formatTime({ milliseconds: data.lastAttack })}`;
		if (data.lastAttackCode) {
			row.appendChild(
				document.newElement({
					type: "td",
					class: "last-attack",
					attributes: { value: data.lastAttack },
					children: [
						document.newElement({
							type: "a",
							text: lastAttackText,
							href: `https://www.torn.com/loader.php?sid=attackLog&ID=${data.lastAttackCode}`,
							attributes: { target: "_blank" },
						}),
					],
				})
			);
		} else {
			row.appendChild(
				document.newElement({
					type: "td",
					class: "last-attack",
					text: lastAttackText,
					attributes: { value: data.lastAttack },
				})
			);
		}
		const totalWins = data.win;
		row.appendChild(document.newElement({ type: "td", class: "data win", text: totalWins.toString(), attributes: { value: totalWins } }));
		for (const type of ["mug", "leave", "hospitalise", "arrest", "special", "stealth"]) {
			const element = document.newElement({ type: "td", class: `data switchable ${type}`, attributes: { "sort-type": "css-dataset" } });

			const percentage = Math.round((data[type] / totalWins) * 100) || 0;

			element.dataset.amount = data[type].toString();
			element.dataset.percentage = percentage.toString();

			row.appendChild(element);
		}
		row.appendChild(document.newElement({ type: "td", class: "data assist", text: data.assist.toString(), attributes: { value: data.assist } }));
		row.appendChild(document.newElement({ type: "td", class: "data defend", text: data.defend.toString(), attributes: { value: data.defend } }));
		for (const type of ["lose", "stalemate", "escapes", "defend_lost"]) {
			row.appendChild(document.newElement({ type: "td", class: `data ${type}`, text: data[type].toString(), attributes: { value: data[type] } }));
		}

		if (data.respect_base.length) {
			const respect = parseFloat((data.respect_base.totalSum() / data.respect_base.length || 0).toFixed(2));

			row.appendChild(document.newElement({ type: "td", class: "data respect", text: respect.toString(), attributes: { value: respect } }));
		} else if (data.respect.length) {
			const respect = parseFloat((data.respect.totalSum() / data.respect.length || 0).toFixed(2));

			row.appendChild(document.newElement({ type: "td", class: "data respect", text: `${respect}*`, attributes: { value: respect } }));
		} else {
			row.appendChild(document.newElement({ type: "td", class: "data respect", text: "-", attributes: { value: -1 } }));
		}

		if (data.latestFairFightModifier) {
			row.appendChild(document.newElement({ type: "td", class: "data fair_fight", text: data.latestFairFightModifier, attributes: { value: data.latestFairFightModifier } }));
		} else {
			row.appendChild(document.newElement({ type: "td", class: "data fair_fight", text: "-", attributes: { value: -1 } }));
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
			message: "<h3>Are you sure you want to delete all stakeouts?</h3>",
		})
			.then(async () => {
				await ttStorage.reset("stakeouts");

				sendMessage("Stakeouts reset.", true);

				for (const row of document.findAll("#stakeoutList tr.row")) {
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
		for (const id in stakeouts) {
			if (isNaN(parseInt(id))) continue;

			addStakeout(id, stakeouts[id]);
		}
	}

	function addStakeout(id, data = {}, showStatus = true) {
		const row = document.newElement({ type: "tr", class: "row", id: `stakeout_${id}`, dataset: { id } });

		row.appendChild(
			document.newElement({
				type: "td",
				class: "id",
				children: [document.newElement({ type: "a", text: id, href: `https://www.torn.com/profiles.php?XID=${id}`, attributes: { target: "_blank" } })],
			})
		);
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

			row.appendChild(
				document.newElement({
					type: "td",
					class: "name",
					children: [
						document.newElement({
							type: "a",
							text: data.info.name,
							href: `https://www.torn.com/profiles.php?XID=${id}`,
							attributes: { target: "_blank" },
						}),
					],
				})
			);
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
			if (showStatus) row.classList.add("new");
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
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "label", attributes: { for: `life-${id}` }, text: "life drops below " }),
					document.newElement({ type: "input", id: `life-${id}`, class: "life short-input", attributes: { type: "number", min: 1, max: 100 } }),
					document.newElement({ type: "label", attributes: { for: `life-${id}` }, text: " %" }),
				],
			}),
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "label", attributes: { for: `offline-${id}` }, text: "offline for over " }),
					document.newElement({ type: "input", id: `offline-${id}`, class: "offline short-input", attributes: { type: "number", min: 1 } }),
					document.newElement({ type: "label", attributes: { for: `offline-${id}` }, text: " hours" }),
				],
			}),
			document.newElement({
				type: "div",
				children: [
					document.newElement({ type: "input", id: `revivable-${id}`, class: "revivable", attributes: { type: "checkbox" } }),
					document.newElement({ type: "label", attributes: { for: `revivable-${id}` }, text: "is revivable" }),
				],
			})
		);

		const alertsWrap = document.newElement({ type: "td", class: "alerts-wrap", children: alerts });
		row.appendChild(alertsWrap);

		if (data && data.alerts) {
			for (const key in data.alerts) {
				if (!data.alerts[key]) continue;

				const element = alertsWrap.find(`.${key}`);
				if (!element) continue;

				switch (typeof data.alerts[key]) {
					case "boolean":
						element.checked = true;
						break;
					case "number":
					case "string":
						element.value = data.alerts[key];
						break;
				}
			}
		}

		stakeoutList.appendChild(row);
	}

	function updateStakeouts() {
		[...stakeoutList.findAll("tr:not(.header)")]
			.filter((row) => !(parseInt(row.dataset.id) in stakeouts))
			.filter((row) => !row.classList.contains("new"))
			.forEach((row) => row.remove());

		for (const id in stakeouts) {
			if (isNaN(parseInt(id))) continue;

			const row = stakeoutList.find(`tr[data-id="${id}"]`);
			if (!row) {
				addStakeout(id, {}, false);
				continue;
			}

			row.classList.remove("new");

			row.find(".status").classList.remove("offline", "idle", "online");
			if (stakeouts[id] && stakeouts[id].info && Object.keys(stakeouts[id].info).length) {
				if (row.find(".name a")) row.find(".name a").textContent = stakeouts[id].info.name;
				else
					row.find(".name").appendChild(
						document.newElement({
							type: "a",
							text: stakeouts[id].info.name,
							href: `https://www.torn.com/profiles.php?XID=${id}`,
							attributes: { target: "_blank" },
						})
					);
				row.find(".status").textContent = stakeouts[id].info.last_action.status;
				row.find(".status").classList.add(stakeouts[id].info.last_action.status.toLowerCase());
				row.find(".last-action").textContent = stakeouts[id].info.last_action.relative;
			} else {
				row.find(".name").innerHTML = "";
				row.find(".status").textContent = "";
				row.find(".last-action").textContent = "";
			}

			const alerts = row.find(".alerts-wrap");
			alerts.find(".okay").checked = stakeouts[id].alerts.okay;
			alerts.find(".hospital").checked = stakeouts[id].alerts.hospital;
			alerts.find(".landing").checked = stakeouts[id].alerts.landing;
			alerts.find(".online").checked = stakeouts[id].alerts.online;
			alerts.find(".life").value = stakeouts[id].alerts.life || "";
			alerts.find(".offline").value = stakeouts[id].alerts.offline || "";
			alerts.find(".revivable").checked = stakeouts[id].alerts.revivable;
		}
	}

	async function saveStakeouts() {
		const newStakeouts = {};

		for (const row of stakeoutList.findAll("tr.row")) {
			const id = parseInt(row.dataset.id);

			const alertsSection = row.find(".alerts-wrap");

			newStakeouts[id] = {
				info: id in stakeouts ? stakeouts[id].info : {},
				alerts: {
					okay: alertsSection.find(".okay").checked,
					hospital: alertsSection.find(".hospital").checked,
					landing: alertsSection.find(".landing").checked,
					online: alertsSection.find(".online").checked,
					life: parseInt(alertsSection.find(".life").value) || false,
					offline: parseInt(alertsSection.find(".offline").value) || false,
					revivable: alertsSection.find(".revivable").checked,
				},
			};
		}

		await ttStorage.set({ stakeouts: newStakeouts });
		console.log("Stakeouts updated!", newStakeouts);

		sendMessage("Stakeouts saved.", true);
	}
}
