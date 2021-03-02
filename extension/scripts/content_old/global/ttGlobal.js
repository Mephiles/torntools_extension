"use strict";

let highlights;
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
			new MutationObserver((mutations) => {
				for (let mutation of mutations) {
					for (let addedNode of mutation.addedNodes) {
						if (addedNode.classList && addedNode.classList.contains("^=chat-box_")) {
							setTimeout(() => {
								addChatUsernameAutocomplete();
							});
						} else if (addedNode.classList && addedNode.classList.contains("^=chat-box-content_")) {
							manipulateChats();
						}

						if (addedNode.classList && !addedNode.classList.contains("^=message_")) continue;

						applyHighlights(addedNode);
					}
				}
			}).observe(document.find("#chatRoot"), { childList: true, subtree: true });

			addChatUsernameAutocomplete();
			manipulateChats();

			document.find("#chatRoot").addEventListener("click", (event) => {
				if (!hasParent(event.target, { class: "^=chat-box_" })) return;

				addChatUsernameAutocomplete();
				manipulateChats();
			});
		})
		.catch((reason) => console.error("TT failed during loading chats.", reason));

	requireContent()
		.then(() => {
			new Promise(() => {
				if (settings.pages.global.hideLevelUpgrade) {
					for (let info of document.findAll(".info-msg-cont")) {
						if (!info.innerText.includes("Congratulations! You have enough experience to go up to level")) continue;

						info.classList.add("tt-level-upgrade");
					}
				}
			}).catch((error) => console.error("Couldn't hide the level upgrade notice!", error));

			showComputerLink().catch((reason) => console.error("TT failed while trying to show the computer link.", reason));
		})
		.catch((reason) => console.error("TT failed during loading content.", reason));
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

function manipulateChats() {
	for (let message of document.findAll("[class*='chat-box-content_'] [class*='overview_'] [class*='message_'] .tt-highlight")) {
		message.style.color = "unset";
		message.classList.remove("tt-highlight");
	}

	for (let message of document.findAll("[class*='chat-box-content_'] [class*='overview_'] [class*='message_']")) {
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

async function showComputerLink() {
	if (!isFlying() && !isAbroad()) return;
	if (!document.find("#top-page-links-list") || document.find("#top-page-links-list > .laptop, #top-page-links-list > .tt-computer")) return;
	if (!settings.apiUsage.user.inventory || !findItemsInObject(userdata.inventory, { ID: 61 }, { single: true })) return;

	document.find("#top-page-links-list").insertBefore(
		document.newElement({
			type: "a",
			class: "tt-computer clr cp fr",
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
