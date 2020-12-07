"use strict";

let highlights;
let initiatedIconMoving = false;

(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	storageListeners.settings.push(loadGlobal);
	storageListeners.settings.push((oldSettings) => {
		if (oldSettings.themes.containers !== settings.themes.containers) {
			for (let container of document.findAll(`.${THEMES[oldSettings.themes.containers].containerClass}`)) {
				container.classList.remove(THEMES[oldSettings.themes.containers].containerClass);
				container.classList.add(THEMES[settings.themes.containers].containerClass);
			}
		}
	});
	storageListeners.version.push(() => {
		requireSidebar()
			.then(async () => {
				await showUpdateNotice();
			})
			.catch((reason) => console.error("TT failed during loading sidebar.", reason));
	});

	loadGlobal();

	console.log("TT: Global - Script loaded.");
})();

function loadGlobal() {
	highlights = settings.pages.chat.highlights.map((highlight) => {
		let { name, color } = highlight;

		for (let placeholder of HIGHLIGHT_PLACEHOLDERS) {
			if (name !== placeholder.name) continue;

			name = placeholder.value();
			break;
		}

		return { name: name.toLowerCase(), color: color.length === 7 ? `${color}6e` : color, senderColor: color };
	});

	if (settings.pages.global.miniProfileLastAction) {
		addFetchListener((event) => {
			if (!event.detail) return;
			const { page, json, fetch } = event.detail;

			const params = new URL(fetch.url).searchParams;
			const step = params.get("step");

			if (page === "profiles" && step === "getUserNameContextMenu") {
				showMiniprofileInformation(json);
			}
		});
	}

	requireChatsLoaded()
		.then(() => {
			new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					for (let addedNode of mutation.addedNodes) {
						if (addedNode.classList && addedNode.classList.contains("chat-box_Wjbn9")) {
							setTimeout(() => {
								addChatSearch();
								addChatUsernameAutocomplete();
								addChatColoring();
							});
						} else if (addedNode.classList && addedNode.classList.contains("chat-box-content_2C5UJ")) {
							manipulateChats();
						}

						if (addedNode.classList && !addedNode.classList.contains("message_oP8oM")) continue;

						if (settings.pages.chat.searchChat) {
							const parent = findParent(addedNode, { class: "chat-box_Wjbn9" });
							if (!parent) continue;

							const input = parent.find(".tt-chat-filter input");
							if (!input) continue;

							const keyword = input.value;
							if (keyword) searchChat(addedNode, keyword);
						}
						applyHighlights(addedNode);
					}
				}
			}).observe(document.find("#chatRoot"), { childList: true, subtree: true });

			addChatSearch();
			addChatUsernameAutocomplete();
			addChatColoring();
			manipulateChats();

			document.addEventListener("click", (event) => {
				if (!hasParent(event.target, { class: "chat-box_Wjbn9" })) {
					return;
				}

				manipulateChats();
				addChatSearch();
				addChatUsernameAutocomplete();
				manipulateChats();
			});
		})
		.catch((reason) => console.error("TT failed during loading chats.", reason));

	requireSidebar()
		.then(async () => {
			await showUpdateNotice();

			if (!initiatedIconMoving) {
				moveIcons(new MutationObserver((mutations, observer) => moveIcons(observer)));
				initiatedIconMoving = true;
			}
		})
		.catch((reason) => console.error("TT failed during loading sidebar.", reason));

	requireContent()
		.then(() => {
			if (settings.pages.global.hideLevelUpgrade) {
				for (let info of document.findAll(".info-msg-cont")) {
					if (!info.innerText.includes("Congratulations! You have enough experience to go up to level")) continue;

					info.classList.add("tt-level-upgrade");
				}
			}

			showComputerLink().catch((reason) => console.error("TT failed while trying to show the computer link.", reason));
		})
		.catch((reason) => console.error("TT failed during loading content.", reason));

	// TODO - Show Nuke Central Hospital revive request.
}

function requireChatsLoaded() {
	return requireElement(".overview_1MoPG");
}

function addChatSearch() {
	if (settings.pages.chat.searchChat) {
		for (let chat of document.findAll(".chat-active_1Sufk:not(.chat-box-settings_Ogzjk)")) {
			if (chat.find(".tt-chat-filter")) continue;

			const id = `search_${chat.find(".chat-box-title_out6E").getAttribute("title")}`;

			let wrap = document.newElement({ type: "div", class: "tt-chat-filter" });
			let label = document.newElement({ type: "label", text: "Search:", attributes: { for: id } });
			let searchInput = document.newElement({ type: "input", id });

			wrap.appendChild(label);
			wrap.appendChild(searchInput);

			// Filtering process
			searchInput.addEventListener("input", () => {
				const keyword = searchInput.value.toLowerCase();

				for (let message of chat.findAll(".overview_1MoPG .message_oP8oM")) {
					searchChat(message, keyword);
				}

				if (!keyword) {
					const viewport = chat.find(".viewport_1F0WI");
					viewport.scrollTop = viewport.scrollHeight;
				}
			});

			const chatInput = chat.find(".chat-box-input_1SBQR");
			chatInput.insertBefore(wrap, chatInput.firstElementChild);
			chatInput.classList.add("tt-modified");
		}
	} else {
		for (let chat of document.findAll(".chat-active_1Sufk")) {
			for (let message of document.findAll(".overview_1MoPG .message_oP8oM")) {
				message.classList.remove("hidden");
			}
			const viewport = chat.find(".viewport_1F0WI");
			viewport.scrollTop = viewport.scrollHeight;

			const searchInput = document.find(".tt-chat-filter");
			if (searchInput) searchInput.remove();
		}
	}
}

