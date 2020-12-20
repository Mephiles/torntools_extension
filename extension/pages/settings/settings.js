"use strict";

import changelog from "../../changelog.js";

let initiatedPages = {};

(async () => {
	await loadDatabase();
	await showPage(getSearchParameters().get("page") || "changelog");

	document.body.classList.add(getPageTheme());

	for (let navigation of document.findAll("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

async function showPage(name) {
	// noinspection DuplicatedCode
	window.history.replaceState("", "Title", "?page=" + name);

	for (let active of document.findAll("header nav.on-page > ul > li.active")) active.classList.remove("active");
	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (let active of document.findAll("body > main:not(.hidden)")) active.classList.add("hidden");
	document.find(`#${name}`).classList.remove("hidden");

	let setup = {
		changelog: setupChangelog,
		preferences: setupPreferences,
		api: setupAPIInfo,
		remote: setupRemote,
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
	let content = document.find("#changelog > section");

	changelog.forEach((entry, index, allEntries) => {
		const wrapper = document.newElement({ type: "div", class: "parent" });
		const heading = document.newElement({ type: "div", class: "heading", text: getTitle() });
		const icon = document.newElement({ type: "i", class: "fas fa-chevron-down" });
		heading.appendChild(icon);
		wrapper.appendChild(heading);

		// Closeable
		const closeable = document.newElement({ type: "div", class: "closable hidden" });
		heading.addEventListener("click", () => {
			if (closeable.classList.contains("hidden")) closeable.classList.remove("hidden");
			else closeable.classList.add("hidden");

			rotateElement(icon, 180);
		});

		const contributors = Object.values(entry.logs)
			.flat()
			.map((log) => log.contributor)
			.filter((value, i, self) => self.indexOf(value) === i)
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
			class: "parent contributors",
			children: [document.newElement({ type: "div", class: "heading", text: "Contributors" })],
		});
		contributors.forEach((contributor) => {
			const child = document.newElement({
				type: "div",
				class: `child contributor`,
			});

			if (contributor.id)
				child.innerHTML = `
					<span>
						<a href="https://www.torn.com/profiles.php?XID=${contributor.id}" target="_blank">
							${contributor.name} [${contributor.id}]
						</a>
					</span>
				`;
			else child.appendChild(document.newElement({ type: "span", text: contributor.name }));

			if (contributor.color) child.style.setProperty("--contributor-color", contributor.color);

			contributorsWrap.appendChild(child);
		});
		closeable.appendChild(contributorsWrap);

		for (let title in entry.logs) {
			const parent = document.newElement({
				type: "div",
				class: "parent",
				children: [document.newElement({ type: "div", class: "heading", text: capitalizeText(title) })],
			});

			for (let log of entry.logs[title]) {
				const child = document.newElement({
					type: "div",
					class: `child contributor`,
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
			heading.click();
			heading.classList.add("current");
		}

		// Finish
		wrapper.appendChild(closeable);
		content.appendChild(wrapper);

		function getTitle() {
			let parts = [];

			parts.push(getVersion());
			if (entry.date) parts.push(`${MONTHS[entry.date.getMonth()]}, ${entry.date.getDate()}th ${entry.date.getFullYear()}`);
			if (entry.title) parts.push(entry.title);

			return parts.join(" - ");

			function getVersion() {
				let parts = [];

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

async function setupPreferences() {
	const _preferences = document.find("#preferences");

	const showAdvancedIcon = _preferences.find("#preferences-show_advanced");

	for (let link of _preferences.findAll(":scope > section > nav ul > li[name]")) {
		link.addEventListener("click", () => {
			_preferences.find(":scope > section > nav ul li[name].active").classList.remove("active");
			_preferences.find(":scope > section > .sections > section.active").classList.remove("active");

			link.classList.add("active");
			_preferences.find(`:scope > section > .sections > section[name="${link.getAttribute("name")}"]`).classList.add("active");
		});
	}

	showAdvanced(filters.preferences.showAdvanced);
	showAdvancedIcon.addEventListener("click", async () => {
		const newStatus = !filters.preferences.showAdvanced;

		showAdvanced(newStatus);
		await ttStorage.change({ filters: { preferences: { showAdvanced: newStatus } } });
	});

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

	_preferences.find("#saveSettings").addEventListener("click", async () => await saveSettings());
	_preferences.find("#resetSettings").addEventListener("click", () => {
		loadConfirmationPopup({
			title: "Reset settings",
			message: `<h3>Are you sure you want to delete ALL data except your API key?</h3>`,
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
		let disable = !event.target.checked;

		for (let notificationType in settings.notifications.types) {
			if (notificationType === "global") continue;

			if (disable) _preferences.find(`#notification_type-${notificationType}`).setAttribute("disabled", true);
			else _preferences.find(`#notification_type-${notificationType}`).removeAttribute("disabled");
		}
	});
	_preferences.find("#notification-sound").addEventListener("change", (event) => {
		let value = event.target.value;

		if (value === "custom") {
			_preferences.find("#notification-sound-upload").classList.remove("hidden");
		} else {
			_preferences.find("#notification-sound-upload").classList.add("hidden");
		}

		if (value === "mute" || value === "default") {
			_preferences.find("#notification-volume").classList.add("hidden");
			_preferences.find("#notification-sound-play").classList.add("hidden");
			_preferences.find("#notification-sound-stop").classList.add("hidden");
		} else {
			_preferences.find("#notification-volume").classList.remove("hidden");
			_preferences.find("#notification-sound-play").classList.remove("hidden");
			_preferences.find("#notification-sound-stop").classList.remove("hidden");
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
		let hrefInput = _preferences.find("#customLinks .input .href");
		let nameInput = _preferences.find("#customLinks .input .name");

		// noinspection DuplicatedCode
		if (event.target.value === "custom") {
			hrefInput.classList.remove("hidden");
			nameInput.classList.remove("hidden");
		} else {
			hrefInput.classList.add("hidden");
			nameInput.classList.add("hidden");

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
		inputRow.find(".name").classList.remove("hidden");
		inputRow.find(".href").value = "";
		inputRow.find(".href").classList.remove("hidden");
	});

	const chatSection = _preferences.find(".sections section[name='chat']");
	for (let placeholder of HIGHLIGHT_PLACEHOLDERS) {
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
	for (let area of ALL_AREAS) {
		const areaWrap = document.newElement({ type: "span", text: area.text, attributes: { name: area.class } });

		hideAreasParent.appendChild(areaWrap);
		if (ALL_AREAS.indexOf(area) + 1 !== ALL_AREAS.length) hideAreasParent.appendChild(document.createTextNode("\n"));

		areaWrap.addEventListener("click", () => areaWrap.classList.toggle("disabled"));
	}

	const hideIconsParent = _preferences.find("#hide-icons");
	for (let icon of ALL_ICONS) {
		const iconsWrap = document.newElement({ type: "div", class: `icon`, children: [document.newElement({ type: "div", class: icon })] });

		hideIconsParent.appendChild(iconsWrap);

		iconsWrap.addEventListener("click", () => {
			iconsWrap.classList.toggle("disabled");
		});
	}

	fillSettings();
	storageListeners.settings.push(updateSettings);

	function showAdvanced(advanced) {
		if (advanced) {
			_preferences.find(".sections").classList.remove("advanced-hidden");

			showAdvancedIcon.classList.add("fa-eye-slash");
			showAdvancedIcon.classList.remove("fa-eye");
			showAdvancedIcon.find(".tooltip-text").innerText = "Hide advanced options.";
		} else {
			_preferences.find(".sections").classList.add("advanced-hidden");

			showAdvancedIcon.classList.remove("fa-eye-slash");
			showAdvancedIcon.classList.add("fa-eye");
			showAdvancedIcon.find(".tooltip-text").innerText = "Show advanced options.";
		}
	}

	function fillSettings() {
		for (let setting of ["updateNotice"]) {
			const checkbox = _preferences.find(`#${setting}`);
			if (!checkbox) continue;

			checkbox.checked = settings[setting];
		}

		_preferences.find(`input[name="formatDate"][value="${settings.formatting.date}"]`).checked = true;
		_preferences.find(`input[name="formatTime"][value="${settings.formatting.time}"]`).checked = true;
		_preferences.find(`input[name="themePage"][value="${settings.themes.pages}"]`).checked = true;
		_preferences.find(`input[name="themeContainers"][value="${settings.themes.containers}"]`).checked = true;

		for (let type of ["pages"]) {
			for (let page in settings[type]) {
				const isGlobalDisabled = settings[type][page].global === false;

				for (let setting in settings[type][page]) {
					const input = _preferences.find(`#${page}-${setting}, input[name="${setting}"][value="${settings[type][page][setting]}"]`);
					if (!input) continue;

					if (setting === "global") {
						input.addEventListener("change", (event) => {
							const isGlobalDisabled = !event.target.checked;

							for (let setting in settings[type][page]) {
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
					}
				}
			}
		}

		_preferences.find("#api_usage-essential").value = settings.apiUsage.delayEssential;
		_preferences.find("#api_usage-basic").value = settings.apiUsage.delayBasic;
		_preferences.find("#api_usage-stakeouts").value = settings.apiUsage.delayStakeouts;
		for (let type of ["user"]) {
			for (let selection in settings.apiUsage[type]) {
				_preferences.find(`#api_usage-${type}_${selection}`).checked = settings.apiUsage[type][selection];
			}
		}

		for (let highlight of settings.pages.chat.highlights) {
			addChatHighlightRow(highlight.name, highlight.color);
		}
		for (let highlight of settings.pages.chat.titleHighlights) {
			addChatTitleHighlightRow(highlight.title, highlight.color);
		}

		const notificationsDisabled = !settings.notifications.types.global;
		for (let notificationType in settings.notifications.types) {
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
		_preferences.find("#notification-searchOpenTab").checked = settings.notifications.searchOpenTab;
		_preferences.find("#notification-volume").value = settings.notifications.volume;
		// noinspection JSIncompatibleTypesComparison
		if (settings.notifications.sound === "custom") {
			_preferences.find("#notification-sound-upload").classList.remove("hidden");
		} else {
			// noinspection JSIncompatibleTypesComparison
			if (settings.notifications.sound === "mute" || settings.notifications.sound === "default") {
				_preferences.find("#notification-volume").classList.add("hidden");
				_preferences.find("#notification-sound-play").classList.add("hidden");
				_preferences.find("#notification-sound-stop").classList.add("hidden");
			} else {
				_preferences.find("#notification-volume").classList.remove("hidden");
				_preferences.find("#notification-sound-play").classList.remove("hidden");
				_preferences.find("#notification-sound-stop").classList.remove("hidden");
			}
		}

		for (let area of settings.hideAreas) {
			_preferences.find(`#hide-areas span[name="${area}"]`).classList.add("disabled");
		}
		for (let icon of settings.hideIcons) {
			_preferences.find(`#hide-icons .${icon}`).parentElement.classList.add("disabled");
		}
		for (let link of settings.customLinks) {
			addCustomLink(link);
		}
	}

	function updateSettings() {
		updateGlobalNotifications();

		function updateGlobalNotifications() {
			if (!settings) return;

			const isGlobalDisabled = settings.notifications.types.global === false;

			for (let type in settings.notifications.types) {
				if (type === "stocks") continue;
				let option = _preferences.find(`#notification_type-${type}`);
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
		let options = [];

		for (const color in CHAT_TITLE_COLORS) {
			options.push(`<option value="${color}">${capitalizeText(color, { everyWord: true })}</option>`);
		}

		return options.join("");
	}

	function addCustomLink(data) {
		const newRow = document.newElement({
			type: "li",
			children: [
				document.newElement({ type: "input", class: "newTab", attributes: { type: "checkbox" } }),
				document.newElement({
					type: "select",
					class: "preset",
					value: data.preset,
					html: getCustomLinkOptions(),
					events: {
						change: (event) => {
							let hrefInput = newRow.find(".href");
							let nameInput = newRow.find(".name");

							// noinspection DuplicatedCode
							if (event.target.value === "custom") {
								hrefInput.classList.remove("hidden");
								nameInput.classList.remove("hidden");
							} else {
								hrefInput.classList.add("hidden");
								nameInput.classList.add("hidden");

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
					class: `name ${data.preset === "custom" ? "" : "hidden"}`,
					value: data.name,
					attributes: { type: "text", placeholder: "Name.." },
				}),
				document.newElement({
					type: "input",
					class: `href ${data.preset === "custom" ? "" : "hidden"}`,
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

	function getCustomLinkOptions() {
		let options = "<option value='custom'>Custom..</option>";
		for (let name in CUSTOM_LINKS_PRESET) options += `<option value="${name}">${name}</option>`;

		return options;
	}

	function getCustomLinkLocations() {
		let options = `
			<option value='above'>Above all the areas</option>
			<option value='under'>Under all the areas</option>
		`;

		for (let area of ALL_AREAS) {
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
		for (let setting of ["updateNotice"]) {
			const checkbox = _preferences.find(`#${setting}`);
			if (!checkbox) continue;

			settings[setting] = checkbox.checked;
		}

		settings.formatting.date = _preferences.find("input[name='formatDate']:checked").value;
		settings.formatting.time = _preferences.find("input[name='formatTime']:checked").value;
		settings.themes.pages = _preferences.find("input[name='themePage']:checked").value;
		settings.themes.containers = _preferences.find("input[name='themeContainers']:checked").value;

		for (let type of ["pages"]) {
			for (let page in settings[type]) {
				for (let setting in settings[type][page]) {
					const input = _preferences.find(`#${page}-${setting}, input[name="${setting}"]:checked`);
					if (!input) continue;

					if (input.tagName === "INPUT") {
						switch (input.getAttribute("type")) {
							case "number":
								settings[type][page][setting] = parseInt(input.value);
								break;
							case "checkbox":
								settings[type][page][setting] = input.checked;
								break;
							default:
								settings[type][page][setting] = input.value;
								break;
						}
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

		settings.hideAreas = [..._preferences.findAll("#hide-areas span.disabled")].map((area) => area.getAttribute("name"));
		settings.hideIcons = [..._preferences.findAll("#hide-icons .icon.disabled > div")].map((area) => area.getAttribute("class"));

		settings.apiUsage.delayEssential = parseInt(_preferences.find("#api_usage-essential").value);
		settings.apiUsage.delayBasic = parseInt(_preferences.find("#api_usage-basic").value);
		settings.apiUsage.delayStakeouts = parseInt(_preferences.find("#api_usage-stakeouts").value);
		for (let type of ["user"]) {
			for (let selection in settings.apiUsage[type]) {
				settings.apiUsage[type][selection] = _preferences.find(`#api_usage-${type}_${selection}`).checked;
			}
		}

		for (let notificationType in settings.notifications.types) {
			if (notificationType === "stocks") continue;

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

		settings.notifications.tts = _preferences.find("#notification-tts").checked;
		settings.notifications.link = _preferences.find("#notification-link").checked;
		settings.notifications.requireInteraction = _preferences.find("#notification-requireInteraction").checked;
		settings.notifications.searchOpenTab = _preferences.find("#notification-searchOpenTab").checked;
		settings.notifications.volume = parseInt(_preferences.find("#notification-volume").value);
		settings.notifications.sound = _preferences.find(`#notification-sound`).value;

		const newStorage = { settings };
		await ttStorage.set(newStorage);
		console.log("Settings updated!", newStorage);

		// noinspection BadExpressionStatementJS
		["dark", "light"].forEach((theme) => document.body.classList.remove(theme));
		document.body.classList.add(getPageTheme());

		sendMessage("Settings saved.", true);
	}
}

async function setupAPIInfo() {
	const _api = document.find("#api");

	if (api.torn.key) {
		_api.find("#api_key").value = api.torn.key;
	}
	document.find("#update_api_key").addEventListener("click", async () => {
		changeAPIKey(document.find("#api_key").value)
			.then(() => {
				sendMessage("API Key updated", true);
				console.log("TT - Updated api key!");
			})
			.catch((error) => {
				sendMessage(error, false);
				console.log("TT - Couldn't update API key!", error);
				document.find("#api_key").value = api.torn.key || "";
			});
	});
}

function setupRemote() {}

function setupAbout() {}
