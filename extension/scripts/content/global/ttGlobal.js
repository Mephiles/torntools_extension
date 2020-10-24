let highlights;

(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	storageListeners.settings.push(loadGlobal);
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

	requireChatsLoaded()
		.then(() => {
			addChatSearch();
			manipulateChats();

			document.addEventListener("click", (event) => {
				if (!hasParent(event.target, { class: "chat-box_Wjbn9" })) {
					return;
				}

				manipulateChats();
				addChatSearch();
			});

			new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					for (let addedNode of mutation.addedNodes) {
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
		})
		.catch((reason) => console.error("TT failed during loading chats.", reason));

	requireSidebar()
		.then(async () => {
			await showUpdateNotice();
		})
		.catch((reason) => console.error("TT failed during loading sidebar.", reason));

	requireContent().then(() => {
		if (settings.pages.global.hideLevelUpgrade) {
			for (let info of document.findAll(".info-msg-cont")) {
				if (!info.innerText.includes("Congratulations! You have enough experience to go up to level")) continue;

				info.classList.add("tt-level-upgrade");
			}
		}
	});

	// TODO - Display custom developer console.
	// TODO - Show Nuke Central Hospital revive request.
	// TODO - Show last action in the mini profiles.
}

function requireChatsLoaded() {
	return requireElement(".overview_1MoPG");
}

function addChatSearch() {
	if (settings.pages.chat.searchChat) {
		for (let chat of document.findAll(".chat-active_1Sufk")) {
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
	if (!message) return;
	if (!highlights.length) return;

	const sender = simplify(message.find("a").innerText);
	const words = message.find("span").innerText.split(" ").map(simplify);

	const senderHighlights = highlights.filter((highlight) => highlight.name === sender);
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
		return text.toLowerCase().trim().replaceAll([".", "?", ":", "!", '"', "'", ";", "`", ","], "");
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
