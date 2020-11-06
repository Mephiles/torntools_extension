import changelog from "../../changelog.js";

let initiatedPages = {};

(async () => {
	await showPage(getSearchParameters().get("page") || "changelog");

	for (let navigation of document.findAll("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", async () => {
			await showPage(navigation.getAttribute("to"));
		});
	}
})();

async function showPage(name) {
	window.history.replaceState("", "Title", "?page=" + name);

	for (let active of document.findAll("body > main.active, header nav.on-page > ul > li.active")) active.classList.remove("active");

	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");
	document.find(`#${name}`).classList.add("active");

	let setup = {
		changelog: setupChangelog,
		preferences: setupPreferences,
		api: setupAPIInfo,
		remote: setupRemote,
		about: setupAbout,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		await setup[name]();
		initiatedPages[name] = true;
	}
}

async function setupChangelog() {
	let content = document.find("#changelog > section");

	const contributorList = document.find("#changelog .contributors");
	for (let c in CONTRIBUTORS) {
		contributorList.appendChild(
			document.newElement({
				type: "div",
				class: `contributor ${c.toLowerCase()}`,
				html: `
					<span>
						<a href="https://www.torn.com/profiles.php?XID=${CONTRIBUTORS[c].id}" target="_blank">
							${CONTRIBUTORS[c].name} [${CONTRIBUTORS[c].id}]
						</a>
					</span>
				`,
			})
		);
	}

	for (let key in changelog) {
		const title = key.split(" - ")[1] ? " - " + key.split(" - ")[1] : "";
		const version = key.split(" - ")[0];

		let div = document.newElement({ type: "div", class: "parent" });

		// Heading
		let heading = document.newElement({ type: "div", class: "heading", text: version });
		let icon = document.newElement({ type: "i", class: "fas fa-chevron-down" });
		heading.appendChild(document.newElement({ type: "span", text: title }));
		heading.appendChild(icon);
		div.appendChild(heading);

		// Closeable
		let closeable = document.newElement({ type: "div", class: "closable hidden" });
		heading.addEventListener("click", () => {
			if (closeable.classList.contains("hidden")) closeable.classList.remove("hidden");
			else closeable.classList.add("hidden");

			rotateElement(icon, 180);
		});

		// Content
		for (let title in changelog[key]) {
			const parent = document.newElement({
				type: "div",
				class: "parent",
				children: [document.newElement({ type: "div", class: "heading", text: title })],
			});

			for (let item of changelog[key][title]) {
				let contributor;

				for (let c in CONTRIBUTORS) {
					if (!item.includes(`- ${c}`)) continue;

					contributor = c.toLowerCase();
					item = item.slice(0, item.indexOf(`- ${c}`));
					break;
				}

				parent.appendChild(
					document.newElement({
						type: "div",
						class: `child ${contributor ? `contributor ${contributor}` : ""}`,
						children: [document.newElement({ type: "span", text: item })],
					})
				);
			}

			closeable.appendChild(parent);
		}

		// Bottom border on last element
		if (version === "v3") closeable.appendChild(document.newElement("hr"));

		// Finish
		div.appendChild(closeable);
		content.appendChild(div);

		if (Object.keys(changelog).indexOf(version + title) === 0) {
			heading.click();
			heading.style.color = "red";
		}
	}

	// Ending words
	content.appendChild(document.newElement({ type: "p", text: "The rest is history..", style: { textAlign: "center" } }));

	await ttStorage.change({ version: { showNotice: false } });
}

