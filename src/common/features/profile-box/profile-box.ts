import "./profile-box.css";
import { ttStorage } from "@common/utils/context";
import { ttCache } from "@common/utils/data/cache";
import { attackHistory, filters, settings, stakeouts, userdata } from "@common/utils/data/database";
import type { StakeoutData } from "@common/utils/data/default-database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import { createTable, stringCellRenderer } from "@common/utils/elements/table/table";
import { createTextbox } from "@common/utils/elements/textbox/textbox";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findAllElements, isHTMLElement, showLoadingPlaceholder } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, isOwnProfile, millisToNewDay } from "@common/utils/functions/torn";
import { PHBoldArrowClockwise, PHFillArrowsOutCardinal, PHFillGear } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import { STATS } from "@features/profile-box/stats-list";
import Sortable from "sortablejs";
import type { UserHofResponse, UserLastActionStatusEnum, UserPersonalStatsFull, UserStatusStateEnum } from "tornapi-typescript";
import { performSpy } from "./spy-performer";

function numberCellRenderer(value: StatValue | { relative: StatValue; value: StatValue }) {
	let node: Node;
	if (typeof value === "object") {
		const isRelative = filters.profile.relative;

		const actualValue = isRelative ? value.relative : value.value;
		const forceOperation = isRelative;

		const options = { forceOperation };
		node = elementBuilder({
			type: "span",
			class: "relative-field",
			text: formatNumber(actualValue, options),
			dataset: { value: value.value, relative: value.relative, options },
		});
	} else {
		node = document.createTextNode(formatNumber(value));
	}

	return {
		element: node,
		dispose: () => {},
	};
}

function currencyCellRenderer(data: StatValue | { relative: StatValue; value: StatValue }) {
	let node: Node;
	if (typeof data === "object") {
		const isRelative = filters.profile.relative;

		const value = isRelative ? data.relative : data.value;
		const forceOperation = isRelative;

		const options = { currency: true, forceOperation };
		node = elementBuilder({
			type: "span",
			class: "relative-field",
			text: formatNumber(value, options),
			dataset: { value: data.value, relative: data.relative, options },
		});
	} else {
		node = document.createTextNode(formatNumber(data, { currency: true }));
	}

	return {
		element: node,
		dispose: () => {},
	};
}

type StatFormat = "currency";

type StatValue = number | "N/A";

interface StatRow {
	stat: string;
	them: StatValue;
	you: { value: StatValue; relative: StatValue };
	format?: StatFormat | null;
	type?: string;
}

let overlayStatus = false;

