// @ts-ignore Detects reassignment, but those pages are never loaded in the same context.
const initiatedPages = {};

(async () => {
	initializeInternalPage({ sortTables: true });
	await loadDatabase();
	await showPage(getSearchParameters().get("page") || "preferences");

	document.body.classList.add(getPageTheme());

	for (const navigation of findAllElements("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

const isIframe = window.self !== window.top; // https://stackoverflow.com/a/326076

// @ts-ignore Detects reassignment, but those pages are never loaded in the same context.
async function showPage(name: string) {
	const params = new URL(location.href).searchParams;
	params.set("page", name);
	if (name !== "preferences") params.delete("section");
	window.history.replaceState("", "Title", `?${params.toString()}`);

	for (const active of findAllElements("header nav.on-page > ul > li.active")) active.classList.remove("active");
	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");

	for (const active of findAllElements("body > main:not(.tt-hidden)")) active.classList.add("tt-hidden");
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

type Changelog = {
	version: { major: number; minor: number; build: number };
	title?: string;
	date?: false | string | Date;
	logs: {
		[section: string]: { message: string | string[]; contributor: string }[];
	};
}[];

async function setupChangelog() {
	const changelog: Changelog = await (await fetch(chrome.runtime.getURL("changelog.json"))).json();
	const content = document.find("#changelog > section");

	changelog.forEach((entry, index, allEntries) => {
		if (typeof entry.date === "string") entry.date = new Date(entry.date);
		else if (typeof entry.date === "object") entry.date = false;

		const log = elementBuilder({ type: "div", class: "version-log" });
		const heading = elementBuilder({ type: "div", class: "title", text: getTitle() });
		const icon = elementBuilder({ type: "i", class: "fa-solid  fa-chevron-down" });
		heading.appendChild(icon);
		log.appendChild(heading);

		// Closeable
		const closeable = elementBuilder({ type: "div", class: "closable tt-hidden" });
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

		const contributorsWrap = elementBuilder({
			type: "div",
			class: "list contributors",
			children: [elementBuilder({ type: "div", class: "subheader", text: "Contributors" })],
		});
		contributors.forEach((contributor) => {
			const child = elementBuilder({
				type: "div",
				class: "contributor",
			});

			if ("id" in contributor)
				child.appendChild(
					elementBuilder({
						type: "a",
						text: `${contributor.name} [${contributor.id}]`,
						href: `https://www.torn.com/profiles.php?XID=${contributor.id}`,
						attributes: { target: "_blank" },
					})
				);
			else child.appendChild(elementBuilder({ type: "span", text: contributor.name }));

			if ("color" in contributor) child.style.setProperty("--contributor-color", contributor.color);

			contributorsWrap.appendChild(child);
		});
		closeable.appendChild(contributorsWrap);

		for (const title in entry.logs) {
			const parent = elementBuilder({
				type: "div",
				class: "list",
				children: [elementBuilder({ type: "div", class: "subheader", text: capitalizeText(title) })],
			});

			for (const log of entry.logs[title]) {
				let message: string;
				if (typeof log.message === "string") message = log.message;
				else if (typeof log.message === "object" && Array.isArray(log.message)) message = log.message.join("<br>");

				const child = elementBuilder({
					type: "div",
					class: "contributor",
					children: [elementBuilder({ type: "span", html: message })],
				});

				const contributor = contributors.filter((x) => x.key === log.contributor);
				if (contributor.length) {
					if ("color" in contributor[0]) child.style.setProperty("--contributor-color", contributor[0].color);
				}

				parent.appendChild(child);
			}

			closeable.appendChild(parent);
		}

		// Bottom border on last element
		if (index + 1 === allEntries.length) closeable.appendChild(elementBuilder("hr"));
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
			if (entry.date && typeof entry.date === "object")
				parts.push(`${MONTHS[entry.date.getMonth()]}, ${daySuffix(entry.date.getDate())} ${entry.date.getFullYear()}`);
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
	content.appendChild(elementBuilder({ type: "p", text: "The rest is history..", style: { textAlign: "center" } }));

	await ttStorage.change({ version: { showNotice: false } });
}

function cleanupPreferences() {
	const preferences = document.find("#preferences");

	findAllElements(
		[
			".hide-items > *",
			"#customLink > li:not(.input)",
			"#allyFactions > li:not(.input)",
			"#userAlias > li:not(.input)",
			"#chatHighlight > li:not(.input)",
			"#chatTitleHighlight> li:not(.input)",
		].join(", "),
		preferences
	).forEach((element) => element.remove());
}

interface CustomLink {
	newTab: boolean;
	preset: string;
	location: string;
	name: string;
	href: string;
}

interface InactivityDisplay {
	color: string;
	days: number | null;
}

async function setupPreferences(requireCleanup: boolean = false) {
	if (requireCleanup) cleanupPreferences();
	searchPreferences();

	const _preferences = document.find("#preferences");
	_preferences.addEventListener("click", (event) => {
		if (!(event.target as Element).closest("button.remove-icon-wrap, #hide-icons, #hide-casino-games, #hide-stocks, #hide-attack-options")) return;

		addSaveDialog();
	});
	_preferences.addEventListener("change", (event) => {
		if ((event.target as Element).tagName !== "INPUT" && (event.target as Element).tagName !== "SELECT") return;

		addSaveDialog();
	});
	_preferences.addEventListener("input", (event) => {
		if ((event.target as Element).tagName !== "INPUT") return;

		addSaveDialog();
	});
	_preferences.addEventListener("dragend", (event) => {
		if (!(event.target as Element).closest("#customLinks")) return;

		addSaveDialog();
	});

	const reviveProviderSelectElement = _preferences.find("#global-reviveProvider");
	for (const provider of REVIVE_PROVIDERS) {
		reviveProviderSelectElement.appendChild(
			elementBuilder({
				type: "option",
				text: `${provider.name} (${calculateRevivePrice(provider)})`,
				attributes: { value: provider.provider },
			})
		);
	}

	reviveProviderSelectElement.addEventListener("change", (event) => {
		const origin = REVIVE_PROVIDERS.find((p) => p.provider === (event.target as HTMLInputElement).value)?.origin;

		chrome.permissions.request({ origins: [origin] }, (granted) => {
			if (granted) return;

			sendMessage("That permission is required for the revive provider you selected.", false);
		});
	});

	if (getSearchParameters().has("section"))
		switchSection(_preferences.find(`#preferences > section > nav ul > li[name="${getSearchParameters().get("section")}"]`));

	for (const link of findAllElements(":scope > section > nav ul > li[name]", _preferences)) {
		link.addEventListener("click", () => switchSection(link));
	}

	_preferences.find("#addChatHighlight").addEventListener("click", () => {
		const inputRow = document.find("#chatHighlight .input");

		addChatHighlightRow(inputRow.find<HTMLInputElement>(".name").value, inputRow.find<HTMLInputElement>(".color").value);

		inputRow.find<HTMLInputElement>(".name").value = "";
		inputRow.find<HTMLInputElement>(".color").value = "#7ca900";
	});
	_preferences.find("#addChatTitleHighlight").addEventListener("click", () => {
		const inputRow = document.find("#chatTitleHighlight .input");

		addChatTitleHighlightRow(inputRow.find<HTMLInputElement>(".title").value, inputRow.find<HTMLInputElement>(".color").value);

		inputRow.find<HTMLInputElement>(".title").value = "";
		inputRow.find<HTMLSelectElement>(".color").selectedIndex = 0;
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

				await chrome.runtime.sendMessage({ action: "initialize" } satisfies BackgroundMessage);
				sendMessage("Settings reset.", true, { reload: true });
			})
			.catch(() => {});
	});

	_preferences.find("#notification_type-global").addEventListener("click", (event) => {
		const disable = !(event.target as HTMLInputElement).checked;

		for (const notificationType in settings.notifications.types) {
			if (["global", "stocks", "npcs"].includes(notificationType)) continue;

			if (disable) _preferences.find(`#notification_type-${notificationType}`).setAttribute("disabled", "true");
			else _preferences.find(`#notification_type-${notificationType}`).removeAttribute("disabled");
		}
	});
	_preferences.find("#notification-sound").addEventListener("change", (event) => {
		const value = (event.target as HTMLInputElement).value;

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
			sound: _preferences.find<HTMLInputElement>("#notification-sound").value,
			volume: parseInt(_preferences.find<HTMLInputElement>("#notification-volume").value),
			allowDefault: false,
		} satisfies BackgroundMessage);
	});
	_preferences.find("#notification-sound-stop").addEventListener("click", () => {
		chrome.runtime.sendMessage({ action: "stop-notification-sound" } satisfies BackgroundMessage);
	});
	_preferences.find("#notification-sound-upload").addEventListener("change", (event) => {
		const target = event.target as HTMLInputElement;
		if (!target.files.length) return;

		const reader = new FileReader();
		reader.addEventListener("load", (event) => {
			const result = event.target.result;
			if (typeof result !== "string") {
				return;
			}

			if (result.length > 5242880) {
				console.warn(`Uploaded file had a size of ${formatBytes(result.length)}.`);
				return sendMessage("Maximum file size exceeded. (5MB)", false);
			}

			ttStorage.change({ settings: { notifications: { soundCustom: result } } });
		});
		reader.readAsDataURL(target.files[0]);
	});

	new Sortable(_preferences.find("#customLinks"), {
		draggable: "li:not(.input)",
		handle: ".move-icon-wrap",
		ghostClass: "dragging",
	});
	_preferences.find("#customLinks .input select.preset").innerHTML = getCustomLinkOptions();
	_preferences.find<HTMLSelectElement>("#customLinks .input select.preset").value = "custom";
	_preferences.find("#customLinks .input select.preset").addEventListener("change", (event) => {
		const target = event.target as HTMLSelectElement;
		const hrefInput = _preferences.find<HTMLInputElement>("#customLinks .input .href");
		const nameInput = _preferences.find<HTMLInputElement>("#customLinks .input .name");

		// noinspection DuplicatedCode
		if (target.value === "custom") {
			hrefInput.classList.remove("tt-hidden");
			hrefInput.value = "";
			nameInput.classList.remove("tt-hidden");
			nameInput.value = "";
		} else {
			hrefInput.classList.add("tt-hidden");
			nameInput.classList.add("tt-hidden");

			hrefInput.value = CUSTOM_LINKS_PRESET[target.value.replaceAll("_", " ")].link;
			nameInput.value = target.value.replaceAll("_", " ");
		}
	});
	_preferences.find("#customLinks .input select.location").innerHTML = getCustomLinkLocations();
	_preferences.find<HTMLSelectElement>("#customLinks .input select.location").value = "above";
	_preferences.find("#addCustomLink").addEventListener("click", () => {
		const inputRow = document.find("#customLinks .input");

		addCustomLink({
			newTab: inputRow.find<HTMLInputElement>(".newTab").checked,
			preset: inputRow.find<HTMLInputElement>(".preset").value,
			location: inputRow.find<HTMLInputElement>(".location").value,
			name: inputRow.find<HTMLInputElement>(".name").value,
			href: inputRow.find<HTMLInputElement>(".href").value,
		});

		inputRow.find<HTMLInputElement>(".newTab").checked = false;
		inputRow.find<HTMLInputElement>(".preset").value = "custom";
		inputRow.find<HTMLInputElement>(".location").value = "above";
		inputRow.find<HTMLInputElement>(".name").value = "";
		inputRow.find(".name").classList.remove("tt-hidden");
		inputRow.find<HTMLInputElement>(".href").value = "";
		inputRow.find(".href").classList.remove("tt-hidden");
	});

	_preferences.find("#addAllyFaction").addEventListener("click", () => {
		const inputRow = document.find("#allyFactions .input");

		addAllyFaction(inputRow.find<HTMLInputElement>(".faction").value);
	});

	_preferences.find("#addUserAlias").addEventListener("click", () => {
		const inputRow = document.find("#userAlias li:last-child");

		addUserAlias(
			inputRow.find<HTMLInputElement>(".userID").value,
			inputRow.find<HTMLInputElement>(".name").value,
			inputRow.find<HTMLInputElement>(".alias").value
		);
	});

	const chatSection = _preferences.find(".sections section[name='chat']");
	for (const placeholder of HIGHLIGHT_PLACEHOLDERS) {
		chatSection.insertBefore(
			elementBuilder({
				type: "div",
				class: "tabbed note",
				text: `${placeholder.name} - ${placeholder.description}`,
			}),
			chatSection.find("#chatHighlight+.note").nextElementSibling
		);
	}

	const hideIconsParent = _preferences.find("#hide-icons");
	for (const { icon, id, description } of ALL_ICONS) {
		const iconsWrap = elementBuilder({
			type: "div",
			class: ["icon", "hover_tooltip"],
			children: [
				elementBuilder({ type: "div", class: icon, style: { backgroundPosition: `-${(id - 1) * 18}px 0` } }),
				elementBuilder({ type: "span", class: "hover_tooltip_text", text: description }),
			],
		});

		hideIconsParent.appendChild(iconsWrap);

		iconsWrap.addEventListener("click", () => {
			iconsWrap.classList.toggle("disabled");
		});
	}

	const hideCasinoGamesParent = _preferences.find("#hide-casino-games");
	for (const game of CASINO_GAMES) {
		const casinoGame = elementBuilder({ type: "span", text: capitalizeText(game), attributes: { name: game } });

		hideCasinoGamesParent.appendChild(casinoGame);
		if (CASINO_GAMES.indexOf(game) + 1 !== CASINO_GAMES.length) hideCasinoGamesParent.appendChild(document.createTextNode("\n"));

		casinoGame.addEventListener("click", (event) => (event.target as Element).classList.toggle("disabled"));
	}

	const hideStocksParent = _preferences.find("#hide-stocks");
	if (hasAPIData() && stockdata) {
		for (const stock in stockdata) {
			if (typeof stockdata[stock] === "number") continue;

			const stockName = stockdata[stock].name;
			hideStocksParent.appendChild(
				elementBuilder({
					type: "span",
					id: stock,
					text: capitalizeText(stockName),
				})
			);
		}
		hideStocksParent.addEventListener("click", (event) => {
			const target = event.target as Element;
			if (!isNaN(parseInt(target.getAttribute("id")))) target.classList.toggle("disabled");
		});
	} else {
		hideStocksParent.classList.add("warning");
		hideStocksParent.appendChild(document.createTextNode("Requires API data to be loaded."));
	}

	if (npcs.targets) {
		const alerts = _preferences.find("#npc-alerts");

		for (const [id, npc] of Object.entries(npcs.targets)) {
			alerts.appendChild(
				elementBuilder({
					type: "li",
					children: [
						elementBuilder({ type: "input", value: npc.name, attributes: { disabled: "" } }),
						elementBuilder({
							type: "input",
							class: "level",
							// value: notification.level,
							attributes: { placeholder: "Level", type: "number", min: 1, max: 5 },
							events: { input: enforceInputLimits },
						}),
						elementBuilder({
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
		const optionNode = elementBuilder({ type: "span", text: capitalizeText(option), attributes: { value: option } });
		hideAttackOptionsParent.appendChild(optionNode);
		optionNode.addEventListener("click", (event) => (event.target as Element).classList.toggle("disabled"));
	});

	_preferences.find("#external-tornstats").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.tornstats, event));
	_preferences.find("#external-yata").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.yata, event));
	_preferences.find("#external-prometheus").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.prometheus, event));
	_preferences.find("#external-lzpt").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.lzpt, event));
	_preferences.find("#external-tornw3b").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.tornw3b, event));
	_preferences.find("#external-ffScouter").addEventListener("click", (event) => requestOrigin(FETCH_PLATFORMS.ffscouter, event));

	_preferences.find("#global-reviveProvider").addEventListener("change", (event) => {
		const provider = (event.target as HTMLInputElement).value;
		if (!provider) return;

		const origin = REVIVE_PROVIDERS.find((p) => p.provider === provider)?.origin;
		if (!origin) return;

		if (!chrome.permissions) {
			(event.target as HTMLInputElement).value = settings.pages.global.reviveProvider;
			warnMissingPermissionAPI();
			return;
		}

		chrome.permissions.request({ origins: [origin] }, (granted) => {
			if (!granted) {
				sendMessage("Can't select this provider without accepting the permission.", false);
				(event.target as HTMLInputElement).value = settings.pages.global.reviveProvider;
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

	function switchSection(link: HTMLElement) {
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
		for (const setting of [
			"updateNotice",
			"developer",
			"featureDisplay",
			"featureDisplayOnlyFailed",
			"featureDisplayHideDisabled",
			"featureDisplayHideEmpty",
		]) {
			const checkbox = _preferences.find<HTMLInputElement>(`#${setting}`);
			if (!checkbox) continue;

			checkbox.checked = settings[setting];
		}

		_preferences.find<HTMLInputElement>("#formatting-tct").checked = settings.formatting.tct;
		_preferences.find<HTMLInputElement>(`input[name="formatDate"][value="${settings.formatting.date}"]`).checked = true;
		_preferences.find<HTMLInputElement>(`input[name="formatTime"][value="${settings.formatting.time}"]`).checked = true;
		_preferences.find<HTMLInputElement>(`input[name="themePage"][value="${settings.themes.pages}"]`).checked = true;
		_preferences.find<HTMLInputElement>(`input[name="themeContainers"][value="${settings.themes.containers}"]`).checked = true;

		for (const service of ["tornstats", "yata", "prometheus", "lzpt", "tornw3b", "ffScouter"]) {
			_preferences.find<HTMLInputElement>(`#external-${service}`).checked = settings.external[service];
		}

		_preferences.find<HTMLInputElement>("#csvDelimiter").value = settings.csvDelimiter;

		for (const type of ["pages", "scripts"]) {
			for (const page in settings[type]) {
				const isGlobalDisabled = settings[type][page].global === false;

				for (const setting in settings[type][page]) {
					const input = _preferences.find<HTMLInputElement>(
						`#${page}-${setting}, input[name="${setting}"][value="${settings[type][page][setting]}"]`
					);
					if (!input) continue;

					if (setting === "global") {
						input.addEventListener("change", (event) => {
							const isGlobalDisabled = !(event.target as HTMLInputElement).checked;

							for (const setting in settings[type][page]) {
								if (setting === "global") continue;

								const input = _preferences.find(`#${page}-${setting}`);
								if (!input) continue;

								if (isGlobalDisabled) input.setAttribute("disabled", "true");
								else input.removeAttribute("disabled");
							}
						});
					} else if (isGlobalDisabled) input.setAttribute("disabled", "true");
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

		_preferences.find<HTMLInputElement>("#api_usage-comment").value = settings.apiUsage.comment;
		_preferences.find<HTMLInputElement>("#api_usage-essential").value = settings.apiUsage.delayEssential.toString();
		_preferences.find<HTMLInputElement>("#api_usage-basic").value = settings.apiUsage.delayBasic.toString();
		_preferences.find<HTMLInputElement>("#api_usage-stakeouts").value = settings.apiUsage.delayStakeouts.toString();
		for (const type of ["user"]) {
			for (const selection in settings.apiUsage[type]) {
				if (_preferences.find(`#api_usage-${type}_${selection}`))
					_preferences.find<HTMLInputElement>(`#api_usage-${type}_${selection}`).checked = settings.apiUsage[type][selection];
			}
		}

		if (api.tornstats.key) _preferences.find<HTMLInputElement>("#external-tornstats-key").value = api.tornstats.key;
		if (api.yata.key) _preferences.find<HTMLInputElement>("#external-yata-key").value = api.yata.key;
		if (api.ffScouter.key) _preferences.find<HTMLInputElement>("#external-ffScouter-key").value = api.ffScouter.key;

		for (const highlight of settings.pages.chat.highlights) {
			addChatHighlightRow(highlight.name, highlight.color);
		}
		for (const highlight of settings.pages.chat.titleHighlights) {
			addChatTitleHighlightRow(highlight.title, highlight.color);
		}

		const notificationsDisabled = !settings.notifications.types.global;
		for (const notificationType in settings.notifications.types) {
			if (notificationType === "stocks") continue;
			let option: any;

			if (Array.isArray(settings.notifications.types[notificationType])) {
				option = _preferences.find(`#notification_type-${notificationType}[type="text"]`);
				if (!option) continue;
				option.value = settings.notifications.types[notificationType].join(",");
			} else if (typeof settings.notifications.types[notificationType] === "boolean") {
				option = _preferences.find(`#notification_type-${notificationType}`);
				if (!option) continue;
				option.checked = settings.notifications.types[notificationType];
			} else {
				option = _preferences.find(`#notification_type-${notificationType}`);
				if (!option) continue;
				option.value = settings.notifications.types[notificationType];
			}

			if (notificationsDisabled && notificationType !== "global") option.setAttribute("disabled", true);
			else option.removeAttribute("disabled");
		}

		_preferences.find<HTMLInputElement>("#notification-sound").value = settings.notifications.sound;
		_preferences.find<HTMLInputElement>("#notification-tts").checked = settings.notifications.tts;
		_preferences.find<HTMLInputElement>("#notification-link").checked = settings.notifications.link;
		_preferences.find<HTMLInputElement>("#notification-requireInteraction").checked = settings.notifications.requireInteraction;
		_preferences.find<HTMLInputElement>("#notification-volume").value = settings.notifications.volume.toString();
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

			row.find<HTMLInputElement>("input[type='number']").value = warning.days && !isNaN(warning.days) ? warning.days.toString() : "";
			row.find<HTMLInputElement>("input[type='color']").value = warning.color;
		});
		settings.factionInactivityWarning.forEach((warning, index) => {
			const row = _preferences.find(`#factionInactivityWarning .tabbed:nth-child(${index + 2})`);

			row.find<HTMLInputElement>("input[type='number']").value = warning.days && !isNaN(warning.days) ? warning.days.toString() : "";
			row.find<HTMLInputElement>("input[type='color']").value = warning.color;
		});
		settings.alliedFactions.forEach((ally) => addAllyFaction(ally));
		for (const userID in settings.userAlias) {
			addUserAlias(userID, settings.userAlias[userID].name, settings.userAlias[userID].alias);
		}
		for (const { id, level, minutes } of settings.notifications.types.npcs) {
			const row = _preferences.find(`#npc-alerts > li[data-id='${id}']`);
			if (!row) continue;

			row.find<HTMLInputElement>(".level").value = level.toString();
			row.find<HTMLInputElement>(".minutes").value = minutes.toString();
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
				const option = _preferences.find<HTMLInputElement>(`#notification_type-${type}`);
				if (!option) continue;

				if (type === "global") {
					option.checked = !isGlobalDisabled;
				} else {
					if (isGlobalDisabled) option.setAttribute("disabled", "true");
					else option.removeAttribute("disabled");
				}
			}
		}
	}

	function addChatHighlightRow(name: string, color: string) {
		const deleteIcon = elementBuilder({
			type: "button",
			class: "remove-icon-wrap",
			children: [elementBuilder({ type: "i", class: "remove-icon fa-solid fa-trash-can" })],
		});
		const newRow = elementBuilder({
			type: "li",
			children: [
				elementBuilder({ type: "input", class: "name", value: name, attributes: { type: "text", placeholder: "Name.." } }),
				elementBuilder({ type: "input", class: "color", value: color, attributes: { type: "color" } }),
				deleteIcon,
			],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#chatHighlight").insertBefore(newRow, _preferences.find("#chatHighlight .input"));
	}

	function addChatTitleHighlightRow(title: string, color: string) {
		const deleteIcon = elementBuilder({
			type: "button",
			class: "remove-icon-wrap",
			children: [elementBuilder({ type: "i", class: "remove-icon fa-solid fa-trash-can" })],
		});
		const newRow = elementBuilder({
			type: "li",
			children: [
				elementBuilder({ type: "input", class: "title", value: title, attributes: { type: "text", placeholder: "Title.." } }),
				elementBuilder({
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

	function addCustomLink(data: CustomLink) {
		const newRow = elementBuilder({
			type: "li",
			children: [
				elementBuilder({
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
				elementBuilder({
					type: "select",
					class: "preset",
					value: data.preset,
					html: getCustomLinkOptions(),
					events: {
						change: (event) => {
							const target = event.target as HTMLInputElement;
							const hrefInput = newRow.find<HTMLInputElement>(".href");
							const nameInput = newRow.find<HTMLInputElement>(".name");

							// noinspection DuplicatedCode
							if (target.value === "custom") {
								hrefInput.classList.remove("tt-hidden");
								nameInput.classList.remove("tt-hidden");
							} else {
								hrefInput.classList.add("tt-hidden");
								nameInput.classList.add("tt-hidden");

								hrefInput.value = CUSTOM_LINKS_PRESET[target.value.replaceAll("_", " ")].link;
								nameInput.value = target.value.replaceAll("_", " ");
							}
						},
					},
				}),
				elementBuilder({
					type: "select",
					class: "location",
					value: data.location,
					html: getCustomLinkLocations(),
				}),
				elementBuilder({
					type: "input",
					class: `name ${data.preset === "custom" ? "" : "tt-hidden"}`,
					value: data.name,
					attributes: { type: "text", placeholder: "Name.." },
				}),
				elementBuilder({
					type: "input",
					class: `href ${data.preset === "custom" ? "" : "tt-hidden"}`,
					value: data.href,
					attributes: { type: "text", placeholder: "Name.." },
				}),
				elementBuilder({
					type: "button",
					class: "remove-icon-wrap",
					children: [elementBuilder({ type: "i", class: "remove-icon fa-solid fa-trash-can" })],
					events: {
						click: () => newRow.remove(),
					},
				}),
				elementBuilder({
					type: "div",
					class: "move-icon-wrap",
					children: [elementBuilder({ type: "i", class: "move-icon fa-solid fa-bars" })],
				}),
			],
		});

		_preferences.find("#customLinks").insertBefore(newRow, _preferences.find("#customLinks .input"));
	}

	function addAllyFaction(ally: string | number) {
		const deleteIcon = elementBuilder({
			type: "button",
			class: "remove-icon-wrap",
			children: [elementBuilder({ type: "i", class: "remove-icon fa-solid fa-trash-can" })],
		});
		const newRow = elementBuilder({
			type: "li",
			children: [elementBuilder({ type: "input", class: "faction", value: ally }), deleteIcon],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#allyFactions li:last-child").insertAdjacentElement("beforebegin", newRow);
		_preferences.find<HTMLInputElement>("#allyFactions li:last-child input").value = "";
	}

	function addUserAlias(userID: string, name: string, alias: string) {
		const deleteIcon = elementBuilder({
			type: "button",
			class: "remove-icon-wrap",
			children: [elementBuilder({ type: "i", class: "remove-icon fa-solid fa-trash-can" })],
		});
		const newRow = elementBuilder({
			type: "li",
			children: [
				elementBuilder({ type: "input", class: "userID", value: userID, attributes: { type: "text", placeholder: "User ID.." } }),
				elementBuilder({ type: "input", class: "name", value: name, attributes: { type: "text", placeholder: "Name.." } }),
				elementBuilder({ type: "input", class: "alias", value: alias, attributes: { type: "text", placeholder: "Alias.." } }),
				deleteIcon,
			],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		_preferences.find("#userAlias li:last-child").insertAdjacentElement("beforebegin", newRow);
		findAllElements<HTMLInputElement>("#userAlias li:last-child input", _preferences).forEach((x) => (x.value = ""));
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
		for (const setting of [
			"updateNotice",
			"developer",
			"featureDisplay",
			"featureDisplayOnlyFailed",
			"featureDisplayHideDisabled",
			"featureDisplayHideEmpty",
		]) {
			const checkbox = _preferences.find<HTMLInputElement>(`#${setting}`);
			if (!checkbox) continue;

			settings[setting] = checkbox.checked;
		}

		settings.formatting.tct = _preferences.find<HTMLInputElement>("#formatting-tct").checked;
		settings.formatting.date = _preferences.find<HTMLInputElement>("input[name='formatDate']:checked").value;
		settings.formatting.time = _preferences.find<HTMLInputElement>("input[name='formatTime']:checked").value;
		settings.themes.pages = _preferences.find<HTMLInputElement>("input[name='themePage']:checked").value as InternalPageTheme;
		settings.themes.containers = _preferences.find<HTMLInputElement>("input[name='themeContainers']:checked").value;

		settings.csvDelimiter = _preferences.find<HTMLInputElement>("#csvDelimiter").value;

		settings.external.tornstats = _preferences.find<HTMLInputElement>("#external-tornstats").checked;
		settings.external.yata = _preferences.find<HTMLInputElement>("#external-yata").checked;
		settings.external.prometheus = _preferences.find<HTMLInputElement>("#external-prometheus").checked;
		settings.external.lzpt = _preferences.find<HTMLInputElement>("#external-lzpt").checked;
		settings.external.tornw3b = _preferences.find<HTMLInputElement>("#external-tornw3b").checked;
		settings.external.ffScouter = _preferences.find<HTMLInputElement>("#external-ffScouter").checked;

		for (const type of ["pages", "scripts"]) {
			for (const page in settings[type]) {
				for (const setting in settings[type][page]) {
					const input = _preferences.find<HTMLInputElement>(`#${page}-${setting}, input[name="${setting}"]:checked`);
					if (!input) continue;

					if (input.tagName === "INPUT") {
						switch (input.getAttribute("type")) {
							case "number":
								settings[type][page][setting] =
									!isNaN(parseInt(input.value)) && input.value !== ""
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

		settings.customLinks = findAllElements("#customLinks > li:not(.input)", _preferences).map((link) => {
			return {
				newTab: link.find<HTMLInputElement>(".newTab").checked,
				preset: link.find<HTMLInputElement>(".preset").value,
				location: link.find<HTMLInputElement>(".location").value,
				name: link.find<HTMLInputElement>(".name").value,
				href: link.find<HTMLInputElement>(".href").value,
			};
		});
		settings.pages.chat.highlights = findAllElements("#chatHighlight > li:not(.input)", _preferences).map((highlight) => {
			return {
				name: highlight.find<HTMLInputElement>(".name").value,
				color: highlight.find<HTMLInputElement>(".color").value,
			};
		});
		settings.pages.chat.titleHighlights = findAllElements("#chatTitleHighlight > li:not(.input)", _preferences).map((highlight) => {
			return {
				title: highlight.find<HTMLInputElement>(".title").value,
				color: highlight.find<HTMLInputElement>(".color").value,
			};
		});
		settings.alliedFactions = findAllElements<HTMLInputElement>("#allyFactions input")
			.map((input) => {
				if (isNaN(parseInt(input.value))) return input.value.trim();
				else return parseInt(input.value.trim());
			})
			.filter((x) => {
				if (typeof x === "string") return x.trim() !== "";
				else return x;
			});
		settings.userAlias = {};
		for (const aliasRow of findAllElements<HTMLInputElement>("#userAlias > li", _preferences)) {
			if (aliasRow.find<HTMLInputElement>(".userID").value) {
				settings.userAlias[aliasRow.find<HTMLInputElement>(".userID").value] = {
					name: aliasRow.find<HTMLInputElement>(".name").value,
					alias: aliasRow.find<HTMLInputElement>(".alias").value,
				};
			}
		}

		settings.hideIcons = findAllElements("#hide-icons .icon.disabled > div", _preferences).map((icon) => icon.getAttribute("class"));
		settings.hideCasinoGames = findAllElements("#hide-casino-games span.disabled", _preferences).map((game) => game.getAttribute("name"));
		settings.hideStocks = findAllElements("#hide-stocks span.disabled", _preferences).map((stock) => stock.getAttribute("id"));
		settings.employeeInactivityWarning = findAllElements("#employeeInactivityWarning > .tabbed", _preferences)
			.map((warning) => {
				const days = warning.find<HTMLInputElement>("input[type='number']").value;

				return {
					color: warning.find<HTMLInputElement>("input[type='color']").value,
					days: !isNaN(parseInt(days)) && days !== "" ? parseInt(days) : null,
				};
			})
			.sort((first, second) => (first.days ?? 0) - (second.days ?? 0));
		settings.factionInactivityWarning = findAllElements("#factionInactivityWarning > .tabbed", _preferences)
			.map((warning) => {
				const days = warning.find<HTMLInputElement>("input[type='number']").value;

				return {
					color: warning.find<HTMLInputElement>("input[type='color']").value,
					days: !isNaN(parseInt(days)) && days !== "" ? parseInt(days) : null,
				};
			})
			.sort((first, second) => (first.days ?? 0) - (second.days ?? 0));
		settings.pages.attack.hideAttackButtons = findAllElements("#hide-attack-options span.disabled", _preferences).map((x) => x.getAttribute("value"));

		settings.apiUsage.comment = _preferences.find<HTMLInputElement>("#api_usage-comment").value;
		settings.apiUsage.delayEssential = parseInt(_preferences.find<HTMLInputElement>("#api_usage-essential").value);
		settings.apiUsage.delayBasic = parseInt(_preferences.find<HTMLInputElement>("#api_usage-basic").value);
		settings.apiUsage.delayStakeouts = parseInt(_preferences.find<HTMLInputElement>("#api_usage-stakeouts").value);
		for (const type of ["user"]) {
			for (const selection in settings.apiUsage[type]) {
				if (_preferences.find(`#api_usage-${type}_${selection}`))
					settings.apiUsage[type][selection] = (_preferences.find(`#api_usage-${type}_${selection}`) as HTMLInputElement).checked;
			}
		}

		for (const notificationType in settings.notifications.types) {
			if (notificationType === "stocks" || notificationType === "npcs") continue;

			let newValue: any;
			if (Array.isArray(settings.notifications.types[notificationType])) {
				newValue = _preferences
					.find<HTMLInputElement>(`#notification_type-${notificationType}[type="text"]`)
					.value.split(",")
					.filter((x) => x)
					.map((x) => (parseFloat(x).toString() === x ? parseFloat(x) : x));
			} else if (typeof settings.notifications.types[notificationType] === "boolean") {
				newValue = _preferences.find<HTMLInputElement>(`#notification_type-${notificationType}`).checked;
			} else {
				newValue = _preferences.find<HTMLInputElement>(`#notification_type-${notificationType}`).value;
			}
			settings.notifications.types[notificationType] = newValue;
		}
		settings.notifications.types.npcs = findAllElements("#npc-alerts > li", _preferences)
			.map((row) => {
				const level = row.find<HTMLInputElement>(".level").value;
				const minutes = row.find<HTMLInputElement>(".minutes").value;

				return {
					id: parseInt(row.dataset.id),
					level: !level || isNaN(parseInt(level)) ? ("" as const) : parseInt(level),
					minutes: !minutes || isNaN(parseInt(minutes)) ? ("" as const) : parseInt(minutes),
				};
			})
			.filter(({ level, minutes }) => level !== "" || minutes !== "");

		settings.notifications.tts = _preferences.find<HTMLInputElement>("#notification-tts").checked;
		settings.notifications.link = _preferences.find<HTMLInputElement>("#notification-link").checked;
		settings.notifications.requireInteraction = _preferences.find<HTMLInputElement>("#notification-requireInteraction").checked;
		settings.notifications.volume = parseInt(_preferences.find<HTMLInputElement>("#notification-volume").value);
		settings.notifications.sound = _preferences.find<HTMLInputElement>("#notification-sound").value;

		const newStorage = { settings };
		await ttStorage.set(newStorage);
		console.log("Settings updated!", newStorage);

		await ttStorage.change({
			api: {
				tornstats: { key: document.find<HTMLInputElement>("#external-tornstats-key").value },
				yata: { key: document.find<HTMLInputElement>("#external-yata-key").value },
				ffScouter: { key: document.find<HTMLInputElement>("#external-ffScouter-key").value },
			},
		});

		document.body.classList.remove("light", "dark");
		document.body.classList.add(getPageTheme());

		sendMessage("Settings saved.", true);
	}

	function requestOrigin(origin: string, event: MouseEvent) {
		const target = event.target as HTMLInputElement;
		if (!target.checked) return;

		if (!chrome.permissions) {
			target.checked = false;
			warnMissingPermissionAPI();
			return;
		}

		chrome.permissions.request({ origins: [origin] }, (granted) => {
			if (!granted) {
				sendMessage("Can't enable this without accepting the permission.", false);
				target.checked = false;
			}
		});
	}

	function searchPreferences() {
		const searchOverlay = document.find("#tt-search-overlay");
		document.find("#preferences-search").addEventListener("click", () => {
			searchOverlay.classList.remove("tt-hidden");
			searchOverlayInput.focus();
			search();
		});

		searchOverlay.find(".circle").addEventListener("click", () => {
			searchOverlay.find("#tt-search-list").innerHTML = "";
			searchOverlay.classList.add("tt-hidden");
		});
		const searchOverlayInput = searchOverlay.find<HTMLInputElement>("input");
		searchOverlay.find("#tt-search-button").addEventListener("click", search);
		searchOverlayInput.addEventListener("input", search);
		searchOverlayInput.addEventListener("keydown", (event) => {
			if (event.keyCode === 13) search();
		});

		const searchList = searchOverlay.find("#tt-search-list");

		async function search() {
			const searchFor = searchOverlayInput.value.toLowerCase().trim();
			if (!searchFor) return;
			findAllElements(".searched").forEach((option) => option.classList.remove("searched"));
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
								//div[contains(@class, 'header')]${
									(await checkDevice()).mobile ? "[not(contains(@class, 'no-mobile'))]" : ""
								}[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${searchFor}')]`,
				document,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
			searchList.innerHTML = "";
			if (searchResults.snapshotLength > 0) {
				for (let i = 0; i < searchResults.snapshotLength; i++) {
					const option = searchResults.snapshotItem(i) as Element;
					const name = option.textContent.replace("New!", "").replace("\n", "").trim();

					let keyword: string, section: string;
					if (option.getAttribute("for")) {
						keyword = "for";
						section = option.getAttribute("for");
					} else if (option.classList.contains("header")) {
						keyword = "name";
						section = option.parentElement.getAttribute("name");
					}

					searchList.appendChild(
						elementBuilder({
							type: "div",
							text: name,
							attributes: { [keyword]: section },
							children: [elementBuilder("br")],
						})
					);
					searchList.appendChild(elementBuilder("hr"));
				}
			} else {
				searchList.appendChild(
					elementBuilder({
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
			if ((event.target as Element).textContent.trim() !== "No Results") {
				const nameAttr = (event.target as Element).getAttribute("name");
				const forAttr = (event.target as Element).getAttribute("for");
				if (forAttr) {
					const optionFound = document.find(`#preferences [for="${forAttr}"]`);
					document.find(`#preferences nav [name="${optionFound.closest("section").getAttribute("name")}"]`).click();
					optionFound.parentElement.classList.add("searched");
				} else if (nameAttr) {
					for (const x of findAllElements(`#preferences [name="${nameAttr}"] .header`)) {
						if (x.textContent.trim() === (event.target as Element).textContent.trim()) {
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

	function enforceInputLimits(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (isNaN(value)) return;

		const newValue = Math.min(Math.max(parseInt(target.value), parseInt(target.min)), parseInt(target.max));
		if (value === newValue) return;

		target.value = newValue.toString();
	}

	function requestPermissions() {
		if (!chrome.permissions) return;

		const origins: string[] = [];

		for (const { id, origin } of [
			{ id: "external-tornstats", origin: FETCH_PLATFORMS.tornstats },
			{ id: "external-yata", origin: FETCH_PLATFORMS.yata },
			{ id: "external-prometheus", origin: FETCH_PLATFORMS.prometheus },
			{ id: "external-lzpt", origin: FETCH_PLATFORMS.lzpt },
			{ id: "external-tornw3b", origin: FETCH_PLATFORMS.tornw3b },
			{ id: "external-ffScouter", origin: FETCH_PLATFORMS.ffscouter },
		]) {
			if (!_preferences.find<HTMLInputElement>(`#${id}`)?.checked) continue;

			origins.push(origin);
		}

		const reviveProvider = _preferences.find<HTMLSelectElement>("#global-reviveProvider").value;
		if (reviveProvider) {
			const origin = REVIVE_PROVIDERS.find((p) => p.provider === reviveProvider)?.origin;

			if (origin) origins.push(origin);
		}

		chrome.permissions.contains({ origins }, (granted) => {
			if (granted) return;

			loadConfirmationPopup({
				title: "Permission Issue",
				message: "There are settings enabled that require permissions to be given, but those permissions are missing.",
			})
				.then(() => {
					chrome.permissions.request({ origins }, (granted) => {
						if (granted) return;

						sendMessage("These permissions are essential.", false);
					});
				})
				.catch(() => {
					sendMessage("These permissions are essential.", false);
				});
		});
	}

	function addSaveDialog() {
		if (isIframe) window.top.postMessage({ torntools: 1, show: 1 }, "*");
		else document.find("#saveSettingsBar").classList.remove("tt-hidden");
	}

	function revertSettings() {
		findAllElements("#hide-icons .disabled, #hide-casino-games .disabled, #hide-stocks .disabled", _preferences).forEach((x) =>
			x.classList.remove("disabled")
		);
		findAllElements("button.remove-icon-wrap", _preferences).forEach((x) => x.closest("li").remove());
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

	if (api.torn.key) _api.find<HTMLInputElement>("#api_key").value = api.torn.key;

	document.find("#update_api_key").addEventListener("click", async () => {
		const key = document.find<HTMLInputElement>("#api_key").value;

		checkAPIPermission(key)
			.then(({ access }) => {
				changeAPIKey(key)
					.then(() => {
						if (access) sendMessage("API Key updated", true);
						else sendMessage("Your API key is not the correct API level. This will affect a lot of features.", false);
						console.log("TT - Updated api key!");
					})
					.catch((error) => {
						sendMessage(error, false);
						console.log("TT - Couldn't update API key!", error);
						document.find<HTMLInputElement>("#api_key").value = api.torn.key || "";
					});
			})
			.catch((error) => {
				sendMessage(error, false);
				console.log("TT - Couldn't update API key!", error);
				document.find<HTMLInputElement>("#api_key").value = api.torn.key || "";
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
		const hourOfMinute = dropDecimals(parseInt(minute) / 60);
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
	findAllElements(".current-usage .averages > div.per-minute").forEach((usageDiv, index) => {
		const key = apiUsageLocations[index];
		usageDiv.textContent = `Average calls per minute: ${
			perMinuteUsage[key].count ? dropDecimals(perMinuteUsage[key].usage / perMinuteUsage[key].count) : 0
		}`;
	});
	findAllElements(".current-usage .averages > div.per-hour").forEach((usageDiv, index) => {
		const key = apiUsageLocations[index];
		usageDiv.innerText = `Average calls per hour: ${perHourUsage[key].count ? dropDecimals(perMinuteUsage[key].usage / perHourUsage[key].count) : 0}`;
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
	await ttUsage.refresh();

	(["userdata", "torndata", "stocks", "factiondata"] as const).forEach((section) => {
		document.find(`#update-${section}`).addEventListener("click", () =>
			chrome.runtime.sendMessage({ action: "forceUpdate", update: section } satisfies BackgroundMessage).then((result) => {
				console.log(`Manually fetched ${section}.`, result);
				sendMessage(`Fetched ${section}.`, true);
			})
		);
	});
	document.find("#reinitialize-timers").addEventListener("click", () =>
		chrome.runtime.sendMessage({ action: "reinitialize-timers" } satisfies BackgroundMessage).then((result) => {
			console.log("Manually reset background timers.", result);
			sendMessage("Reset background timers.", true);
		})
	);
	document.find("#clear-cache").addEventListener("click", () =>
		chrome.runtime.sendMessage({ action: "clear-cache" } satisfies BackgroundMessage).then((result) => {
			console.log("Manually cleared your cache.", result);
			sendMessage("Cleared cache.", true);
		})
	);

	updateUsage(usageChart, "Last 5");
	document.find(".current-usage .buttons .last-5").addEventListener("click", () => updateUsage(usageChart, "Last 5"));
	document.find(".current-usage .buttons .last-1hr").addEventListener("click", () => updateUsage(usageChart, "Last 1hr"));
	document.find(".current-usage .buttons .last-24hrs").addEventListener("click", () => updateUsage(usageChart, "Last 24hrs"));

	function updateUsage(usageChart: Chart, position: string) {
		let maxIndex: number, barThickness: number;
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
		let lastMinute: number | undefined;
		if (position === "Last 1hr") {
			lastMinute = parseInt(minutesArray.at(-1)) - 60;
			minutesArray = minutesArray.filter((minute) => parseInt(minute) >= lastMinute);
		}
		for (const minute of minutesArray) {
			const seconds = (parseInt(minute) - offset) * 60;
			const hour = dropDecimals((seconds % 86400) / 3600);
			usageChart.data.labels.push(`${toMultipleDigits(hour)}:${toMultipleDigits(dropDecimals((seconds % 3600) / 60))}`);
			usageChart.data.datasets[0].data[i] = ttUsage.usage[minute].torn ?? 0;
			usageChart.data.datasets[1].data[i] = ttUsage.usage[minute].tornstats ?? 0;
			usageChart.data.datasets[2].data[i] = ttUsage.usage[minute].yata ?? 0;
			i++;
		}
		i = null;
		usageChart.update(false);
	}
}

interface PopupTemplate {
	title: string;
	message: string;
	execute?(popup: Element, variables: { [key: string]: string }): void;
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
						elementBuilder({
							type: "li",
							children: [
								elementBuilder({ type: "input", id: "export-api-key", attributes: { type: "checkbox", name: "api_key" } }),
								elementBuilder({ type: "label", text: "api key", attributes: { for: "export-api-key" } }),
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

				if (api) popup.find(".export-keys").appendChild(elementBuilder({ type: "li", text: "api key" }));
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
	} satisfies { [template: string]: PopupTemplate };

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

				let data: ExportData;
				try {
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

				elementBuilder({
					type: "a",
					href: window.URL.createObjectURL(new Blob([data], { type: "octet/stream" })),
					attributes: { download: "torntools.json" },
				}).click();
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
			const result = event.target.result;
			if (typeof result !== "string") return;

			if (result.length > 5242880) {
				sendMessage("Maximum file size exceeded. (5MB)", false);
				return;
			}

			let data: any;
			try {
				data = JSON.parse(result);
			} catch (error) {
				console.error("Couldn't read the file!", error);
				sendMessage("Couldn't read the file!", false);
				return;
			}

			await importData(data);
		});
		reader.readAsText((event.target as HTMLInputElement).files[0]);
	});

	// Remote Sync
	loadSync();

	interface ExportData {
		user: false | { id: number; name: string };
		client: {
			version: string;
			space: number;
		};
		date: string;
		database: { [key: string]: any };
	}

	interface ExportError {
		error: true;
		message: string;
	}

	async function getExportData(api: boolean): Promise<ExportData> {
		const exportedKeys = ["version", "settings", "filters", "stakeouts", "notes", "quick"];
		if (api) exportedKeys.splice(0, 0, "api");

		const data: ExportData = {
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
			data.user = { id: userdata.profile.id, name: userdata.profile.name };
		}

		return data;
	}

	async function importData(data: ExportData) {
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
						await chrome.storage.sync.set(data);
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
				.then(async (data) => await importData(data as ExportData))
				.catch(() => {});
		});
		clearRemoteSync.addEventListener("click", () => {
			loadConfirmationPopup(POPUP_TEMPLATES.CLEAR)
				.then(async () => {
					await chrome.storage.sync.clear();

					sendMessage("Cleared sync data.", true);
					handleSyncData({ error: true, message: "No exported data." });
				})
				.catch(() => {});
		});

		new Promise<ExportData | ExportError>((resolve) => {
			chrome.storage.sync.get(null, (data) => {
				if (Object.keys(data).length && "database" in data) resolve(data as ExportData);
				else resolve({ error: true, message: "No exported data." });
			});
		}).then((data) => handleSyncData(data));

		function handleSyncData(data: ExportData | ExportError) {
			if (!("error" in data)) {
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

	// data corruption
	showCorruption("userdata-corruption", () => typeof userdata === "object" && Object.keys(userdata).length > 5);
	showCorruption("torndata-corruption", () => typeof torndata === "object" && typeof torndata.items === "object" && Object.keys(torndata.items).length > 5);
	showCorruption("stockdata-corruption", () => typeof stockdata === "object" && Object.keys(stockdata).length > 5);
	showCorruption("factiondata-corruption", () => typeof factiondata === "object" && typeof factiondata.access === "string");

	// disk space
	ttStorage.getSize().then((size) => (about.find(".disk-space").textContent = formatBytes(size)));

	showTeam();

	function showTeam() {
		const ourTeam = about.find(".our-team");

		for (const member of TEAM.filter((member) => member.core)) {
			const title = Array.isArray(member.title) ? member.title.join(" + ") : member.title;

			const card = elementBuilder({
				type: "div",
				class: "member-card",
				children: [
					elementBuilder({
						type: "a",
						class: "name",
						text: member.name,
						href: `https://www.torn.com/profiles.php?XID=${member.torn}`,
						attributes: { target: "_blank" },
					}),
					elementBuilder({ type: "span", class: "title", text: title }),
				],
			});

			if ("donations" in member) {
				const donations = elementBuilder({ type: "div", class: "donations" });

				for (const method of member.donations) {
					donations.appendChild(
						elementBuilder({
							type: "a",
							text: method.name,
							href: method.link,
							attributes: { target: "_blank" },
						})
					);
				}

				card.appendChild(elementBuilder("hr"));
				card.appendChild(donations);
			}

			ourTeam.appendChild(card);
		}
	}

	function showCorruption(id: string, checkFunction: () => boolean) {
		const element = about.find(`#${id}`);
		if (!element) return;

		const status = checkFunction();

		element.classList.remove("corruption-okay", "corruption-error");
		if (status) {
			element.textContent = "likely okay";
			element.classList.add("corruption-okay");
		} else {
			element.textContent = "possibly corrupted";
			element.classList.add("corruption-error");
		}
	}
}

interface FormatBytesOptions {
	decimals: number;
}

function formatBytes(bytes: number, partialOptions: Partial<FormatBytesOptions> = {}) {
	const options: FormatBytesOptions = {
		decimals: 2,
		...partialOptions,
	};

	if (bytes === 0) return "0 bytes";
	else if (bytes < 0) throw "Negative bytes are impossible";

	const unitExponent = 1024;
	const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const effectiveUnit = Math.floor(Math.log(bytes) / Math.log(unitExponent));

	const xBytes = bytes / Math.pow(unitExponent, effectiveUnit);

	return `${formatNumber(xBytes, { decimals: options.decimals })} ${units[effectiveUnit]}`;
}