async function setupPreferences() {
	await loadDatabase();

	const _preferences = document.find("#preferences");

	const showAdvancedIcon = document.find("#preferences-show_advanced");

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

	fillSettings();

	document.find("#addChatHighlight").addEventListener("click", () => {
		const inputRow = document.find("#chatHighlight .input");

		addChatHighlightRow(inputRow.find(".name").value, inputRow.find(".color").value);

		inputRow.find(".name").value = "";
		inputRow.find(".color").value = "#7ca900";
	});

	document.find("#saveSettings").addEventListener("click", async () => await saveSettings());
	document.find("#resetSettings").addEventListener("click", async () => await ttStorage.reset());

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
		for (let setting of ["updateNotice", "developer"]) {
			const checkbox = _preferences.find(`#${setting}`);
			if (!checkbox) continue;

			checkbox.checked = settings[setting];
		}

		_preferences.find(`input[name="defaultTab"][value="${settings.pages.popup.defaultTab}"]`).checked = true;
		_preferences.find(`input[name="formatDate"][value="${settings.formatting.date}"]`).checked = true;
		_preferences.find(`input[name="formatTime"][value="${settings.formatting.time}"]`).checked = true;

		for (let type of ["pages"]) {
			for (let page in settings[type]) {
				const isGlobalDisabled = settings[type][page].global === false;

				for (let setting in settings[type][page]) {
					const input = _preferences.find(`#${page}-${setting}`);
					if (!input) continue;

					if (setting === "global") {
						input.addEventListener("change", (event) => {
							const isGlobalDisabled = !event.target.checked;

							for (let setting in settings[type][page]) {
								if (setting === "global") continue;

								const input = _preferences.find(`#${page}-${setting}`);
								if (!input) continue;

								if (isGlobalDisabled) input.createAttribute("disabled");
								else input.removeAttribute("disabled");
							}
						});
					} else if (isGlobalDisabled) input.createAttribute("disabled");

					const value = settings[type][page][setting];
					if (input.tagName === "INPUT") {
						const inputType = input.getAttribute("type");

						if (inputType === "checkbox") input.checked = value;
						else input.value = value;
					}
				}
			}
		}

		for (let highlight of settings.pages.chat.highlights) {
			addChatHighlightRow(highlight.name, highlight.color);
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
				document.newElement({ type: "input", class: "name", value: name, attributes: { type: "text" } }),
				document.newElement({ type: "input", class: "color", value: color, attributes: { type: "color" } }),
				deleteIcon,
			],
		});

		deleteIcon.addEventListener("click", () => newRow.remove());

		document.find("#chatHighlight").insertBefore(newRow, document.find("#chatHighlight .input"));
	}

	async function saveSettings() {
		for (let setting of ["updateNotice", "developer"]) {
			const checkbox = _preferences.find(`#${setting}`);
			if (!checkbox) continue;

			settings[setting] = checkbox.checked;
		}

		settings.pages.popup.defaultTab = _preferences.find(`input[name="defaultTab"]:checked`).value;
		settings.formatting.date = _preferences.find(`input[name="formatDate"]:checked`).value;
		settings.formatting.time = _preferences.find(`input[name="formatTime"]:checked`).value;

		for (let type of ["pages"]) {
			for (let page in settings[type]) {
				for (let setting in settings[type][page]) {
					const input = _preferences.find(`#${page}-${setting}`);
					if (!input) continue;

					if (input.tagName === "INPUT") {
						const inputType = input.getAttribute("type");

						if (inputType === "checkbox") settings[type][page][setting] = input.checked;
						else settings[type][page][setting] = input.value;
					}
				}
			}
		}

		settings.pages.chat.highlights = [...document.findAll("#chatHighlight > li:not(.input)")].map((highlight) => {
			return {
				name: highlight.find(".name").value,
				color: highlight.find(".color").value,
			};
		});

		const newStorage = { settings };
		await ttStorage.set(newStorage);
		console.log("Settings updated!", newStorage);
	}
}

async function setupAPIInfo() {
	await loadDatabase();

	const _api = document.find("#api");

	if (api.torn.key) {
		_api.find("#api_key").value = api.torn.key;
	}
	document.find("#update_api_key").addEventListener("click", async () => {
		changeAPIKey(document.find("#api_key").value)
			.then(() => {
				// FIXME - Better message handling.
				console.log("TT - Updated api key!");
			})
			.catch((error) => {
				// FIXME - Better error handling.
				console.log("TT - Couldn't update API key!", error);
				document.find("#api_key").value = "";
			});
	});
}

function setupRemote() {}

function setupAbout() {}
