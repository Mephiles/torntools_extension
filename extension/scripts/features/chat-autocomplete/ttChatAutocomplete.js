"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return;

	const feature = featureManager.registerFeature(
		"Chat Autocomplete",
		"chat",
		() => settings.pages.chat.completeUsernames,
		initialiseAutocomplete,
		readSettings,
		null,
		{
			storage: ["settings.pages.chat.completeUsernames"],
		},
		null
	);

	function initialiseAutocomplete() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(({ chat }) => {
			if (!feature.enabled()) return;

			addAutocomplete(chat);
		});
	}

	async function readSettings() {
		await requireChatsLoaded();

		for (const chat of document.findAll(
			"[class*='group-chat-box__chat-box-wrapper__'] [class*='chat-box__'], #chatRoot [class*='item___'][style*='z-index']"
		)) {
			addAutocomplete(chat);
		}
	}

	function addAutocomplete(chat) {
		const messages = chat.findAll("[class*='chat-box-body__'] [class*='chat-box-message__box__'], [class*='scrollContainer___'] [class*='box___']");
		if (!messages.length) return;

		const textarea = chat.find("textarea:not(.tt-chat-autocomplete)");
		if (!textarea) return;
		textarea.classList.add("tt-chat-autocomplete");

		let currentUsername, currentSearchValue;
		textarea.addEventListener("keydown", (event) => {
			if (event.key !== "Tab") {
				currentUsername = null;
				currentSearchValue = null;
				return;
			}
			event.preventDefault();

			const valueBeforeCursor = textarea.value.substr(0, textarea.selectionStart);
			const searchValueMatch = valueBeforeCursor.match(/([^A-Za-z\d\-_]?)([A-Za-z\d\-_]*)$/);

			if (currentSearchValue === null) currentSearchValue = searchValueMatch[2].toLowerCase();

			const matchedUsernames = [...chat.findAll("[class*='chat-box-message__sender__'], [class*='sender___']")]
				.map((message) => message.textContent.split(":")[0])
				.filter((username, index, array) => array.indexOf(username) === index && username.toLowerCase().startsWith(currentSearchValue))
				.sort();
			if (!matchedUsernames.length) return;

			let index = currentUsername !== null ? matchedUsernames.indexOf(currentUsername) + 1 : 0;
			if (index > matchedUsernames.length - 1) index = 0;

			currentUsername = matchedUsernames[index];

			const valueStart = searchValueMatch.index + searchValueMatch[1].length;
			updateReactInput(
				textarea,
				textarea.value.substring(0, valueStart) + currentUsername + textarea.value.substring(valueBeforeCursor.length, textarea.value.length),
				{ version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT }
			);

			const selectionIndex = valueStart + currentUsername.length;
			textarea.setSelectionRange(selectionIndex, selectionIndex);
		});
	}
})();
