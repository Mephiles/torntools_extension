// @ts-ignore Detects reassignment, but those pages are never loaded in the same context.
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

	for (const navigation of findAllElements("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

// @ts-ignore Detects reassignment, but those pages are never loaded in the same context.
async function showPage(name: string) {
	window.history.replaceState("", "Title", "?page=" + name);

	for (const active of findAllElements("header nav.on-page > ul > li.active")) active.classList.remove("active");
	document.querySelector(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (const active of findAllElements("body > main:not(.tt-hidden)")) active.classList.add("tt-hidden");
	document.querySelector(`#${name}`).classList.remove("tt-hidden");

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
	const _attackHistory = document.querySelector("#attackHistory");
	const historyList = _attackHistory.querySelector<HTMLElement>("#attacksList");

	fillHistory();
	sortTable(historyList, 3, "desc");

	_attackHistory.querySelector("#percentageHistory").addEventListener("click", (event) => {
		_attackHistory.querySelector("#attacksList").classList[(event.target as HTMLInputElement).checked ? "add" : "remove"]("switched");
	});

	_attackHistory.querySelector("#resetHistory").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset attack history",
			message: "<h3>Are you sure you want to delete the attack history?</h3>",
		})
			.then(async () => {
				await ttStorage.reset("attackHistory");

				sendMessage("Attack history reset.", true);

				for (const row of findAllElements("tr.row", _attackHistory)) {
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

	function addHistoryRow(id: string, data: AttackHistory) {
		const row = elementBuilder({ type: "tr", class: "row" });

		row.appendChild(
			elementBuilder({
				type: "td",
				class: "id",
				children: [elementBuilder({ type: "a", text: id, href: `https://www.torn.com/profiles.php?XID=${id}`, attributes: { target: "_blank" } })],
			})
		);
		row.appendChild(
			elementBuilder({
				type: "td",
				class: "name",
				children: [
					elementBuilder({ type: "a", text: data.name, href: `https://www.torn.com/profiles.php?XID=${id}`, attributes: { target: "_blank" } }),
				],
			})
		);

		const lastAttackText = `${formatDate({ milliseconds: data.lastAttack }, { showYear: true })}, ${formatTime({ milliseconds: data.lastAttack })}`;
		if (data.lastAttackCode) {
			row.appendChild(
				elementBuilder({
					type: "td",
					class: "last-attack",
					attributes: { value: data.lastAttack },
					children: [
						elementBuilder({
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
				elementBuilder({
					type: "td",
					class: "last-attack",
					text: lastAttackText,
					attributes: { value: data.lastAttack },
				})
			);
		}
		const totalWins = data.win;
		row.appendChild(elementBuilder({ type: "td", class: "data win", text: totalWins.toString(), attributes: { value: totalWins } }));
		for (const type of ["mug", "leave", "hospitalise", "arrest", "special", "stealth"]) {
			const element = elementBuilder({ type: "td", class: `data switchable ${type}`, attributes: { "sort-type": "css-dataset" } });

			const percentage = Math.round((data[type] / totalWins) * 100) || 0;

			element.dataset.amount = data[type].toString();
			element.dataset.percentage = percentage.toString();

			row.appendChild(element);
		}
		row.appendChild(elementBuilder({ type: "td", class: "data assist", text: data.assist.toString(), attributes: { value: data.assist } }));
		row.appendChild(elementBuilder({ type: "td", class: "data defend", text: data.defend.toString(), attributes: { value: data.defend } }));
		for (const type of ["lose", "stalemate", "escapes", "defend_lost"]) {
			row.appendChild(elementBuilder({ type: "td", class: `data ${type}`, text: data[type].toString(), attributes: { value: data[type] } }));
		}

		if (data.respect_base.length) {
			const respect = parseFloat((data.respect_base.reduce((a, b) => a + b, 0) / data.respect_base.length || 0).toFixed(2));

			row.appendChild(elementBuilder({ type: "td", class: "data respect", text: respect.toString(), attributes: { value: respect } }));
		} else if (data.respect.length) {
			const respect = parseFloat((data.respect.reduce((a, b) => a + b, 0) / data.respect.length || 0).toFixed(2));

			row.appendChild(elementBuilder({ type: "td", class: "data respect", text: `${respect}*`, attributes: { value: respect } }));
		} else {
			row.appendChild(elementBuilder({ type: "td", class: "data respect", text: "-", attributes: { value: -1 } }));
		}

		if (data.latestFairFightModifier) {
			row.appendChild(
				elementBuilder({
					type: "td",
					class: "data fair_fight",
					text: data.latestFairFightModifier,
					attributes: { value: data.latestFairFightModifier },
				})
			);
		} else {
			row.appendChild(elementBuilder({ type: "td", class: "data fair_fight", text: "-", attributes: { value: -1 } }));
		}

		historyList.appendChild(row);
	}
}

async function setupStakeouts() {
	const _stakeouts = document.querySelector("#stakeouts");
	const stakeoutList = _stakeouts.querySelector<HTMLElement>("#stakeoutList");

	fillStakeouts();
	storageListeners.stakeouts.push(updateStakeouts);

	new Sortable(stakeoutList, { animation: 150 });

	_stakeouts.querySelector("#saveStakeouts").addEventListener("click", async () => await saveStakeouts());
	_stakeouts.querySelector("#resetStakeouts").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset stakeouts",
			message: "<h3>Are you sure you want to delete all stakeouts?</h3>",
		})
			.then(async () => {
				await ttStorage.reset("stakeouts");

				sendMessage("Stakeouts reset.", true);

				for (const row of findAllElements("#stakeoutList tr.row")) {
					row.remove();
				}
			})
			.catch(() => {});
	});

	document.querySelector("#addStakeout").addEventListener("click", async () => {
		const id = document.querySelector<HTMLInputElement>("#stakeoutId").value;
		if (!id) return;

		if (document.querySelector(`#stakeout_${id}`)) {
			sendMessage("This id already has a stakeout.", false);
		} else {
			addStakeout(parseInt(id));
		}

		document.querySelector<HTMLInputElement>("#stakeoutId").value = "";
	});

	function fillStakeouts() {
		for (const id of stakeouts.order) {
			const stakeout = stakeouts[id];
			if (typeof stakeout !== "object" || Array.isArray(stakeout)) continue;

			addStakeout(parseInt(id), stakeout);
		}
	}

	function addStakeout(id: number, data: StakeoutData | null = null, showStatus = true) {
		const row = elementBuilder({ type: "tr", class: "row", id: `stakeout_${id}`, dataset: { id } });

		row.appendChild(
			elementBuilder({
				type: "td",
				class: "id",
				children: [elementBuilder({ type: "a", text: id, href: `https://www.torn.com/profiles.php?XID=${id}`, attributes: { target: "_blank" } })],
			})
		);
		if (data && data.info !== null) {
			let statusValue: number;
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
				elementBuilder({
					type: "td",
					class: "name",
					children: [
						elementBuilder({
							type: "a",
							text: data.info.name,
							href: `https://www.torn.com/profiles.php?XID=${id}`,
							attributes: { target: "_blank" },
						}),
					],
				})
			);
			row.appendChild(
				elementBuilder({
					type: "td",
					class: `status ${data.info.last_action.status.toLowerCase()}`,
					text: data.info.last_action.status,
					attributes: { value: statusValue },
				})
			);
			row.appendChild(
				elementBuilder({
					type: "td",
					class: "last-action",
					text: data.info.last_action.relative,
					attributes: { value: Date.now() - data.info.last_action.timestamp },
				})
			);
		} else {
			if (showStatus) row.classList.add("new");
			row.appendChild(elementBuilder({ type: "td", class: "name", text: "" }));
			row.appendChild(elementBuilder({ type: "td", class: "status", text: "", attributes: { value: 0 } }));
			row.appendChild(elementBuilder({ type: "td", class: "last-action", text: "", attributes: { value: 0 } }));
		}

		const deleteButton = elementBuilder({
			type: "button",
			class: "delete",
			children: [elementBuilder({ type: "i", class: "remove-icon fa-solid fa-trash-can" })],
		});
		deleteButton.addEventListener("click", () => row.remove());

		row.appendChild(
			elementBuilder({
				type: "td",
				class: "delete-wrap",
				children: [deleteButton],
			})
		);

		const alerts = [];

		alerts.push(
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "input", id: `okay-${id}`, class: "okay", attributes: { type: "checkbox" } }),
					elementBuilder({ type: "label", attributes: { for: `okay-${id}` }, text: "is okay" }),
				],
			}),
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "input", id: `hospital-${id}`, class: "hospital", attributes: { type: "checkbox" } }),
					elementBuilder({ type: "label", attributes: { for: `hospital-${id}` }, text: "is in hospital" }),
				],
			}),
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "input", id: `landing-${id}`, class: "landing", attributes: { type: "checkbox" } }),
					elementBuilder({ type: "label", attributes: { for: `landing-${id}` }, text: "lands" }),
				],
			}),
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "input", id: `online-${id}`, class: "online", attributes: { type: "checkbox" } }),
					elementBuilder({ type: "label", attributes: { for: `online-${id}` }, text: "comes online" }),
				],
			}),
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "label", attributes: { for: `life-${id}` }, text: "life drops below " }),
					elementBuilder({ type: "input", id: `life-${id}`, class: "life short-input", attributes: { type: "number", min: 1, max: 100 } }),
					elementBuilder({ type: "label", attributes: { for: `life-${id}` }, text: " %" }),
				],
			}),
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "label", attributes: { for: `offline-${id}` }, text: "offline for over " }),
					elementBuilder({ type: "input", id: `offline-${id}`, class: "offline short-input", attributes: { type: "number", min: 1 } }),
					elementBuilder({ type: "label", attributes: { for: `offline-${id}` }, text: " hours" }),
				],
			}),
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({ type: "input", id: `revivable-${id}`, class: "revivable", attributes: { type: "checkbox" } }),
					elementBuilder({ type: "label", attributes: { for: `revivable-${id}` }, text: "is revivable" }),
				],
			})
		);

		const alertsWrap = elementBuilder({ type: "td", class: "alerts-wrap", children: alerts });
		row.appendChild(alertsWrap);

		if (data && data.alerts) {
			for (const key in data.alerts) {
				if (!data.alerts[key]) continue;

				const element = alertsWrap.querySelector<HTMLInputElement>(`.${key}`);
				if (!element) continue;

				switch (typeof data.alerts[key]) {
					case "boolean":
						element.checked = true;
						break;
					case "number":
					case "string":
						element.value = data.alerts[key].toString();
						break;
				}
			}
		}

		stakeoutList.appendChild(row);
	}

	function updateStakeouts() {
		findAllElements("tr:not(.header)", stakeoutList)
			.filter((row) => !(parseInt(row.dataset.id) in stakeouts))
			.filter((row) => !row.classList.contains("new"))
			.forEach((row) => row.remove());

		for (const id of stakeouts.order) {
			if (isNaN(parseInt(id))) continue;

			const row = stakeoutList.querySelector(`tr[data-id="${id}"]`);
			if (!row) {
				addStakeout(parseInt(id), null, false);
				continue;
			}

			row.classList.remove("new");

			row.querySelector(".status").classList.remove("offline", "idle", "online");
			const stakeout = stakeouts[id];
			if (typeof stakeout !== "object" || Array.isArray(stakeout)) continue;

			if (Object.keys(stakeout.info).length) {
				if (row.querySelector(".name a")) row.querySelector(".name a").textContent = stakeout.info.name;
				else
					row.querySelector(".name").appendChild(
						elementBuilder({
							type: "a",
							text: stakeout.info.name,
							href: `https://www.torn.com/profiles.php?XID=${id}`,
							attributes: { target: "_blank" },
						})
					);
				row.querySelector(".status").textContent = stakeout.info.last_action.status;
				row.querySelector(".status").classList.add(stakeout.info.last_action.status.toLowerCase());
				row.querySelector(".last-action").textContent = stakeout.info.last_action.relative;
			} else {
				row.querySelector(".name").innerHTML = "";
				row.querySelector(".status").textContent = "";
				row.querySelector(".last-action").textContent = "";
			}

			const alerts = row.querySelector(".alerts-wrap");
			alerts.querySelector<HTMLInputElement>(".okay").checked = stakeout.alerts.okay;
			alerts.querySelector<HTMLInputElement>(".hospital").checked = stakeout.alerts.hospital;
			alerts.querySelector<HTMLInputElement>(".landing").checked = stakeout.alerts.landing;
			alerts.querySelector<HTMLInputElement>(".online").checked = stakeout.alerts.online;
			alerts.querySelector<HTMLInputElement>(".life").value = stakeout.alerts.life.toString() || "";
			alerts.querySelector<HTMLInputElement>(".offline").value = stakeout.alerts.offline.toString() || "";
			alerts.querySelector<HTMLInputElement>(".revivable").checked = stakeout.alerts.revivable;
		}
	}

	async function saveStakeouts() {
		const newStakeouts: StoredStakeouts = {
			order: findAllElements("tr.row", stakeoutList).map((row) => row.dataset.id),
			date: 0,
		};

		for (const row of findAllElements("tr.row", stakeoutList)) {
			const id = parseInt(row.dataset.id);

			const alertsSection = row.querySelector(".alerts-wrap");

			newStakeouts[id] = {
				info: id in stakeouts && typeof stakeouts[id] === "object" && !Array.isArray(stakeouts[id]) ? stakeouts[id].info : null,
				alerts: {
					okay: alertsSection.querySelector<HTMLInputElement>(".okay").checked,
					hospital: alertsSection.querySelector<HTMLInputElement>(".hospital").checked,
					landing: alertsSection.querySelector<HTMLInputElement>(".landing").checked,
					online: alertsSection.querySelector<HTMLInputElement>(".online").checked,
					life: parseInt(alertsSection.querySelector<HTMLInputElement>(".life").value) || false,
					offline: parseInt(alertsSection.querySelector<HTMLInputElement>(".offline").value) || false,
					revivable: alertsSection.querySelector<HTMLInputElement>(".revivable").checked,
				},
			};
		}

		newStakeouts.order = findAllElements("tr.row", stakeoutList).map((row) => row.dataset.id);

		await ttStorage.set({ stakeouts: newStakeouts });
		console.log("Stakeouts updated!", newStakeouts);

		sendMessage("Stakeouts saved.", true);
	}
}
