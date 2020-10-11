(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	storageListeners.settings.push(loadGlobal);

	loadGlobal();

	console.log("TT: Global - Script loaded.");
})();

function loadGlobal() {
	requireChatsLoaded()
		.then(() => {
			addChatSearch();
			// TODO - Block Zalgo in chats.

			document.addEventListener("click", (event) => {
				if (!hasParent(event.target, { class: "chat-box_Wjbn9" })) {
					return;
				}

				addChatSearch();
			});

			new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					for (let addedNode of mutation.addedNodes) {
						if (!addedNode.classList.contains("message_oP8oM")) continue;

						if (settings.pages.chat.searchChat) {
							const keyword = addedNode.parentElement.parentElement.parentElement.parentElement.find(".tt-chat-filter input").value;
							if (keyword) searchChat(addedNode, keyword);
						}
					}
				}
			}).observe(document.find("#chatRoot"), { childList: true, subtree: true });
		})
		.catch((reason) => console.error("TT failed during loading chats.", reason));
	requireSidebar()
		.then(() => {
			// TODO - Show update notice.
		})
		.catch((reason) => console.error("TT failed during loading sidebar.", reason));
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
