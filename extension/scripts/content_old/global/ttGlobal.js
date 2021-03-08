"use strict";

let initiatedIconMoving = false;
let mouseX, mouseY;

(async () => {
	await loadDatabase();
	console.log("TT: Global - Loading script. ");

	storageListeners.settings.push(loadGlobal);

	loadGlobal();
	loadGlobalOnce();

	console.log("TT: Global - Script loaded.");
})();

function loadGlobal() {
	requireChatsLoaded()
		.then(() => {
			new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					for (let addedNode of mutation.addedNodes) {
						if (addedNode.classList && addedNode.classList.contains("^=chat-box_")) {
							setTimeout(() => {
								addChatUsernameAutocomplete();
							});
						}
					}
				}
			}).observe(document.find("#chatRoot"), { childList: true, subtree: true });

			addChatUsernameAutocomplete();

			document.find("#chatRoot").addEventListener("click", (event) => {
				if (!hasParent(event.target, { class: "^=chat-box_" })) return;

				addChatUsernameAutocomplete();
			});
		})
		.catch((reason) => console.error("TT failed during loading chats.", reason));
}

function loadGlobalOnce() {
	document.body.appendChild(document.newElement({ type: "div", class: "tt-overlay hidden" }));
	setInterval(() => {
		for (let countdown of document.findAll(".countdown.automatic[data-seconds]")) {
			const seconds = parseInt(countdown.dataset.seconds) - 1;

			if (seconds <= 0) {
				countdown.removeAttribute("seconds-down");
				countdown.innerText = "Ready";
				continue;
			}

			countdown.innerText = formatTime({ seconds }, JSON.parse(countdown.dataset.timeSettings));
			// noinspection JSValidateTypes
			countdown.dataset.seconds = seconds;
		}
	}, 1000);

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
		document.addEventListener("mousemove", (event) => {
			mouseX = event.x;
			mouseY = event.y;
		});
	}
}

function showMiniprofileInformation(information) {
	const miniProfile = document.find("#profile-mini-root .mini-profile-wrapper");

	const lastAction = formatTime({ seconds: information.user.lastAction.seconds }, { type: "wordTimer", showDays: true });

	requireElement("div[class*='-profile-mini-_userProfileWrapper']", { parent: miniProfile }).then(() => {
		const oldHeight = miniProfile.clientHeight;
		const data = document.newElement({
			type: "div",
			class: "tt-mini-data",
			children: [document.newElement({ type: "strong", text: "Last Action: " }), document.newElement({ type: "span", text: lastAction })],
		});
		miniProfile.find("div[class*='-profile-mini-_userProfileWrapper']").appendChild(data);

		const profileBounding = miniProfile.getBoundingClientRect();
		if (profileBounding.top < mouseY) {
			const profileY = parseInt(miniProfile.style.top.replace("px", ""));
			const heightDifference = miniProfile.clientHeight - oldHeight;

			miniProfile.style.top = `${profileY - heightDifference}px`;
		}
	});
}

function addChatUsernameAutocomplete() {
	if (!settings.pages.chat.completeUsernames) return;

	for (let chat of document.findAll("[class*='chat-box_']")) {
		const messageList = chat.find("[class*='overview_']");
		if (!messageList) continue;

		const textarea = chat.find("[class*='chat-box-textarea_']");
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

			const matchedUsernames = Array.from(messageList.findAll("[class*='message_'] > a"))
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