function searchChat(message, keyword) {
	if (keyword && !message.find("span").innerText.toLowerCase().includes(keyword)) {
		message.classList.add("hidden");
	} else {
		message.classList.remove("hidden");
	}
}

function manipulateChats() {
	for (let message of document.findAll(".chat-box-content_2C5UJ .overview_1MoPG .message_oP8oM .tt-highlight")) {
		message.style.color = "unset";
		message.classList.remove("tt-highlight");
	}

	for (let message of document.findAll(".chat-box-content_2C5UJ .overview_1MoPG .message_oP8oM")) {
		applyHighlights(message);
	}
}

function applyHighlights(message) {
	if (!message || typeof message.find !== "function") return;
	if (!highlights.length) return;

	const sender = simplify(message.find("a").innerText).slice(0, -1);
	const words = message.find("span").innerText.split(" ").map(simplify);

	const senderHighlights = highlights.filter(({ name }) => name === sender);
	if (senderHighlights.length) {
		message.find("a").style.color = senderHighlights[0].senderColor;
		message.find("a").classList.add("tt-highlight");
	}

	for (let { name, color } of highlights) {
		if (!words.includes(name)) continue;

		message.find("span").parentElement.style.backgroundColor = color;
		message.find("span").classList.add("tt-highlight");
		break;
	}

	function simplify(text) {
		return text.toLowerCase().trim();
	}
}

async function showUpdateNotice() {
	await checkMobile();
	if (mobile) return;

	const notice = document.find("#ttUpdateNotice");

	if (settings.updateNotice && version.showNotice) {
		if (notice) return;

		const currentVersion = chrome.runtime.getManifest().version;

		const parent = document.find("h2=Areas").nextElementSibling;
		parent.insertBefore(
			document.newElement({
				type: "div",
				class: "area-desktop___2YU-q",
				id: "ttUpdateNotice",
				children: [
					document.newElement({
						type: "div",
						class: "area-row___34mEZ",
						children: [
							document.newElement({
								type: "a",
								class: "desktopLink___2dcWC",
								href: chrome.runtime.getURL("/pages/settings/settings.html"),
								attributes: { target: "_blank" },
								children: [document.newElement({ type: "span", text: `TornTools updated: ${currentVersion}` })],
							}),
						],
					}),
				],
			}),
			parent.firstElementChild
		);
	} else {
		if (!notice) return;

		notice.remove();
	}
}

function showMiniprofileInformation(information) {
	const miniProfile = document.find("#profile-mini-root .mini-profile-wrapper");

	const lastAction = formatTime({ seconds: information.user.lastAction.seconds }, { type: "wordTimer", showDays: true });

	requireElement(".-profile-mini-_userProfileWrapper___39cKq", { parent: miniProfile }).then(() => {
		const data = document.newElement({
			type: "div",
			class: "tt-mini-data",
			children: [document.newElement({ type: "strong", text: "Last Action: " }), document.newElement({ type: "span", text: lastAction })],
		});
		miniProfile.find(".-profile-mini-_userProfileWrapper___39cKq").appendChild(data);

		miniProfile.style.top = `${parseInt(miniProfile.style.top.replace("px", "")) - data.clientHeight + 1}px`;
	});
}

