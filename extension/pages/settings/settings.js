"use strict";

const initiatedPages = {};

(async () => {
	initializeInternalPage({ sortTables: true });
	await loadDatabase();
	await showPage(getSearchParameters().get("page") || "preferences");

	document.body.classList.add(getPageTheme());

	for (const navigation of document.findAll("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

const isIframe = window.self !== window.top; // https://stackoverflow.com/a/326076

// noinspection DuplicatedCode
async function showPage(name) {
	const params = new URL(location.href).searchParams;
	params.set("page", name);
	if (name !== "preferences") params.delete("section");
	window.history.replaceState("", "Title", `?${params.toString()}`);

	for (const active of document.findAll("header nav.on-page > ul > li.active")) active.classList.remove("active");
	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (const active of document.findAll("body > main:not(.tt-hidden)")) active.classList.add("tt-hidden");
	document.find(`#${name}`).classList.remove("tt-hidden");

	const setup = {
		changelog: setupChangelog,
		preferences: setupPreferences,
		api: setupAPIInfo,
		export: setupExport,
		about: setupAbout,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		try {
			await setup[name]();
			initiatedPages[name] = true;
		} catch (e) {
			console.error(`Error while loading ${name}.`, e);
		}
	}
}

async function setupChangelog() {
	const changelog = await (await fetch(chrome.runtime.getURL("changelog.json"))).json();
	const content = document.find("#changelog > section");

	changelog.forEach((entry, index, allEntries) => {
		if (typeof entry.date === "string") entry.date = new Date(entry.date);
		else if (typeof entry.date === "object") entry.date = false;

		const log = document.newElement({ type: "div", class: "version-log" });
		const heading = document.newElement({ type: "div", class: "title", text: getTitle() });
		const icon = document.newElement({ type: "i", class: "fas fa-chevron-down" });
		heading.appendChild(icon);
		log.appendChild(heading);

		// Closeable
		const closeable = document.newElement({ type: "div", class: "closable tt-hidden" });
		heading.addEventListener("click", () => {
			closeable.classList.toggle("tt-hidden");

			rotateElement(icon, 180);
		});

		const contributors = Object.values(entry.logs)
			.flat()
			.map((log) => log.contributor)
			.filter((value, i, self) => !!value && self.indexOf(value) === i)
			.map((contributor) => {
				if (contributor in CONTRIBUTORS) {
					return {
						key: contributor,
						...CONTRIBUTORS[contributor],
					};
				} else {
					return {
						key: contributor,
						name: contributor,
					};
				}
			});

		const contributorsWrap = document.newElement({
			type: "div",
			class: "list contributors",
			children: [document.newElement({ type: "div", class: "subheader", text: "Contributors" })],
		});
		contributors.forEach((contributor) => {
			const child = document.newElement({
				type: "div",
				class: "contributor",
			});

			if (contributor.id)
				child.appendChild(
					document.newElement({
						type: "a",
						text: `${contributor.name} [${contributor.id}]`,
						href: `https://www.torn.com/profiles.php?XID=${contributor.id}`,
						attributes: { target: "_blank" },
					})
				);
			else child.appendChild(document.newElement({ type: "span", text: contributor.name }));

			if (contributor.color) child.style.setProperty("--contributor-color", contributor.color);

			contributorsWrap.appendChild(child);
		});
		closeable.appendChild(contributorsWrap);

		for (const title in entry.logs) {
			const parent = document.newElement({
				type: "div",
				class: "list",
				children: [document.newElement({ type: "div", class: "subheader", text: capitalizeText(title) })],
			});

			for (const log of entry.logs[title]) {
				const child = document.newElement({
					type: "div",
					class: "contributor",
					children: [document.newElement({ type: "span", text: log.message })],
				});

				const contributor = contributors.filter((x) => x.key === log.contributor);
				if (contributor.length) {
					if (contributor[0].color) child.style.setProperty("--contributor-color", contributor[0].color);
				}

				parent.appendChild(child);
			}

			closeable.appendChild(parent);
		}

		// Bottom border on last element
		if (index + 1 === allEntries.length) closeable.appendChild(document.newElement("hr"));
		if (index === 0) {
			closeable.classList.remove("tt-hidden");
			log.classList.add("current");
		}

		// Finish
		log.appendChild(closeable);
		content.appendChild(log);

		function getTitle() {
			const parts = [];

			parts.push(getVersion());
			if (entry.date) parts.push(`${MONTHS[entry.date.getMonth()]}, ${daySuffix(entry.date.getDate())} ${entry.date.getFullYear()}`);
			if (entry.title) parts.push(entry.title);

			return parts.join(" - ");

			function getVersion() {
				const parts = [];

				parts.push(`v${entry.version.major}`);
				parts.push(entry.version.minor);
				if (entry.version.build) parts.push(entry.version.build);

				return parts.join(".");
			}
		}
	});

	// Ending words
	content.appendChild(document.newElement({ type: "p", text: "The rest is history..", style: { textAlign: "center" } }));

	await ttStorage.change({ version: { showNotice: false } });
}

function cleanupPreferences() {
	const preferences = document.find("#preferences");

	preferences
		.findAll(
			[
				".hide-items > *",
				"#customLink > li:not(.input)",
				"#allyFactions > li:not(.input)",
				"#userAlias > li:not(.input)",
				"#chatHighlight > li:not(.input)",
				"#chatTitleHighlight> li:not(.input)",
			].join(", ")
		)
		.forEach((element) => element.remove());
}

async function setupPreferences(requireCleanup) {
	if (requireCleanup) cleanupPreferences();
	searchPreferences();

	const _preferences = document.find("#preferences");
	_preferences.addEventListener("click", addSaveDialog);

	if (getSearchParameters().has("section"))
		switchSection(_preferences.find(`#preferences > section > nav ul > li[name="${getSearchParameters().get("section")}"]`));

	for (const link of _preferences.findAll(":scope > section > nav ul > li[name]")) {
		link.addEventListener("click", () => switchSection(link));
	}

	_preferences.find("#addChatHighlight").addEventListener("click", () => {
		const inputRow = document.find("#chatHighlight .input");

		addChatHighlightRow(inputRow.find(".name").value, inputRow.find(".color").value);

		inputRow.find(".name").value = "";
		inputRow.find(".color").value = "#7ca900";
	});
	_preferences.find("#addChatTitleHighlight").addEventListener("click", () => {
		const inputRow = document.find("#chatTitleHighlight .input");

		addChatTitleHighlightRow(inputRow.find(".title").value, inputRow.find(".color").value);

		inputRow.find(".title").value = "";
		inputRow.find(".color").selectedIndex = 0;
	});
	_preferences.find("#chatTitleHighlight .input .color").innerHTML = getChatTitleColorOptions();

	_preferences.find("#saveSettingsTemporary").addEventListener("click", async () => {
		_preferences.find("#saveSettingsBar").classList.add("tt-hidden");
		await saveSettings();
	});
	_preferences.find("#saveSettings").addEventListener("click", async () => {
		_preferences.find("#saveSettingsBar").classList.add("tt-hidden");
		await saveSettings();
	});
	_preferences.find("#revertSettings").addEventListener("click", () => {
		_preferences.find("#saveSettingsBar").classList.add("tt-hidden");
		revertSettings();
	});
	_preferences.find("#resetSettings").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset settings",
			message: "<h3>Are you sure you want to delete ALL data except your API key?</h3>",
		})
			.then(async () => {
				await ttStorage.reset();

				chrome.runtime.sendMessage({ action: "initialize" }, () => {
					sendMessage("Settings reset.", true, { reload: true });
				});
			})
			.catch(() => {});
	});

	_preferences.find("#notification_type-global").addEventListener("click", (event) => {
		const disable = !event.target.checked;

		for (const notificationType in settings.notifications.types) {
			if (["global", "stocks", "npcs"].includes(notificationType)) continue;

			if (disable) _preferences.find(`#notification_type-${notificationType}`).setAttribute("disabled", true);
			else _preferences.find(`#notification_type-${notificationType}`).removeAttribute("disabled");
		}
	});
	_preferences.find("#notification-sound").addEventListener("change", (event) => {
		const value = event.target.value;

		if (value === "custom") {
			_preferences.find("#notification-sound-upload").classList.remove("tt-hidden");
		} else {
			_preferences.find("#notification-sound-upload").classList.add("tt-hidden");
		}

		if (value === "mute" || value === "default") {
			_preferences.find("#notification-volume").classList.add("tt-hidden");
			_preferences.find("#notification-sound-play").classList.add("tt-hidden");
			_preferences.find("#notification-sound-stop").classList.add("tt-hidden");
		} else {
			_preferences.find("#notification-volume").classList.remove("tt-hidden");
			_preferences.find("#notification-sound-play").classList.remove("tt-hidden");
			_preferences.find("#notification-sound-stop").classList.remove("tt-hidden");
		}
	});
	_preferences.find("#notification-sound-play").addEventListener("click", () => {
		chrome.runtime.sendMessage({
			action: "play-notification-sound",
			sound: _preferences.find("#notification-sound").value,
			volume: parseInt(_preferences.find("#notification-volume").value),
		});
	});
	_preferences.find("#notification-sound-stop").addEventListener("click", () => {
		chrome.runtime.sendMessage({ action: "stop-notification-sound" });
	});
	_preferences.find("#notification-sound-upload").addEventListener("change", (event) => {
		if (!event.target.files.length) return;

		const reader = new FileReader();
		reader.addEventListener("load", (event) => {
			if (event.target.result.length > 5242880) {
				return sendMessage("Maximum file size exceeded. (5MB)", false);
			}

			ttStorage.change({ settings: { notifications: { soundCustom: event.target.result } } });
		});
		reader.readAsDataURL(event.target.files[0]);
	});

	new Sortable(_preferences.find("#customLinks"), {
		draggable: "li:not(.input)",
		handle: ".move-icon-wrap",
		ghostClass: "dragging",
	});
	_preferences.find("#customLinks .input select.preset").innerHTML = getCustomLinkOptions();
	_preferences.find("#customLinks .input select.preset").value = "custom";
	_preferences.find("#customLinks .input select.preset").addEventListener("change", (event) => {
		const hrefInput = _preferences.find("#customLinks .input .href");
		const nameInput = _preferences.find("#customLinks .input .name");

		// noinspection DuplicatedCode
		if (event.target.value === "custom") {
			hrefInput.classList.remove("tt-hidden");
			hrefInput.value = "";
			nameInput.classList.remove("tt-hidden");
			nameInput.value = "";
		} else {
			hrefInput.classList.add("tt-hidden");
			nameInput.classList.add("tt-hidden");

			hrefInput.value = CUSTOM_LINKS_PRESET[event.target.value.replaceAll("_", " ")].link;
			nameInput.value = event.target.value.replaceAll("_", " ");
		}
	});
	_preferences.find("#customLinks .input select.location").innerHTML = getCustomLinkLocations();
	_preferences.find("#customLinks .input select.location").value = "above";
	_preferences.find("#addCustomLink").addEventListener("click", () => {
		const inputRow = document.find("#customLinks .input");

		addCustomLink({
			newTab: inputRow.find(".newTab").checked,
			preset: inputRow.find(".preset").value,
			location: inputRow.find(".location").value,
			name: inputRow.find(".name").value,
			href: inputRow.find(".href").value,
		});

		inputRow.find(".newTab").checked = false;
		inputRow.find(".preset").value = "custom";
		inputRow.find(".location").value = "above";
		inputRow.find(".name").value = "";
		inputRow.find(".name").classList.remove("tt-hidden");
		inputRow.find(".href").value = "";
		inputRow.find(".href").classList.remove("tt-hidden");
	});

	_preferences.find("#addAllyFaction").addEventListener("click", () => {
		const inputRow = document.find("#allyFactions .input");

		addAllyFaction(inputRow.find(".faction").value);
	});

	_preferences.find("#addUserAlias").addEventListener("click", () => {
		const inputRow = document.find("#userAlias li:last-child");

		addUserAlias(inputRow.find(".userID").value, inputRow.find(".name").value, inputRow.find(".alias").value);
	});

	const chatSection = _preferences.find(".sections section[name='chat']");
	for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
		chatSection.insertBefore(
			document.newElement({
				type: "div",
				class: "tabbed note",
				text: `${placeholder.name} - ${placeholder.description}`,
			}),
			chatSection.find("#chatHighlight+.note").nextElementSibling
		);
	}

	const hideAreasParent = _preferences.find("#hide-areas");
	for (const area of ALL_AREAS) {
		const areaWrap = document.newElement({ type: "span", text: area.text, attributes: { name: area.class } });

		hideAreasParent.appendChild(areaWrap);
		if (ALL_AREAS.indexOf(area) + 1 !== ALL_AREAS.length) hideAreasParent.appendChild(document.createTextNode("\n"));

		areaWrap.addEventListener("click", () => areaWrap.classList.toggle("disabled"));
	}

	const hideIconsParent = _preferences.find("#hide-icons");
	for (const { icon, id, description } of ALL_ICONS) {
		const iconsWrap = document.newElement({
			type: "div",
			class: "icon",
			children: [document.newElement({ type: "div", class: icon, style: { backgroundPosition: `-${(id - 1) * 18}px 0` } })],
		});
		iconsWrap.classList.add("hover_tooltip");
		iconsWrap.appendChild(document.newElement({ type: "span", class: "hover_tooltip_text", text: description }));

		hideIconsParent.appendChild(iconsWrap);

		iconsWrap.addEventListener("click", () => {
			iconsWrap.classList.toggle("disabled");
		});
	}

	const hideCasinoGamesParent = _preferences.find("#hide-casino-games");
	for (const game of CASINO_GAMES) {
		const casinoGame = document.newElement({ type: "span", text: capitalizeText(game), attributes: { name: game } });

		hideCasinoGamesParent.appendChild(casinoGame);
		if (CASINO_GAMES.indexOf(game) + 1 !== CASINO_GAMES.length) hideCasinoGamesParent.appendChild(document.createTextNode("\n"));

		casinoGame.addEventListener("click", (event) => event.target.classList.toggle("disabled"));
	}

	const hideStocksParent = _preferences.find("#hide-stocks");
	if (hasAPIData() && stockdata) {
		for (const stock in stockdata) {
			// noinspection JSCheckFunctionSignatures
			if (isNaN(stock)) continue;

			const stockName = stockdata[stock].name;
			hideStocksParent.appendChild(
				document.newElement({
					type: "span",
					id: stock,
					text: capitalizeText(stockName),
				})
			);
		}
		hideStocksParent.addEventListener("click", (event) => {
			if (!isNaN(event.target.getAttribute("id"))) event.target.classList.toggle("disabled");
		});
	} else {
		hideStocksParent.classList.add("warning");
		hideStocksParent.appendChild(document.createTextNode("Requires API data to be loaded."));
	}

	if (hasAPIData() && npcs.targets) {
		const alerts = _preferences.find("#npc-alerts");

		for (const [id, npc] of Object.entries(npcs.targets)) {
			alerts.appendChild(
				document.newElement({
					type: "li",
					children: [
						document.newElement({ type: "input", value: npc.name, attributes: { disabled: "" } }),
						document.newElement({
							type: "input",
							class: "level",
							// value: notification.level,
							attributes: { placeholder: "Level", type: "number", min: 1, max: 5 },
							events: { input: enforceInputLimits },
						}),
						document.newElement({
							type: "input",
							class: "minutes",
							// value: notification.minutes,
							attributes: { placeholder: "Minutes", type: "number", min: 0, max: 450 },
							events: { input: enforceInputLimits },
						}),
					],
					dataset: { id },
				})
			);
		}
	}

	const hideAttackOptionsParent = _preferences.find("#hide-attack-options");
	["leave", "mug", "hospitalize"].forEach((option) => {
		const optionNode = document.newElement({ type: "span", text: capitalizeText(option), attributes: { value: option } });
		hideAttackOptionsParent.appendChild(optionNode);
		optionNode.addEventListener("click", (event) => event.target.classList.toggle("disabled"));
	});

	_preferences.find("#external-tornstats").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.tornstats, event));
	_preferences.find("#external-yata").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.yata, event));

	_preferences.find("#global-reviveProvider").addEventListener("change", (event) => {
		const provider = event.target.value;
		if (!provider) return;

		let origin;
		if (provider === "nuke") origin = FETCH_PLATFORMS.nukefamily;
		else if (provider === "uhc") origin = FETCH_PLATFORMS.uhc;
		else if (provider === "imperium") origin = FETCH_PLATFORMS.imperium;
		else if (provider === "hela") origin = FETCH_PLATFORMS.hela;

		if (!origin) return;

		if (!chrome.permissions) {
			event.target.value = settings.pages.global.reviveProvider;
			warnMissingPermissionAPI();
			return;
		}

		chrome.permissions.request({ origins: [origin] }, (granted) => {
			if (!granted) {
				sendMessage("Can't select this provider without accepting the permission.", false);
				event.target.value = settings.pages.global.reviveProvider;
			}
		});
	});

	fillSettings();
	requestPermissions();
	storageListeners.settings.push(updateSettings);
	if (isIframe) {
		window.addEventListener("message", async (event) => {
			if (event.data !== null && typeof event.data === "object" && event.data.torntools) {
				if (event.data.save) await saveSettings();
				else if (event.data.revert) revertSettings();
			}
		});
	}

	function switchSection(link) {
		const params = new URL(location.href).searchParams;
		params.set("page", "preferences");
		params.set("section", link.getAttribute("name"));
		window.history.replaceState("", "Title", `?${params.toString()}`);

		_preferences.find(":scope > section > nav ul li[name].active").classList.remove("active");
		_preferences.find(":scope > section > .sections > section.active").classList.remove("active");

		link.classList.add("active");
		_preferences.find(`:scope > section > .sections > section[name="${link.getAttribute("name")}"]`).classList.add("active");

		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function fillSettings() {
		for (const setting of ["updateNotice", "featureDisplay", "featureDisplayOnlyFailed", "featureDisplayHideDisabled"]) {
			const checkbox = _preferences.find(`#${setting}`);
			if (!checkbox) continue;

			checkbox.checked = settings[setting];
		}

		_preferences.find("#formatting-tct").checked = settings.formatting.tct;
		_preferences.find(`input[name="formatDate"][value="${settings.formatting.date}"]`).checked = true;
		_preferences.find(`input[name="formatTime"][value="${settings.formatting.time}"]`).checked = true;
		_preferences.find(`input[name="themePage"][value="${settings.themes.pages}"]`).checked = true;
		_preferences.find(`input[name="themeContainers"][value="${settings.themes.containers}"]`).checked = true;

		for (const service of ["tornstats", "yata"]) {
			_preferences.find(`#external-${service}`).checked = settings.external[service];
		}

		_preferences.find("#csvDelimiter").value = settings.csvDelimiter;

		for (const type of ["pages", "scripts"]) {
			for (const page in settings[type]) {
				const isGlobalDisabled = settings[type][page].global === false;

				for (const setting in settings[type][page]) {
					const input = _preferences.find(`#${page}-${setting}, input[name="${setting}"][value="${settings[type][page][setting]}"]`);
					if (!input) continue;

					if (setting === "global") {
						input.addEventListener("change", (event) => {
							const isGlobalDisabled = !event.target.checked;

							for (const setting in settings[type][page]) {
								if (setting === "global") continue;

								const input = _preferences.find(`#${page}-${setting}`);
								if (!input) continue;

								if (isGlobalDisabled) input.setAttribute("disabled", true);
								else input.removeAttribute("disabled");
							}
						});
					} else if (isGlobalDisabled) input.setAttribute("disabled", true);
					else input.removeAttribute("disabled");

					const value = settings[type][page][setting];
					if (input.tagName === "INPUT") {
						const inputType = input.getAttribute("type");

						if (inputType === "checkbox") input.checked = value;
						else if (inputType === "radio") input.checked = true;
						else input.value = value;
					} else if (input.tagName === "SELECT") {
						input.value = value;
					}
				}
			}
		}

		_preferences.find("#api_usage-comment").value = settings.apiUsage.comment;
		_preferences.find("#api_usage-essential").value = settings.apiUsage.delayEssential;
		_preferences.find("#api_usage-basic").value = settings.apiUsage.delayBasic;
		_preferences.find("#api_usage-stakeouts").value = settings.apiUsage.delayStakeouts;
		for (const type of ["user"]) {
			for (const selection in settings.apiUsage[type]) {
				_preferences.find(`#api_usage-${type}_${selection}`).checked = settings.apiUsage[type][selection];
			}
		}

		if (api.tornstats.key) _preferences.find("#external-tornstats-key").value = api.tornstats.key;
		if (api.yata.key) _preferences.find("#external-yata-key").value = api.yata.key;

		for (const highlight of settings.pages.chat.highlights) {
			addChatHighlightRow(highlight.name, highlight.color);
		}
		for (const highlight of settings.pages.chat.titleHighlights) {
			addChatTitleHighlightRow(highlight.title, highlight.color);
		}

		const notificationsDisabled = !settings.notifications.types.global;
		for (const notificationType in settings.notifications.types) {
			if (notificationType === "stocks") continue;
			let option;

			if (Array.isArray(settings.notifications.types[notificationType])) {
				option = _preferences.find(`#notification_type-${notificationType}[type="text"]`);
				if (!option) continue;
				option.value = settings.notifications.types[notificationType].join(",");
			} else {
				option = _preferences.find(`#notification_type-${notificationType}`);
				if (!option) continue;
				option.checked = settings.notifications.types[notificationType];
			}

			if (notificationsDisabled && notificationType !== "global") option.setAttribute("disabled", true);
			else option.removeAttribute("disabled");
		}

		_preferences.find("#notification-sound").value = settings.notifications.sound;
		_preferences.find("#notification-tts").checked = settings.notifications.tts;
		_preferences.find("#notification-link").checked = settings.notifications.link;
		_preferences.find("#notification-requireInteraction").checked = settings.notifications.requireInteraction;
		_preferences.find("#notification-volume").value = settings.notifications.volume;
		if (settings.notifications.sound === "custom") {
			_preferences.find("#notification-sound-upload").classList.remove("tt-hidden");
		} else {
			if (settings.notifications.sound === "mute" || settings.notifications.sound === "default") {
				_preferences.find("#notification-volume").classList.add("tt-hidden");
				_preferences.find("#notification-sound-play").classList.add("tt-hidden");
				_preferences.find("#notification-sound-stop").classList.add("tt-hidden");
			} else {
				_preferences.find("#notification-volume").classList.remove("tt-hidden");
				_preferences.find("#notification-sound-play").classList.remove("tt-hidden");
				_preferences.find("#notification-sound-stop").classList.remove("tt-hidden");
			}
		}

		for (const area of settings.hideAreas) {
			_preferences.find(`#hide-areas span[name="${area}"]`).classList.add("disabled");
		}
		for (const icon of settings.hideIcons) {
			_preferences.find(`#hide-icons .${icon}`).parentElement.classList.add("disabled");
		}
		for (const game of settings.hideCasinoGames) {
			_preferences.find(`#hide-casino-games span[name="${game}"]`).classList.add("disabled");
		}
		for (const stockName of settings.hideStocks) {
			_preferences.find(`#hide-stocks span[id="${stockName}"]`).classList.add("disabled");
		}
		for (const link of settings.customLinks) {
			addCustomLink(link);
		}
		settings.employeeInactivityWarning.forEach((warning, index) => {
			const row = _preferences.find(`#employeeInactivityWarning .tabbed:nth-child(${index + 2})`);

			row.find("input[type='number']").value = !isNaN(warning.days) ? warning.days : "";
			row.find("input[type='color']").value = warning.color;
		});
		settings.factionInactivityWarning.forEach((warning, index) => {
			const row = _preferences.find(`#factionInactivityWarning .tabbed:nth-child(${index + 2})`);

			row.find("input[type='number']").value = !isNaN(warning.days) ? warning.days : "";
			row.find("input[type='color']").value = warning.color;
		});
		settings.alliedFactions.forEach((ally) => addAllyFaction(ally));
		for (const userID in settings.userAlias) {
			addUserAlias(userID, settings.userAlias[userID].name, settings.userAlias[userID].alias);
		}
		for (const { id, level, minutes } of settings.notifications.types.npcs) {
			const row = _preferences.find(`#npc-alerts > li[data-id='${id}']`);
			if (!row) continue;

			row.find(".level").value = level;
			row.find(".minutes").value = minutes;
		}
		for (const option of settings.pages.attack.hideAttackButtons) {
			hideAttackOptionsParent.find(`[value*="${option}"]`).classList.add("disabled");
		}
	}

	function updateSettings() {
		updateGlobalNotifications();

		function updateGlobalNotifications() {
			if (!settings) return;

			const isGlobalDisabled = settings.notifications.types.global === false;

			for (const type in settings.notifications.types) {
				if (type === "stocks") continue;
				const option = _preferences.find(`#notification_type-${type}`);
				if (!option) continue;

				if (type === "global") {
					option.checked = !isGlobalDisabled;
				} else {
					if (isGlobalDisabled) option.setAttribute("disabled", true);
					else option.removeAttribute("disabled");
				}
			}
		}
	}

	function addChatHighlightRow(name, color) {
		const deleteIcon = document.newElement({
			type: "button",
			class: "remove-icon-wrap",
			children: [document.newElement({ type: "i", class: "remove-icon fas fa-trash-alt" })],
		});
		const newRow = document.newElement({
			type: "li",
			children: [
				document.newElement({ type: "input", class: "name", value: name, attributes: { type: "text", placeholder: "Name.." } }),
				document.newElement({ type: "input", class: "color", value: color, attributes: { type: "color" } }),
				deleteIcon,
			],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#chatHighlight").insertBefore(newRow, _preferences.find("#chatHighlight .input"));
	}

	function addChatTitleHighlightRow(title, color) {
		const deleteIcon = document.newElement({
			type: "button",
			class: "remove-icon-wrap",
			children: [document.newElement({ type: "i", class: "remove-icon fas fa-trash-alt" })],
		});
		const newRow = document.newElement({
			type: "li",
			children: [
				document.newElement({ type: "input", class: "title", value: title, attributes: { type: "text", placeholder: "Title.." } }),
				document.newElement({
					type: "select",
					class: "color",
					value: color,
					attributes: { type: "color" },
					html: getChatTitleColorOptions(),
				}),
				deleteIcon,
			],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#chatTitleHighlight").insertBefore(newRow, _preferences.find("#chatTitleHighlight .input"));
	}

	function getChatTitleColorOptions() {
		const options = [];

		for (const color in CHAT_TITLE_COLORS) {
			options.push(`<option value="${color}">${capitalizeText(color, { everyWord: true })}</option>`);
		}

		return options.join("");
	}

	function addCustomLink(data) {
		const newRow = document.newElement({
			type: "li",
			children: [
				document.newElement({
					type: "input",
					class: "newTab",
					attributes: {
						type: "checkbox",
						...(data.newTab
							? {
									checked: true,
							  }
							: {}),
					},
				}),
				document.newElement({
					type: "select",
					class: "preset",
					value: data.preset,
					html: getCustomLinkOptions(),
					events: {
						change: (event) => {
							const hrefInput = newRow.find(".href");
							const nameInput = newRow.find(".name");

							// noinspection DuplicatedCode
							if (event.target.value === "custom") {
								hrefInput.classList.remove("tt-hidden");
								nameInput.classList.remove("tt-hidden");
							} else {
								hrefInput.classList.add("tt-hidden");
								nameInput.classList.add("tt-hidden");

								hrefInput.value = CUSTOM_LINKS_PRESET[event.target.value.replaceAll("_", " ")].link;
								nameInput.value = event.target.value.replaceAll("_", " ");
							}
						},
					},
				}),
				document.newElement({
					type: "select",
					class: "location",
					value: data.location,
					html: getCustomLinkLocations(),
				}),
				document.newElement({
					type: "input",
					class: `name ${data.preset === "custom" ? "" : "tt-hidden"}`,
					value: data.name,
					attributes: { type: "text", placeholder: "Name.." },
				}),
				document.newElement({
					type: "input",
					class: `href ${data.preset === "custom" ? "" : "tt-hidden"}`,
					value: data.href,
					attributes: { type: "text", placeholder: "Name.." },
				}),
				document.newElement({
					type: "button",
					class: "remove-icon-wrap",
					children: [document.newElement({ type: "i", class: "remove-icon fas fa-trash-alt" })],
					events: {
						click: () => newRow.remove(),
					},
				}),
				document.newElement({
					type: "div",
					class: "move-icon-wrap",
					children: [document.newElement({ type: "i", class: "move-icon fas fa-bars" })],
				}),
			],
		});

		_preferences.find("#customLinks").insertBefore(newRow, _preferences.find("#customLinks .input"));
	}

	function addAllyFaction(ally) {
		const deleteIcon = document.newElement({
			type: "button",
			class: "remove-icon-wrap",
			children: [document.newElement({ type: "i", class: "remove-icon fas fa-trash-alt" })],
		});
		const newRow = document.newElement({
			type: "li",
			children: [document.newElement({ type: "input", class: "faction", value: ally }), deleteIcon],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#allyFactions li:last-child").insertAdjacentElement("beforebegin", newRow);
		_preferences.find("#allyFactions li:last-child input").value = "";
	}

	function addUserAlias(userID, name, alias) {
		const deleteIcon = document.newElement({
			type: "button",
			class: "remove-icon-wrap",
			children: [document.newElement({ type: "i", class: "remove-icon fas fa-trash-alt" })],
		});
		const newRow = document.newElement({
			type: "li",
			children: [
				document.newElement({ type: "input", class: "userID", value: userID, attributes: { type: "text", placeholder: "User ID.." } }),
				document.newElement({ type: "input", class: "name", value: name, attributes: { type: "text", placeholder: "Name.." } }),
				document.newElement({ type: "input", class: "alias", value: alias, attributes: { type: "text", placeholder: "Alias.." } }),
				deleteIcon,
			],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#userAlias li:last-child").insertAdjacentElement("beforebegin", newRow);
		_preferences.findAll("#userAlias li:last-child input").forEach((x) => (x.value = ""));
	}

	function getCustomLinkOptions() {
		let options = "<option value='custom'>Custom..</option>";
		for (const name in CUSTOM_LINKS_PRESET) options += `<option value="${name}">${name}</option>`;

		return options;
	}

	function getCustomLinkLocations() {
		let options = `
			<option value="above">Above all the areas</option>
			<option value="under">Under all the areas</option>
		`;

		for (const area of ALL_AREAS) {
			options += `
				<option value="above_${area.class}">
					Above ${area.text}
				</option>
				<option value="under_${area.class}">
					Under ${area.text}
				</option>
			`;
		}

		return options;
	}

	async function saveSettings() {
		for (const setting of ["updateNotice", "featureDisplay", "featureDisplayOnlyFailed", "featureDisplayHideDisabled"]) {
			const checkbox = _preferences.find(`#${setting}`);
			if (!checkbox) continue;

			settings[setting] = checkbox.checked;
		}

		settings.formatting.tct = _preferences.find("#formatting-tct").checked;
		settings.formatting.date = _preferences.find("input[name='formatDate']:checked").value;
		settings.formatting.time = _preferences.find("input[name='formatTime']:checked").value;
		settings.themes.pages = _preferences.find("input[name='themePage']:checked").value;
		settings.themes.containers = _preferences.find("input[name='themeContainers']:checked").value;

		settings.csvDelimiter = _preferences.find("#csvDelimiter").value;

		settings.external.tornstats = _preferences.find("#external-tornstats").checked;
		settings.external.yata = _preferences.find("#external-yata").checked;

		for (const type of ["pages", "scripts"]) {
			for (const page in settings[type]) {
				for (const setting in settings[type][page]) {
					const input = _preferences.find(`#${page}-${setting}, input[name="${setting}"]:checked`);
					if (!input) continue;

					if (input.tagName === "INPUT") {
						switch (input.getAttribute("type")) {
							case "number":
								settings[type][page][setting] =
									!isNaN(input.value) && input.value !== ""
										? parseInt(input.value)
										: input.hasAttribute("save-empty") && input.value === ""
										? ""
										: input.hasAttribute("min")
										? input.getAttribute("min")
										: 0;
								break;
							case "checkbox":
								settings[type][page][setting] = input.checked;
								break;
							default:
								settings[type][page][setting] = input.value;
								break;
						}
					} else if (input.tagName === "SELECT") {
						settings[type][page][setting] = input.value;
					}
				}
			}
		}

		settings.customLinks = [..._preferences.findAll("#customLinks > li:not(.input)")].map((link) => {
			return {
				newTab: link.find(".newTab").checked,
				preset: link.find(".preset").value,
				location: link.find(".location").value,
				name: link.find(".name").value,
				href: link.find(".href").value,
			};
		});
		settings.pages.chat.highlights = [..._preferences.findAll("#chatHighlight > li:not(.input)")].map((highlight) => {
			return {
				name: highlight.find(".name").value,
				color: highlight.find(".color").value,
			};
		});
		settings.pages.chat.titleHighlights = [..._preferences.findAll("#chatTitleHighlight > li:not(.input)")].map((highlight) => {
			return {
				title: highlight.find(".title").value,
				color: highlight.find(".color").value,
			};
		});
		settings.alliedFactions = [..._preferences.findAll("#allyFactions input")]
			.map((input) => {
				if (isNaN(input.value)) return input.value.trim();
				else return parseInt(input.value.trim());
			})
			.filter((x) => {
				if (typeof x === "string") return x.trim() !== "";
				else return x;
			});
		settings.userAlias = {};
		for (const aliasRow of _preferences.findAll("#userAlias > li")) {
			if (aliasRow.find(".userID").value) {
				settings.userAlias[aliasRow.find(".userID").value] = { name: aliasRow.find(".name").value, alias: aliasRow.find(".alias").value };
			}
		}

		settings.hideAreas = [..._preferences.findAll("#hide-areas span.disabled")].map((area) => area.getAttribute("name"));
		settings.hideIcons = [..._preferences.findAll("#hide-icons .icon.disabled > div")].map((icon) => icon.getAttribute("class"));
		settings.hideCasinoGames = [..._preferences.findAll("#hide-casino-games span.disabled")].map((game) => game.getAttribute("name"));
		settings.hideStocks = [..._preferences.findAll("#hide-stocks span.disabled")].map((stock) => stock.getAttribute("id"));
		settings.employeeInactivityWarning = [..._preferences.findAll("#employeeInactivityWarning > .tabbed")]
			.map((warning) => {
				const days = warning.find("input[type='number']").value;

				return {
					color: warning.find("input[type='color']").value,
					days: !isNaN(days) && days !== "" ? parseInt(days) : false,
				};
			})
			.sort((first, second) => first.days - second.days);
		settings.factionInactivityWarning = [..._preferences.findAll("#factionInactivityWarning > .tabbed")]
			.map((warning) => {
				const days = warning.find("input[type='number']").value;

				return {
					color: warning.find("input[type='color']").value,
					days: !isNaN(days) && days !== "" ? parseInt(days) : false,
				};
			})
			.sort((first, second) => first.days - second.days);
		settings.pages.attack.hideAttackButtons = [..._preferences.findAll("#hide-attack-options span.disabled")].map((x) => x.getAttribute("value"));

		settings.apiUsage.comment = _preferences.find("#api_usage-comment").value;
		settings.apiUsage.delayEssential = parseInt(_preferences.find("#api_usage-essential").value);
		settings.apiUsage.delayBasic = parseInt(_preferences.find("#api_usage-basic").value);
		settings.apiUsage.delayStakeouts = parseInt(_preferences.find("#api_usage-stakeouts").value);
		for (const type of ["user"]) {
			for (const selection in settings.apiUsage[type]) {
				settings.apiUsage[type][selection] = _preferences.find(`#api_usage-${type}_${selection}`).checked;
			}
		}

		for (const notificationType in settings.notifications.types) {
			if (notificationType === "stocks" || notificationType === "npcs") continue;

			if (Array.isArray(settings.notifications.types[notificationType])) {
				settings.notifications.types[notificationType] = _preferences
					.find(`#notification_type-${notificationType}[type="text"]`)
					.value.split(",")
					.filter((x) => x)
					.map((x) => (!isNaN(x) ? parseFloat(x) : x));
			} else {
				settings.notifications.types[notificationType] = _preferences.find(`#notification_type-${notificationType}`).checked;
			}
		}
		settings.notifications.types.npcs = [..._preferences.findAll("#npc-alerts > li")]
			.map((row) => {
				const level = row.find(".level").value;
				const minutes = row.find(".minutes").value;

				return {
					id: parseInt(row.dataset.id),
					level: !level || isNaN(level) ? "" : parseInt(level),
					minutes: !minutes || isNaN(minutes) ? "" : parseInt(minutes),
				};
			})
			.filter(({ level, minutes }) => level !== "" || minutes !== "");

		settings.notifications.tts = _preferences.find("#notification-tts").checked;
		settings.notifications.link = _preferences.find("#notification-link").checked;
		settings.notifications.requireInteraction = _preferences.find("#notification-requireInteraction").checked;
		settings.notifications.volume = parseInt(_preferences.find("#notification-volume").value);
		settings.notifications.sound = _preferences.find("#notification-sound").value;

		const newStorage = { settings };
		await ttStorage.set(newStorage);
		console.log("Settings updated!", newStorage);

		await ttStorage.change({
			api: {
				tornstats: { key: document.find("#external-tornstats-key").value },
				yata: { key: document.find("#external-yata-key").value },
			},
		});

		["dark", "light"].forEach((theme) => document.body.classList.remove(theme));
		document.body.classList.add(getPageTheme());

		sendMessage("Settings saved.", true);
	}

	function requestOrigin(origin, event) {
		if (!event.target.checked) return;

		if (!chrome.permissions) {
			event.target.checked = false;
			warnMissingPermissionAPI();
			return;
		}

		chrome.permissions.request({ origins: [origin] }, (granted) => {
			if (!granted) {
				sendMessage("Can't enable this without accepting the permission.", false);
				event.target.checked = false;
			}
		});
	}

	function searchPreferences() {
		const searchOverlay = document.find("#tt-search-overlay");
		document.find("#preferences-search").addEventListener("click", () => {
			searchOverlay.classList.remove("tt-hidden");
			search();
		});

		searchOverlay.find(".circle").addEventListener("click", () => {
			searchOverlay.find("#tt-search-list").innerHTML = "";
			searchOverlay.classList.add("tt-hidden");
		});
		const searchOverlayInput = searchOverlay.find("input");
		searchOverlay.find("#tt-search-button").addEventListener("click", search);
		searchOverlayInput.addEventListener("input", search);
		searchOverlayInput.addEventListener("keydown", (event) => {
			if (event.keyCode === 13) search();
		});

		const searchList = searchOverlay.find("#tt-search-list");

		function search() {
			const searchFor = searchOverlayInput.value.toLowerCase().trim();
			if (!searchFor) return;
			document.findAll(".searched").forEach((option) => option.classList.remove("searched"));
			let searchResults = document.evaluate(
				`//main[@id='preferences']
					//section
						//div[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sections')]
							//section
								//label[not(contains(@class, 'note'))][contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${searchFor}')]
				| 
				//main[@id='preferences']
					//section
						//div[contains(translate(@class, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'sections')]
							//section
								//div[contains(@class, 'header')][contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${searchFor}')]`,
				document,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
			searchList.innerHTML = "";
			// Sorry but there is no forEach method available. Had to use traditional loops.
			if (searchResults.snapshotLength > 0) {
				for (let i = 0; i < searchResults.snapshotLength; i++) {
					const option = searchResults.snapshotItem(i);
					const name = option.textContent.replace("New!", "").replace("\n", "").trim();

					let keyword, section;
					if (option.getAttribute("for")) {
						keyword = "for";
						section = option.getAttribute("for");
					} else if (option.classList.contains("header")) {
						keyword = "name";
						section = option.parentElement.getAttribute("name");
					}

					searchList.appendChild(
						document.newElement({
							type: "div",
							text: name,
							attributes: { [keyword]: section },
							children: [document.newElement("br")],
						})
					);
					searchList.appendChild(document.newElement("hr"));
				}
			} else {
				searchList.appendChild(
					document.newElement({
						type: "span",
						id: "no-result",
						text: "No Results",
					})
				);
			}
			searchResults = null;
		}

		searchList.addEventListener("click", (event) => {
			event.stopPropagation();
			searchOverlay.classList.add("tt-hidden");
			if (event.target.textContent.trim() !== "No Results") {
				const nameAttr = event.target.getAttribute("name");
				const forAttr = event.target.getAttribute("for");
				if (forAttr) {
					const optionFound = document.find(`#preferences [for="${forAttr}"]`);
					document.find(`#preferences nav [name="${optionFound.closest("section").getAttribute("name")}"]`).click();
					optionFound.parentElement.classList.add("searched");
				} else if (nameAttr) {
					for (const x of [...document.findAll(`#preferences [name="${nameAttr}"] .header`)]) {
						if (x.textContent.trim() === event.target.textContent.trim()) {
							x.classList.add("searched");
							document.find(`#preferences nav [name="${x.closest("section").getAttribute("name")}"]`).click();
							break;
						}
					}
				}
			}
			searchList.innerHTML = "";
		});
	}

	function enforceInputLimits(event) {
		const value = event.target.value || "";
		if (value === "") return;

		const newValue = Math.min(Math.max(event.target.value, parseInt(event.target.min)), parseInt(event.target.max));
		if (value === newValue) return;

		event.target.value = newValue;
	}

	function requestPermissions() {
		if (!chrome.permissions) return;

		const origins = [];

		for (const { id, origin } of [
			{ id: "external-tornstats", origin: FETCH_PLATFORMS.tornstats },
			{ id: "external-yata", origin: FETCH_PLATFORMS.yata },
		]) {
			if (!_preferences.find(`#${id}`)?.checked) continue;

			origins.push(origin);
		}

		const reviveProvider = _preferences.find("#global-reviveProvider").value;
		if (reviveProvider) {
			let origin;
			if (reviveProvider === "nuke") origin = FETCH_PLATFORMS.nukefamily;
			else if (reviveProvider === "uhc") origin = FETCH_PLATFORMS.uhc;
			else if (reviveProvider === "imperium") origin = FETCH_PLATFORMS.imperium;
			else if (reviveProvider === "hela") origin = FETCH_PLATFORMS.hela;

			if (origin) origins.push(origin);
		}

		chrome.permissions.contains({ origins }, (granted) => {
			if (granted) return;

			loadConfirmationPopup({
				title: "Permission Issue",
				message: "There are settings enabled that require permissions to be given, but those permissions are missing.",
			})
				.then(() => {})
				.catch(() => {})
				.then(() => {
					chrome.permissions.request({ origins }, (granted) => {
						if (granted) return;

						sendMessage("These permissions are essential.", false);
					});
				});
		});
	}

	function addSaveDialog(event) {
		if (
			["INPUT", "SELECT"].includes(event.target.tagName) ||
			event.target.closest("button.remove-icon-wrap, #hide-icons, #hide-areas, #hide-casino-games, #hide-stocks, #hide-attack-options")
		) {
			if (isIframe) window.top.postMessage({ torntools: 1, show: 1 }, "*");
			else document.find("#saveSettingsBar").classList.remove("tt-hidden");
		}
	}

	function revertSettings() {
		_preferences
			.findAll("#hide-areas .disabled, #hide-icons .disabled, #hide-casino-games .disabled, #hide-stocks .disabled")
			.forEach((x) => x.classList.remove("disabled"));
		_preferences.findAll("button.remove-icon-wrap").forEach((x) => x.closest("li").remove());
		fillSettings();
	}

	function warnMissingPermissionAPI() {
		loadConfirmationPopup({
			title: "Couldn't request permissions",
			message: `
				<p>
					There was an issue when requesting additional permissions. Please go to the normal settings page.
				</p>
				<p>
					Clicking confirm will save your current settings and go to the normal settings page.
				</p>
			`,
		})
			.then(() => {
				saveSettings();
				window.open(location.href, "_blank");
			})
			.catch(() => {});
	}
}

async function setupAPIInfo() {
	const _api = document.find("#api");

	if (api.torn.key) _api.find("#api_key").value = api.torn.key;

	document.find("#update_api_key").addEventListener("click", async () => {
		const key = document.find("#api_key").value;

		checkAPIPermission(key)
			.then((granted) => {
				changeAPIKey(key)
					.then(() => {
						if (granted) sendMessage("API Key updated", true);
						else sendMessage("Your API key is not the correct API level. This will affect a lot of features.", false);
						console.log("TT - Updated api key!");
					})
					.catch((error) => {
						sendMessage(error, false);
						console.log("TT - Couldn't update API key!", error);
						document.find("#api_key").value = api.torn.key || "";
					});
			})
			.catch((error) => {
				sendMessage(error, false);
				console.log("TT - Couldn't update API key!", error);
				document.find("#api_key").value = api.torn.key || "";
			});
	});

	document.find(".current-usage .yata .icon").innerHTML = await (await fetch(chrome.runtime.getURL("resources/images/svg-icons/yata.svg"))).text();

	const apiUsageLocations = ["torn", "tornstats", "yata"];
	const perMinuteUsage = {
		torn: { count: 0, usage: 0 },
		tornstats: { count: 0, usage: 0 },
		yata: { count: 0, usage: 0 },
	};
	const perHourUsage = {
		torn: { hours: new Set() },
		tornstats: { hours: new Set() },
		yata: { hours: new Set() },
	};

	Object.entries(ttUsage.usage).forEach(([minute, localUsage]) => {
		const hourOfMinute = (minute / 60).dropDecimals();
		for (const location of apiUsageLocations) {
			if (localUsage[location] !== undefined && localUsage[location] !== null) {
				perMinuteUsage[location].usage += localUsage[location];
				perHourUsage[location].hours.add(hourOfMinute);
			}
			perMinuteUsage[location].count += 1;
		}
	});
	for (const location of apiUsageLocations) {
		perHourUsage[location].count = perHourUsage[location].hours.size;
		delete perHourUsage[location].hours;
	}
	document.findAll(".current-usage .averages > div.per-minute").forEach((usageDiv, index) => {
		const key = apiUsageLocations[index];
		usageDiv.textContent = `Average calls per minute: ${
			perMinuteUsage[key].count ? (perMinuteUsage[key].usage / perMinuteUsage[key].count).dropDecimals() : 0
		}`;
	});
	document.findAll(".current-usage .averages > div.per-hour").forEach((usageDiv, index) => {
		const key = apiUsageLocations[index];
		usageDiv.innerText = `Average calls per hour: ${perHourUsage[key].count ? (perMinuteUsage[key].usage / perHourUsage[key].count).dropDecimals() : 0}`;
	});

	const canvas = document.find("#current-usage-chart");
	document.find(".current-usage").appendChild(canvas);

	const darkMode = hasDarkMode();
	const usageChart = new Chart(canvas, {
		type: "bar",
		data: {
			labels: [],
			datasets: [
				{
					label: "Torn",
					data: [],
					backgroundColor: "#666",
				},
				{
					label: "Tornstats",
					data: [],
					backgroundColor: "#8abeef",
				},
				{
					label: "YATA",
					data: [],
					backgroundColor: "#447e9b",
				},
			],
		},
		options: {
			animation: {
				duration: 0,
			},
			scales: {
				x: {
					stacked: true,
					ticks: {
						color: darkMode ? "#fff" : "#000",
					},
				},
				y: {
					stacked: true,
					ticks: {
						min: 0,
						max: 100,
						stepSize: 1,
						color: darkMode ? "#fff" : "#000",
					},
				},
			},
			plugins: {
				legend: {
					labels: {
						color: darkMode ? "#fff" : "#000",
					},
				},
			},
		},
	});
	darkModeObserver.addListener((darkMode) => {
		const color = darkMode ? "#fff" : "#000";
		usageChart.options.scales.x.ticks.color = color;
		usageChart.options.scales.y.ticks.color = color;
		usageChart.options.plugins.legend.labels.color = color;
		// noinspection JSCheckFunctionSignatures
		usageChart.update();
	});
	await ttUsage.refresh();

	document
		.find("#update-torndata")
		.addEventListener("click", () =>
			chrome.runtime.sendMessage({ action: "forceUpdate", update: "torndata" }, (result) => console.log("Manually fetched torndata.", result))
		);
	document
		.find("#update-stocks")
		.addEventListener("click", () =>
			chrome.runtime.sendMessage({ action: "forceUpdate", update: "stocks" }, (result) => console.log("Manually fetched stocks.", result))
		);
	document
		.find("#update-factiondata")
		.addEventListener("click", () =>
			chrome.runtime.sendMessage({ action: "forceUpdate", update: "factiondata" }, (result) => console.log("Manually fetched factiondata.", result))
		);

	updateUsage(usageChart, "Last 5");
	document.find(".current-usage .buttons .last-5").addEventListener("click", () => updateUsage(usageChart, "Last 5"));
	document.find(".current-usage .buttons .last-1hr").addEventListener("click", () => updateUsage(usageChart, "Last 1hr"));
	document.find(".current-usage .buttons .last-24hrs").addEventListener("click", () => updateUsage(usageChart, "Last 24hrs"));

	function updateUsage(usageChart, position) {
		let maxIndex, barThickness, lastMinute;
		if (position === "Last 5") {
			maxIndex = 5;
			barThickness = 30;
		} else if (position === "Last 1hr") {
			maxIndex = 60;
			barThickness = 10;
		} else if (position === "Last 24hrs") {
			maxIndex = 1440;
			barThickness = 2;
		}

		usageChart.data.labels = [];
		usageChart.options.barThickness = barThickness;
		let i = 0;
		const offset = new Date().getTimezoneOffset();
		let minutesArray = Object.keys(ttUsage.usage).slice(-maxIndex);
		if (position === "Last 1hr") {
			lastMinute = parseInt(minutesArray.at(-1)) - 60;
			minutesArray = minutesArray.filter((minute) => minute >= lastMinute);
		}
		for (const minute of minutesArray) {
			const seconds = (parseInt(minute) - offset) * 60;
			const hour = ((seconds % 86400) / 3600).dropDecimals();
			usageChart.data.labels.push(`${toMultipleDigits(hour)}:${toMultipleDigits(((seconds % 3600) / 60).dropDecimals())}`);
			usageChart.data.datasets[0].data[i] = ttUsage.usage[minute].torn ?? 0;
			usageChart.data.datasets[1].data[i] = ttUsage.usage[minute].tornstats ?? 0;
			usageChart.data.datasets[2].data[i] = ttUsage.usage[minute].yata ?? 0;
			i++;
		}
		i = null;
		usageChart.update(false);
	}
}

async function setupExport() {
	const POPUP_TEMPLATES = {
		EXPORT: {
			title: "Export",
			message: `
				<h3>Following information will be exported:</h3>
				<ul>
					<li>User ID and username</li>
					<li>Client version and database size</li>
					<li>Exportation date and time</li>
					<li>
						Database
						<ul class="export-keys">
							<li>version notice</li>
							<li>preferences</li>
							<li>filter and sorting settings</li>
							<li>stakeouts</li>
							<li>notes</li>
							<li>quick items, crimes and jail bust / bail</li>
						</ul>
					</li>
				</ul>
			`,
			execute(popup, variables) {
				const { api } = {
					api: false,
					...variables,
				};

				if (api)
					popup.find(".export-keys").appendChild(
						document.newElement({
							type: "li",
							children: [
								document.newElement({ type: "input", id: "export-api-key", attributes: { type: "checkbox", name: "api_key" } }),
								document.newElement({ type: "label", text: "api key", attributes: { for: "export-api-key" } }),
							],
						})
					);
			},
		},
		IMPORT: {
			title: "Import",
			message: `
				<h3>Are you sure you want to overwrite following items?</h3>
				<ul class="export-keys">
					<li>version notice</li>
					<li>preferences</li>
					<li>filter and sorting settings</li>
					<li>stakeouts</li>
					<li>notes</li>
					<li>quick items, crimes and jail bust / bail</li>
				</ul>
			`,
			execute(popup, variables) {
				const { api } = {
					api: false,
					...variables,
				};

				if (api) popup.find(".export-keys").appendChild(document.newElement({ type: "li", text: "api key" }));
			},
		},
		IMPORT_MANUAL: {
			title: "Import",
			message: `
				<h3>Paste your database below. Be careful to use the exact copy provided.</h3>
				<textarea name="importtext"></textarea>
				
				<h3>Are you sure you want to overwrite following items?</h3>
				<ul>
					<li>version notice</li>
					<li>preferences</li>
					<li>filter and sorting settings</li>
					<li>stakeouts</li>
					<li>notes</li>
					<li>quick items, crimes and jail bust / bail</li>
					<li>api key</li>
				</ul>
			`,
		},
		CLEAR: {
			title: "Clear",
			message: "<h3>Are you sure you want to clear the remote storage?</h3>",
		},
	};

	const exportSection = document.find("#export");

	// Local Text
	exportSection.find("#export-local-text").addEventListener("click", async () => {
		loadConfirmationPopup({
			...POPUP_TEMPLATES.EXPORT,
			variables: { api: true },
		})
			.then(async ({ api_key: exportApi }) => {
				const data = JSON.stringify(await getExportData(exportApi));

				toClipboard(data);
				sendMessage("Copied database to your clipboard.", true);
			})
			.catch(() => {});
	});
	exportSection.find("#import-local-text").addEventListener("click", () => {
		loadConfirmationPopup(POPUP_TEMPLATES.IMPORT_MANUAL)
			.then(async ({ importtext }) => {
				if (importtext > 5242880) {
					sendMessage("Maximum size exceeded. (5MB)", false);
					return;
				}

				let data;
				try {
					// noinspection JSCheckFunctionSignatures
					data = JSON.parse(importtext);
				} catch (error) {
					console.error("Couldn't read the file!", error);
					sendMessage("Couldn't read the file!", false);
					return;
				}

				await importData(data);
			})
			.catch(() => {});
	});

	// Local File
	exportSection.find("#export-local-file").addEventListener("click", () => {
		loadConfirmationPopup({
			...POPUP_TEMPLATES.EXPORT,
			variables: { api: true },
		})
			.then(async ({ api_key: exportApi }) => {
				const data = JSON.stringify(await getExportData(exportApi), null, 4);

				document
					.newElement({
						type: "a",
						href: window.URL.createObjectURL(new Blob([data], { type: "octet/stream" })),
						attributes: { download: "torntools.json" },
					})
					.click();
			})
			.catch(() => {});
	});
	exportSection.find("#import-local-file").addEventListener("click", () => {
		loadConfirmationPopup({
			...POPUP_TEMPLATES.IMPORT,
			variables: { api: true },
		})
			.then(() => document.find("#import-local-file-origin").click())
			.catch(() => {});
	});
	exportSection.find("#import-local-file-origin").addEventListener("change", (event) => {
		const reader = new FileReader();
		reader.addEventListener("load", async (event) => {
			if (event.target.result.length > 5242880) {
				sendMessage("Maximum file size exceeded. (5MB)", false);
				return;
			}

			let data;
			try {
				// noinspection JSCheckFunctionSignatures
				data = JSON.parse(event.target.result);
			} catch (error) {
				console.error("Couldn't read the file!", error);
				sendMessage("Couldn't read the file!", false);
				return;
			}

			await importData(data);
		});
		reader.readAsText(event.target.files[0]);
	});

	// Remote Sync
	loadSync();

	// Remote Server
	// exportSection.find("#export-remote-server").addEventListener("click", () => {
	// 	loadConfirmationPopup(POPUP_TEMPLATES.EXPORT)
	// 		.then(() => {
	// 			// TODO - Store data in remote server.
	// 		})
	// 		.catch(() => {});
	// });
	// exportSection.find("#import-remote-server").addEventListener("click", () => {
	// 	loadConfirmationPopup(POPUP_TEMPLATES.IMPORT)
	// 		.then(() => {
	// 			// TODO - Load data from remote server.
	// 		})
	// 		.catch(() => {});
	// });

	async function getExportData(api) {
		const exportedKeys = ["version", "settings", "filters", "stakeouts", "notes", "quick"];
		if (api) exportedKeys.insertAt(0, "api");

		const data = {
			user: false,
			client: {
				version: chrome.runtime.getManifest().version,
				space: await ttStorage.getSize(),
			},
			date: new Date().toString(),
			database: (await ttStorage.get(exportedKeys)).reduce((object, value, index) => {
				object[exportedKeys[index]] = value;
				return object;
			}, {}),
		};

		if (hasAPIData()) {
			data.user = { id: userdata.player_id, name: userdata.name };
		}

		return data;
	}

	async function importData(data) {
		try {
			await ttStorage.change(data.database);
		} catch (error) {
			sendMessage("Couldn't save the imported database.", false);
			return;
		}

		sendMessage("Imported file.", true);
		await setupPreferences(true);
	}

	function loadSync() {
		const importRemoteSync = exportSection.find("#import-remote-sync");
		const clearRemoteSync = exportSection.find("#clear-remote-sync");

		const lastUpdate = exportSection.find(".sync .last-update");
		const version = exportSection.find(".sync .version");

		exportSection.find("#export-remote-sync").addEventListener("click", async () => {
			loadConfirmationPopup(POPUP_TEMPLATES.EXPORT)
				.then(async () => {
					const data = await getExportData(false);

					try {
						await new Promise((resolve) => {
							chrome.storage.sync.set(data, () => resolve());
						});
					} catch (error) {
						console.error("Failed to save data!", error);
						sendMessage("Failed to save data!", false);
						return;
					}

					sendMessage("Saved data in your browser synchronized storage.", true);
					handleSyncData(data);
				})
				.catch(() => {});
		});
		importRemoteSync.addEventListener("click", () => {
			loadConfirmationPopup(POPUP_TEMPLATES.IMPORT)
				.then(async () => await importData(data))
				.catch(() => {});
		});
		clearRemoteSync.addEventListener("click", () => {
			loadConfirmationPopup(POPUP_TEMPLATES.CLEAR)
				.then(async () => {
					await new Promise((resolve) => {
						chrome.storage.sync.clear(() => resolve());
					});

					sendMessage("Cleared sync data.", true);
					handleSyncData({ error: true, message: "No exported data." });
				})
				.catch(() => {});
		});

		new Promise((resolve) => {
			chrome.storage.sync.get(null, (data) => {
				if (Object.keys(data).length && "database" in data) resolve(data);
				else resolve({ error: true, message: "No exported data." });
			});
		}).then((data) => handleSyncData(data));

		function handleSyncData(data) {
			if (!data.error) {
				importRemoteSync.removeAttribute("disabled");
				importRemoteSync.classList.remove("tooltip");
				importRemoteSync.find(".tooltip-text").textContent = "";
				clearRemoteSync.removeAttribute("disabled");

				const updated = new Date(data.date);
				lastUpdate.textContent = `${formatTime(updated)} ${formatDate(updated, { showYear: true })}`;
				lastUpdate.parentElement.classList.remove("tt-hidden");
				version.textContent = data.client.version;
				version.parentElement.classList.remove("tt-hidden");
			} else {
				importRemoteSync.setAttribute("disabled", "");
				importRemoteSync.classList.add("tooltip");
				importRemoteSync.find(".tooltip-text").textContent = data.message;
				clearRemoteSync.setAttribute("disabled", "");

				lastUpdate.textContent = "";
				lastUpdate.parentElement.classList.add("tt-hidden");
				version.textContent = "";
				version.parentElement.classList.add("tt-hidden");
			}
		}
	}
}

function setupAbout() {
	const about = document.find("#about");

	// version
	about.find(".version").textContent = chrome.runtime.getManifest().version;

	// disk space
	ttStorage.getSize().then((size) => (about.find(".disk-space").textContent = formatBytes(size)));

	showTeam();

	function showTeam() {
		const ourTeam = about.find(".our-team");

		for (const member of TEAM.filter((member) => member.core)) {
			const title = Array.isArray(member.title) ? member.title.join(" + ") : member.title;

			const card = document.newElement({
				type: "div",
				class: "member-card",
				children: [
					document.newElement({
						type: "a",
						class: "name",
						text: member.name,
						href: `https://www.torn.com/profiles.php?XID=${member.torn}`,
						attributes: { target: "_blank" },
					}),
					document.newElement({ type: "span", class: "title", text: title }),
				],
			});

			if (member.donations) {
				const donations = document.newElement({ type: "div", class: "donations" });

				for (const method of member.donations) {
					donations.appendChild(
						document.newElement({
							type: "a",
							text: method.name,
							href: method.link,
							attributes: { target: "_blank" },
						})
					);
				}

				card.appendChild(document.newElement("hr"));
				card.appendChild(donations);
			}

			ourTeam.appendChild(card);
		}
	}
}

function formatBytes(bytes, options = {}) {
	options = {
		decimals: 2,
		...options,
	};

	if (bytes === 0) return "0 bytes";
	else if (bytes < 0) throw "Negative bytes are impossible";

	const unitExponent = 1024;
	const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const effectiveUnit = Math.floor(Math.log(bytes) / Math.log(unitExponent));

	const xBytes = bytes / Math.pow(unitExponent, effectiveUnit);

	return `${formatNumber(xBytes, { decimals: options.decimals })} ${units[effectiveUnit]}`;
}