async function showBox() {
	const userInfoValue = await requireElement(".basic-information .info-table .user-info-value > *:first-child");

	const match = userInfoValue.textContent!.trim().match(/\[(\d*)]/i);
	if (!match?.[1]) return;
	const id = parseInt(match[1]);

	const { content, options } = createContainer("User Information", {
		nextElement: document.querySelector(".medals-wrapper") || document.querySelector(".basic-information")?.closest(".profile-wrapper") || undefined,
		class: "mt10",
	});

	if (settings.pages.profile.boxFetch) {
		showRelative();
		buildStats().catch((error) => console.log("TT - Couldn't build the stats part of the profile box.", error));
		buildSpy(false).catch((error) => console.log("TT - Couldn't build the spy part of the profile box.", error));
	} else {
		const button = elementBuilder({
			type: "button",
			class: "tt-btn",
			text: "Fetch data from the API.",
			events: {
				async click() {
					showLoadingPlaceholder(section, true);
					button.classList.add("tt-hidden");

					let finished = 0;

					showRelative();
					buildStats()
						.catch((error) => console.log("TT - Couldn't build the stats part of the profile box.", error))
						.then(handleBuild);
					buildSpy(false)
						.catch((error) => console.log("TT - Couldn't build the spy part of the profile box.", error))
						.then(handleBuild);

					function handleBuild() {
						finished++;

						if (finished === 1) {
							section.remove();
						} else if (finished === 2) {
							for (const section of findAllElements(".section[order]", content).sort(
								(a, b) => parseInt(a.getAttribute("order")!) - parseInt(b.getAttribute("order")!),
							))
								section.parentElement!.appendChild(section);
						}
					}
				},
			},
		});

		const section = elementBuilder({
			type: "div",
			class: "manually-fetch",
			children: [button],
		});

		content.appendChild(section);
	}

	buildStakeouts().catch((error) => console.log("TT - Couldn't build the stakeout part of the profile box.", error));
	buildAttackHistory().catch((error) => console.log("TT - Couldn't build the attack history part of the profile box.", error));

	function showRelative() {
		const relativeValue = createCheckbox({ description: "Relative values" });
		relativeValue.setChecked(filters.profile.relative);
		relativeValue.onChange(() => {
			const isRelative = relativeValue.isChecked();

			for (const field of findAllElements<HTMLElement>(".relative-field", content)) {
				const value = isRelative ? field.dataset.relative : field.dataset.value;

				const options = { ...(JSON.parse(field.dataset.options ?? "false") || {}), forceOperation: isRelative };

				field.textContent = formatNumber(value, options);
			}

			ttStorage.change({ filters: { profile: { relative: isRelative } } });
		});
		options.appendChild(relativeValue.element);
	}

	async function buildStats() {
		if (!settings.pages.profile.boxStats || !settings.apiUsage.user.personalstats || !settings.apiUsage.user.crimes) return;

		const section = elementBuilder({ type: "div", class: "section user-stats" });
		content.appendChild(section);

		showLoadingPlaceholder(section, true);

		let data: UserPersonalStatsFull & UserHofResponse;
		if (ttCache.hasValue("personal-stats", id)) {
			data = ttCache.get<UserPersonalStatsFull & UserHofResponse>("personal-stats", id);
		} else {
			try {
				data = await fetchData<UserPersonalStatsFull & UserHofResponse>("tornv2", {
					section: "user",
					id,
					selections: ["personalstats", "hof"],
					params: { cat: ["all"] },
					silent: true,
				});

				triggerCustomListener(EVENT_CHANNELS.PROFILE_FETCHED, { data });

				ttCache.set({ [id]: data }, millisToNewDay(), "personal-stats");
			} catch (error) {
				console.log("TT - Couldn't fetch users stats.", error);
			}
		}

		if (data) {
			buildCustom();
			buildOthers();

			const sortable = new Sortable(section.querySelector(".custom-stats .tt-table-body")!, {
				animation: 150,
				disabled: true,
				onEnd: () => saveStats(),
			});

			const moveButton = elementBuilder({
				type: "button",
				class: "move-stats",
				children: [PHFillArrowsOutCardinal()],
				events: {
					click() {
						if (moveButton.classList.toggle("active")) {
							// Enable movement.
							section.querySelector(".other-stats-button")!.setAttribute("disabled", "");
							findAllElements(".custom-stats .tt-table-row", section).forEach((row) => row.classList.add("tt-sortable"));

							sortable.option("disabled", false);
						} else {
							// Disable movement.
							section.querySelector(".other-stats-button")!.removeAttribute("disabled");
							findAllElements(".custom-stats .tt-table-row", section).forEach((row) => row.classList.remove("tt-sortable"));

							sortable.option("disabled", true);
						}
					},
				},
			});

			const otherList = elementBuilder({
				type: "button",
				class: "tt-btn other-stats-button",
				text: "View other stats.",
				events: {
					click() {
						const isCustom = !content.querySelector(".custom-stats")!.classList.toggle("tt-hidden");

						if (isCustom) {
							content.querySelector(".other-stats")!.classList.add("tt-hidden");
							content.querySelector(".move-stats")!.classList.remove("tt-hidden");
							otherList.textContent = "View other stats.";
						} else {
							content.querySelector(".other-stats")!.classList.remove("tt-hidden");
							content.querySelector(".move-stats")!.classList.add("tt-hidden");
							otherList.textContent = "View custom list.";
						}
					},
				},
			});

			const editButton = elementBuilder({
				type: "button",
				class: "edit-stats",
				children: [PHFillGear()],
				events: {
					click() {
						const overlay = document.querySelector(".tt-overlay")!;

						const button = section.querySelector(".edit-stats")!;
						const otherStatsButton = section.querySelector(".other-stats-button")!;

						const customStats = section.querySelector(".custom-stats")!;
						const otherStats = section.querySelector(".other-stats")!;

						if (overlay.classList.toggle("tt-hidden")) {
							// Overlay is now hidden.
							[button, otherStatsButton, customStats, otherStats].forEach((element) => element.classList.remove("tt-overlay-item"));
							findAllElements(".tt-table-row:not(.tt-table-row-header)", section).forEach((row) => row.removeEventListener("click", onStatClick));
							overlayStatus = false;
						} else {
							// Overlay is now shown.
							[button, otherStatsButton, customStats, otherStats].forEach((element) => element.classList.add("tt-overlay-item"));
							findAllElements(".tt-table-row:not(.tt-table-row-header)", section).forEach((row) => row.addEventListener("click", onStatClick));
							overlayStatus = true;
						}
					},
				},
			});

			const actions = elementBuilder({ type: "div", class: "stat-actions", children: [moveButton, otherList, editButton] });
			section.appendChild(actions);
		} else {
			section.appendChild(elementBuilder({ type: "div", class: "stats-error-message", text: "Failed to fetch data." }));
		}

		showLoadingPlaceholder(section, false);

		async function onStatClick(event: Event) {
			const row = (event.target as Element).closest<HTMLElement>(".tt-table-row");
			if (!row) return;

			const table = row.closest(".tt-table")!;
			const isCustom = table.classList.contains("custom-stats");
			if (isCustom) {
				row.remove();
				await saveStats();
				buildOthers(true);
			} else {
				const otherTable = table.previousElementSibling!.querySelector(".tt-table-body")!;

				otherTable.appendChild(row);
				await saveStats();
			}
		}

		function saveStats() {
			const stats = findAllElements(".custom-stats .tt-table-row", section).map((row) => row.children[0]!.textContent!);

			return ttStorage.change({ filters: { profile: { stats } } });
		}

		function createStatsTable(id: string, rows: StatRow[], hidden = false, hasHeaders = false) {
			const cellRendererSelector = (row: StatRow) => {
				switch (row.format) {
					case "currency":
						return currencyCellRenderer;
					default:
						return numberCellRenderer;
				}
			};
			return createTable<StatRow>(
				[
					{ id: "stat", title: "Stat", width: 140, cellRenderer: stringCellRenderer },
					{ id: "them", title: "Them", class: "their-stat", width: 80, cellRendererSelector },
					{ id: "you", title: "You", class: "your-stat", width: 80, cellRendererSelector },
				],
				rows,
				{
					tableClass: `${id} ${hidden ? "tt-hidden" : ""}`,
					rowClass: (rowData) => {
						if (rowData.them === "N/A" || rowData.you?.value === "N/A" || rowData.them === rowData.you?.value) return "";

						return rowData.them > rowData.you?.value ? "superior-them" : "superior-you";
					},
					stretchColumns: true,
					rowGroupInfo: hasHeaders
						? {
								groupBy: "type",
								cellRenderer: stringCellRenderer,
							}
						: undefined,
				},
			);
		}

		function buildCustom() {
			const stats = filters.profile.stats;

			const rows: StatRow[] = stats
				.map((name): StatRow | false => {
					const stat = STATS.find((_stat) => _stat.name === name);
					if (!stat) return false;

					let them: number, you: number;
					if ("v2Getter" in stat) {
						them = stat.v2Getter(data);
						you = stat.v2Getter(userdata);
					} else {
						them = stat.targetGetter(data);
						you = stat.playerGetter(userdata);
					}

					if (Number.isNaN(them) || Number.isNaN(you)) return false;

					return {
						stat: stat.name,
						them: them,
						you: { value: you, relative: you - them },
						format: stat.format,
					};
				})
				.filter((value): value is StatRow => !!value);

			const table = createStatsTable("custom-stats", rows, false, false);
			section.appendChild(table.element);
		}

		function buildOthers(requireCleanup?: boolean) {
			const stats = filters.profile.stats;

			const _stats: StatRow[] = STATS.filter((stat) => !stats.includes(stat.name))
				.map((stat): StatRow | false => {
					let them: number, you: number;
					if ("v2Getter" in stat) {
						them = stat.v2Getter(data);
						you = stat.v2Getter(userdata);
					} else {
						them = stat.targetGetter(data);
						you = stat.playerGetter(userdata);
					}

					if (Number.isNaN(them) || Number.isNaN(you)) return false;

					return {
						stat: stat.name,
						them: them,
						you: { value: you, relative: you - them },
						type: stat.type,
						format: stat.format,
					};
				})
				.filter((value): value is StatRow => !!value);
			const table = createStatsTable("other-stats", _stats, true, true);

			if (requireCleanup) {
				section.querySelector(".other-stats")?.remove();

				if (overlayStatus) {
					table.element.classList.add("tt-overlay-item");
					findAllElements(".tt-table-row:not(.tt-table-row-header)", table.element).forEach((row) => row.removeEventListener("click", onStatClick));
				}

				const actions = section.querySelector(".stat-actions")!;
				actions.parentElement!.insertBefore(table.element, actions);
			} else {
				section.appendChild(table.element);
			}
		}
	}

	async function buildSpy(ignoreCache: boolean) {
		if (!settings.pages.profile.boxSpy || !settings.apiUsage.user.battlestats) return;

		const section = elementBuilder({ type: "div", class: "section spy-information" });
		content.appendChild(section);

		showLoadingPlaceholder(section, true);

		const { result: spy, isCached, errors } = await performSpy(id, ignoreCache);

		showLoadingPlaceholder(section as HTMLElement, false);

		if (spy) {
			const table = createTable<StatRow>(
				[
					{ id: "stat", title: "Stat", width: 60, cellRenderer: stringCellRenderer },
					{ id: "them", title: "Them", class: "their-stat", width: 80, cellRenderer: numberCellRenderer },
					{ id: "you", title: "You", class: "your-stat", width: 80, cellRenderer: numberCellRenderer },
				],
				[
					{
						stat: "Strength",
						them: spy.strength,
						you: { value: userdata.battlestats.strength.value, relative: getRelative(spy.strength, userdata.battlestats.strength.value) },
					},
					{
						stat: "Defense",
						them: spy.defense,
						you: { value: userdata.battlestats.defense.value, relative: getRelative(spy.defense, userdata.battlestats.defense.value) },
					},
					{
						stat: "Speed",
						them: spy.speed,
						you: { value: userdata.battlestats.speed.value, relative: getRelative(spy.speed, userdata.battlestats.speed.value) },
					},
					{
						stat: "Dexterity",
						them: spy.dexterity,
						you: { value: userdata.battlestats.dexterity.value, relative: getRelative(spy.dexterity, userdata.battlestats.dexterity.value) },
					},
					{
						stat: "Total",
						them: spy.total,
						you: { value: userdata.battlestats.total, relative: getRelative(spy.total, userdata.battlestats.total) },
					},
				],
				{
					rowClass: (rowData) => {
						if (rowData.them === "N/A" || rowData.you.value === "N/A") return "";

						return rowData.them > rowData.you.value ? "superior-them" : "superior-you";
					},
					stretchColumns: true,
				},
			);
			section.appendChild(table.element);

			let sourceText: string | undefined;
			if (spy.source) {
				if (isCached) sourceText = "Cached Source: ";
				else sourceText = "Source: ";

				sourceText += spy.source;
				if (spy.type) sourceText += `(${spy.type})`;
				sourceText += `, ${spy.updated}`;
			}

			const footer = elementBuilder({ type: "div", class: "spy-footer" });

			if (sourceText) footer.appendChild(elementBuilder({ type: "p", class: "spy-source", html: sourceText }));
			footer.appendChild(
				elementBuilder({
					type: "div",
					children: [PHBoldArrowClockwise()],
					events: {
						click: () => {
							section.remove();
							buildSpy(true);
						},
					},
				}),
			);

			section.appendChild(footer);
		} else {
			const footer = elementBuilder({ type: "div", class: "spy-footer" });

			footer.appendChild(elementBuilder({ type: "span", class: "no-spy", text: "There is no spy report." }));
			footer.appendChild(
				elementBuilder({
					type: "div",
					children: [PHBoldArrowClockwise()],
					events: {
						click: () => {
							section.remove();
							buildSpy(true);
						},
					},
				}),
			);
			section.appendChild(footer);
			if (errors.length) {
				section.appendChild(
					elementBuilder({
						type: "p",
						class: "no-spy-errors",
						html: errors.map(({ service, message }) => `${service} - ${message}`).join("<br>"),
					}),
				);
			}
		}

		function getRelative(them: StatValue, your: StatValue) {
			return them === "N/A" || your === "N/A" ? "N/A" : your - them;
		}
	}

	async function buildStakeouts() {
		if (!settings.pages.profile.boxStakeout) return;

		const existingStakeout = stakeouts.list.find((e) => e.id === id);

		const checkbox = createCheckbox({ description: "Stakeout this user." });
		checkbox.setChecked(!!existingStakeout);
		checkbox.onChange(() => {
			if (checkbox.isChecked()) {
				stakeouts.list.push({
					id,
					order: Date.now(),
					info: readStakeoutDataFromProfilePage(),
					alerts: { okay: false, hospital: false, flying: false, landing: false, online: false, life: false, offline: false, revivable: false },
					label: "",
				});
				ttStorage.set({ stakeouts });

				alerts.classList.remove("tt-hidden");
			} else {
				stakeouts.list = stakeouts.list.filter((e) => e.id !== id);
				ttStorage.set({ stakeouts });

				alerts.classList.add("tt-hidden");
				findAllElements<HTMLInputElement>("input[type='text'], input[type='number']", content).forEach((input) => (input.value = ""));
				findAllElements<HTMLInputElement>("input[type='checkbox']", content).forEach((input) => (input.checked = false));
			}
		});

		const labelElement = createTextbox({ description: "label:", style: { width: "100px" } });
		labelElement.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.label = labelElement.getValue();
			ttStorage.set({ stakeouts });
		});

		const isOkay = createCheckbox({ description: "is okay" });
		isOkay.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.okay = isOkay.isChecked();
			ttStorage.set({ stakeouts });
		});

		const isInHospital = createCheckbox({ description: "is in hospital" });
		isInHospital.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.hospital = isInHospital.isChecked();
			ttStorage.set({ stakeouts });
		});

		const flying = createCheckbox({ description: "is flying" });
		flying.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.flying = flying.isChecked();
			ttStorage.set({ stakeouts });
		});

		const lands = createCheckbox({ description: "lands" });
		lands.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.landing = lands.isChecked();
			ttStorage.set({ stakeouts });
		});

		const comesOnline = createCheckbox({ description: "comes online" });
		comesOnline.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.online = comesOnline.isChecked();
			ttStorage.set({ stakeouts });
		});

		const lifeDrops = createTextbox({ description: { before: "life drops below", after: "%" }, type: "number", attributes: { min: "1", max: "100" } });
		lifeDrops.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.life = parseInt(lifeDrops.getValue()) || false;
			ttStorage.set({ stakeouts });
		});

		const offlineFor = createTextbox({ description: { before: "offline for over", after: "hours" }, type: "number", attributes: { min: "1" } });
		offlineFor.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.offline = parseInt(offlineFor.getValue()) || false;
			ttStorage.set({ stakeouts });
		});

		const isRevivable = createCheckbox({ description: "is revivable" });
		isRevivable.onChange(() => {
			const entry = stakeouts.list.find((e) => e.id === id);
			if (!entry) return;

			entry.alerts.revivable = isRevivable.isChecked();
			ttStorage.set({ stakeouts });
		});

		const alerts = elementBuilder({
			type: "div",
			class: "alerts",
			children: [
				labelElement.element,
				isOkay.element,
				isInHospital.element,
				flying.element,
				lands.element,
				comesOnline.element,
				lifeDrops.element,
				offlineFor.element,
				isRevivable.element,
			],
		});

		if (existingStakeout) {
			labelElement.setValue(existingStakeout.label ?? "");
			isOkay.setChecked(existingStakeout.alerts.okay);
			isInHospital.setChecked(existingStakeout.alerts.hospital);
			flying.setChecked(existingStakeout.alerts.flying);
			lands.setChecked(existingStakeout.alerts.landing);
			comesOnline.setChecked(existingStakeout.alerts.online);
			lifeDrops.setValue(existingStakeout.alerts.life === false ? "" : String(existingStakeout.alerts.life));
			offlineFor.setValue(existingStakeout.alerts.offline === false ? "" : String(existingStakeout.alerts.offline));
			isRevivable.setChecked(existingStakeout.alerts.revivable);
		} else {
			alerts.classList.add("tt-hidden");
		}

		content.appendChild(elementBuilder({ type: "div", class: "section stakeout", children: [checkbox.element, alerts] }));
	}

	async function buildAttackHistory() {
		if (!settings.pages.profile.boxAttackHistory || !settings.pages.global.keepAttackHistory) return;

		const section = elementBuilder({ type: "div", class: "section attack-history" });

		if (id in attackHistory.history) {
			const history = attackHistory.history[id]!;

			function respectCellRenderer(respectArray: number[]) {
				let respect: string | number = respectArray.length ? respectArray.reduce((a, b) => a + b, 0) / respectArray.length : 0;
				if (respect > 0) respect = formatNumber(respect, { decimals: 2 });
				else respect = "-";

				return {
					element: document.createTextNode(respect.toString()),
					dispose: () => {},
				};
			}

			function ffCellRenderer(modifier: number) {
				let ff: string;
				if (modifier > 0) ff = formatNumber(modifier, { decimals: 2 });
				else ff = "-";

				return {
					element: document.createTextNode(ff),
					dispose: () => {},
				};
			}

			const table = createTable(
				[
					{ id: "win", title: "Wins", class: "positive", width: 40, cellRenderer: stringCellRenderer },
					{ id: "defend", title: "Defends", class: "positive last-cell", width: 60, cellRenderer: stringCellRenderer },
					{ id: "lose", title: "Lost", class: "negative", width: 30, cellRenderer: stringCellRenderer },
					{ id: "defend_lost", title: "Defends lost", class: "negative", width: 80, cellRenderer: stringCellRenderer },
					{ id: "stalemate", title: "Stalemates", class: "negative", width: 70, cellRenderer: stringCellRenderer },
					{ id: "escapes", title: "Escapes", class: "negative last-cell", width: 60, cellRenderer: stringCellRenderer },
					{ id: "respect_base", title: "Respect", class: "neutral", width: 50, cellRenderer: respectCellRenderer },
					{ id: "latestFairFightModifier", title: "FF", class: "neutral", width: 50, cellRenderer: ffCellRenderer },
				],
				[history],
				{
					stretchColumns: true,
				},
			);

			section.appendChild(table.element);
		} else {
			section.appendChild(elementBuilder({ type: "span", class: "no-history", text: "There is no attack history." }));
		}

		content.appendChild(section);
	}
}

