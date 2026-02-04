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
	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (const active of findAllElements("body > main:not(.tt-hidden)")) active.classList.add("tt-hidden");
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
		_attackHistory.find("#attacksList").classList[(event.target as HTMLInputElement).checked ? "add" : "remove"]("switched");
	});

	_attackHistory.find("#resetHistory").addEventListener("click", () => {
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
	const _stakeouts = document.find("#stakeouts");
	const stakeoutList = _stakeouts.find("#stakeoutList");

	fillStakeouts();
	storageListeners.stakeouts.push(updateStakeouts);

	new Sortable(stakeoutList, { animation: 150 });

	_stakeouts.find("#saveStakeouts").addEventListener("click", async () => await saveStakeouts());
	_stakeouts.find("#resetStakeouts").addEventListener("click", () => {
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

	document.find("#addStakeout").addEventListener("click", async () => {
		const id = document.find<HTMLInputElement>("#stakeoutId").value;
		if (!id) return;

		if (document.find(`#stakeout_${id}`)) {
			sendMessage("This id already has a stakeout.", false);
		} else {
			addStakeout(parseInt(id));
		}

		document.find<HTMLInputElement>("#stakeoutId").value = "";
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

				const element = alertsWrap.find<HTMLInputElement>(`.${key}`);
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

			const row = stakeoutList.find(`tr[data-id="${id}"]`);
			if (!row) {
				addStakeout(parseInt(id), null, false);
				continue;
			}

			row.classList.remove("new");

			row.find(".status").classList.remove("offline", "idle", "online");
			const stakeout = stakeouts[id];
			if (typeof stakeout !== "object" || Array.isArray(stakeout)) continue;

			if (Object.keys(stakeout.info).length) {
				if (row.find(".name a")) row.find(".name a").textContent = stakeout.info.name;
				else
					row.find(".name").appendChild(
						elementBuilder({
							type: "a",
							text: stakeout.info.name,
							href: `https://www.torn.com/profiles.php?XID=${id}`,
							attributes: { target: "_blank" },
						})
					);
				row.find(".status").textContent = stakeout.info.last_action.status;
				row.find(".status").classList.add(stakeout.info.last_action.status.toLowerCase());
				row.find(".last-action").textContent = stakeout.info.last_action.relative;
			} else {
				row.find(".name").innerHTML = "";
				row.find(".status").textContent = "";
				row.find(".last-action").textContent = "";
			}

			const alerts = row.find(".alerts-wrap");
			alerts.find<HTMLInputElement>(".okay").checked = stakeout.alerts.okay;
			alerts.find<HTMLInputElement>(".hospital").checked = stakeout.alerts.hospital;
			alerts.find<HTMLInputElement>(".landing").checked = stakeout.alerts.landing;
			alerts.find<HTMLInputElement>(".online").checked = stakeout.alerts.online;
			alerts.find<HTMLInputElement>(".life").value = stakeout.alerts.life.toString() || "";
			alerts.find<HTMLInputElement>(".offline").value = stakeout.alerts.offline.toString() || "";
			alerts.find<HTMLInputElement>(".revivable").checked = stakeout.alerts.revivable;
		}
	}

	async function saveStakeouts() {
		const newStakeouts: StoredStakeouts = {
			order: findAllElements("tr.row", stakeoutList).map((row) => row.dataset.id),
			date: 0,
		};

		for (const row of findAllElements("tr.row", stakeoutList)) {
			const id = parseInt(row.dataset.id);

			const alertsSection = row.find(".alerts-wrap");

			newStakeouts[id] = {
				info: id in stakeouts && typeof stakeouts[id] === "object" && !Array.isArray(stakeouts[id]) ? stakeouts[id].info : null,
				alerts: {
					okay: alertsSection.find<HTMLInputElement>(".okay").checked,
					hospital: alertsSection.find<HTMLInputElement>(".hospital").checked,
					landing: alertsSection.find<HTMLInputElement>(".landing").checked,
					online: alertsSection.find<HTMLInputElement>(".online").checked,
					life: parseInt(alertsSection.find<HTMLInputElement>(".life").value) || false,
					offline: parseInt(alertsSection.find<HTMLInputElement>(".offline").value) || false,
					revivable: alertsSection.find<HTMLInputElement>(".revivable").checked,
				},
			};
		}

		newStakeouts.order = findAllElements("tr.row", stakeoutList).map((row) => row.dataset.id);

		await ttStorage.set({ stakeouts: newStakeouts });
		console.log("Stakeouts updated!", newStakeouts);

		sendMessage("Stakeouts saved.", true);
	}
}