function addChatUsernameAutocomplete() {
	if (!settings.pages.chat.completeUsernames) return;

	for (let chat of document.findAll(".chat-box_Wjbn9")) {
		const messageList = chat.find(".overview_1MoPG");
		if (!messageList) continue;

		const textarea = chat.find(".chat-box-textarea_2V28W");
		if (!textarea || textarea.classList.contains("tt-chat-autocomplete")) continue;
		textarea.classList.add("tt-chat-autocomplete");

		let currentUsername, currentSearchValue;
		textarea.addEventListener("keydown", (event) => {
			if (event.key !== "Tab") {
				currentUsername = null;
				currentSearchValue = null;
				return;
			}
			event.preventDefault();

			const valueToCursor = textarea.value.substr(0, textarea.selectionStart);
			const searchValueMatch = valueToCursor.match(/([^A-Za-z0-9\-_]?)([A-Za-z0-9\-_]*)$/);

			if (currentSearchValue === null) currentSearchValue = searchValueMatch[2].toLowerCase();

			const matchedUsernames = Array.from(messageList.findAll(".message_oP8oM > a"))
				.map((message) => message.innerText.slice(0, -2))
				.filter((username, index, array) => array.indexOf(username) === index && username.toLowerCase().includes(currentSearchValue))
				.sort();
			if (!matchedUsernames.length) return;

			let index = currentUsername !== null ? matchedUsernames.indexOf(currentUsername) + 1 : 0;
			if (index > matchedUsernames.length - 1) index = 0;

			currentUsername = matchedUsernames[index];

			let valueStart = searchValueMatch.index + searchValueMatch[1].length;
			textarea.value = textarea.value.substring(0, valueStart) + currentUsername + textarea.value.substring(valueToCursor.length, textarea.value.length);

			let selectionIndex = valueStart + currentUsername.length;
			textarea.setSelectionRange(selectionIndex, selectionIndex);
		});
	}
}

function addChatColoring() {
	[...document.findAll(".chat-colored")].forEach((chat) => chat.classList.remove("chat-colored"));

	settings.pages.chat.titleHighlights
		.map((entry) => {
			return {
				colors: CHAT_TITLE_COLORS[entry.color],
				element: findParent(document.find(`.chat-box-title_out6E[title="${entry.title}"]`), { class: "chat-box-head_1qkkk" }),
			};
		})
		.filter((entry) => entry.colors && entry.colors.length === 2 && entry.element)
		.forEach((entry) => {
			entry.element.classList.add("chat-colored");
			entry.element.style.setProperty("--highlight-color__1", entry.colors[0]);
			entry.element.style.setProperty("--highlight-color__2", entry.colors[1]);
		});
}

async function showComputerLink() {
	if (!isFlying() && !isAbroad()) return;
	if (!document.find("#top-page-links-list") || document.find("#top-page-links-list > .laptop, #top-page-links-list > .tt-computer")) return;
	if (!settings.apiUsage.user.inventory || !findItemsInObject(userdata.inventory, { ID: 61 }, { single: true })) return;

	document.find("#top-page-links-list").insertBefore(
		document.newElement({
			type: "a",
			class: "tt-computer t-clear c-pointer right",
			html: `
				<span class="icon-wrap svg-icon-wrap">
					<span class="link-icon-svg laptop ">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16">
							<defs>
								<style>.cls-1{opacity:0.35;}.cls-2{fill:#fff;}.cls-3{fill:#777;}</style>
							</defs>
							<g>
								<g id="icons">
									<g class="cls-1">
										<path class="cls-2" d="M0,1,1,5H17l1-4ZM15.6,6H2.4A1.4,1.4,0,0,0,1,7.4v7.2A1.4,1.4,0,0,0,2.4,16H15.6A1.4,1.4,0,0,0,17,14.6V7.4A1.4,1.4,0,0,0,15.6,6ZM10,7h2V9H10Zm3,3v2H11V10ZM7,7H9V9H7Zm3,3v2H8V10ZM4,7H6V9H4Zm3,3v2H5V10ZM2,7H3V9H2Zm0,3H4v2H2Zm1,5H2V13H3Zm11,0H4V13H14Zm2,0H15V13h1Zm0-3H14V10h2Zm0-3H13V7h3Z"></path>
									</g>
									<path class="cls-3" d="M0,0,1,4H17l1-4ZM15.6,5H2.4A1.4,1.4,0,0,0,1,6.4v7.2A1.4,1.4,0,0,0,2.4,15H15.6A1.4,1.4,0,0,0,17,13.6V6.4A1.4,1.4,0,0,0,15.6,5ZM10,6h2V8H10Zm3,3v2H11V9ZM7,6H9V8H7Zm3,3v2H8V9ZM4,6H6V8H4ZM7,9v2H5V9ZM2,6H3V8H2ZM2,9H4v2H2Zm1,5H2V12H3Zm11,0H4V12H14Zm2,0H15V12h1Zm0-3H14V9h2Zm0-3H13V6h3Z"></path>
								</g>
							</g>
						</svg>
					</span>
				</span>
				<span id="pc">Computer</span>
			`,
			attributes: {
				role: "button",
				"aria-labelledby": "computer",
				href: "pc.php",
			},
		}),
		document.find("#top-page-links-list > .events")
	);
}

function moveIcons(observer) {
	observer.disconnect();

	for (let icon of document.findAll("#sidebarroot .status-icons___1SnOI > li")) {
		if (!settings.hideIcons.includes(icon.getAttribute("class").split("_")[0])) continue;

		icon.parentElement.appendChild(icon);
	}
	observer.observe(document.find("#sidebarroot .status-icons___1SnOI"), { childList: true, attributes: true });
}