function removeBox() {
	removeContainer("User Information");
}

function readStakeoutDataFromProfilePage(): StakeoutData["info"] {
	let name: string;
	const nameElement = document.querySelector<HTMLElement>(".user.name[data-placeholder]");
	if (nameElement) name = nameElement.dataset.placeholder!;
	else name = "Unknown";

	let lastActionStatus: UserLastActionStatusEnum;
	if (document.querySelector("li[id*='icon2']")) lastActionStatus = "Offline";
	else if (document.querySelector("li[id*='icon62']")) lastActionStatus = "Idle";
	else if (document.querySelector("li[id*='icon1']")) lastActionStatus = "Online";
	else lastActionStatus = "Offline";

	const lastActionElement = extractInformationProfileInformationTable("Last action");
	const lastActionRelative = lastActionElement ? lastActionElement.textContent : "N/A";

	let lifeCurrent: number;
	let lifeMaximum: number;
	const lifeElement = extractInformationProfileInformationTable("Lie");
	if (lifeElement) {
		const lifeText = lifeElement.textContent.split(" / ");

		lifeCurrent = parseInt(lifeText[0]);
		lifeMaximum = parseInt(lifeText[1]);
	} else {
		lifeCurrent = 0;
		lifeMaximum = 100;
	}

	let statusState: UserStatusStateEnum | string;
	let statusColor: string;
	if (document.querySelector("li[id*='icon15']")) {
		statusState = "Hospital";
		statusColor = "red";
	} else if (document.querySelector("li[id*='icon16']")) {
		statusState = "Jail";
		statusColor = "red";
	} else if (document.querySelector("li[id*='icon71']")) {
		statusState = "Traveling";
		statusColor = "blue";
	} else if (document.querySelector("li[id*='icon77']")) {
		statusState = "Fallen";
		statusColor = "red";
	} else {
		statusState = "Okay";
		statusColor = "green";
	}

	const statusDescriptionElement = document.querySelector(".main-desc");
	const statusDescription = statusDescriptionElement ? statusDescriptionElement.textContent : "Unknown";

	return {
		name,
		last_action: {
			status: lastActionStatus,
			relative: lastActionRelative,
			timestamp: -1,
		},
		life: {
			current: lifeCurrent,
			maximum: lifeMaximum,
		},
		status: {
			state: statusState,
			color: statusColor,
			until: null,
			description: statusDescription,
		},
		isRevivable: false,
	};
}

function extractInformationProfileInformationTable(title: string): HTMLElement | null {
	const node = document.evaluate(
		`//li[.//div[@class='user-information-section']//span[text()='${title}']]//div[@class='user-info-value']/span`,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null,
	).singleNodeValue;

	return isHTMLElement(node) ? node : null;
}

export default class ProfileBoxFeature extends Feature {
	constructor() {
		super("Profile Box", "profile");
	}

	precondition(): boolean {
		return getPageStatus().access && !isOwnProfile();
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";
		return true;
	}

	isEnabled(): boolean {
		return (
			settings.pages.profile.box &&
			(settings.pages.profile.boxStats || settings.pages.profile.boxSpy || settings.pages.profile.boxStakeout || settings.pages.profile.boxAttackHistory)
		);
	}

	async execute() {
		await showBox();
	}

	cleanup() {
		removeBox();
	}

	storageKeys(): string[] {
		return [
			"settings.pages.profile.box",
			"settings.pages.profile.boxStats",
			"settings.pages.profile.boxSpy",
			"settings.pages.profile.boxStakeout",
			"settings.pages.profile.boxAttackHistory",
			"settings.pages.global.keepAttackHistory",
		];
	}
}
