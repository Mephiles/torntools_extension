"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"User Alias - Chat",
		"chat",
		() => Object.keys(settings.userAlias).length,
		addListeners,
		liveReloadFunction,
		removeAlias,
		{
			storage: ["settings.userAlias"],
		},
		null,
		{ liveReload: true },
	);

	async function addListeners() {
		await requireElement("#chatRoot [class*='_chat-box-title_']");
		addAliasTitle();
		addAliasMessage();

		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_NEW].push(() => {
			if (feature.enabled()) addAliasTitle();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(() => {
			if (feature.enabled()) {
				addAliasTitle();
				addAliasMessage();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (feature.enabled()) addAliasMessage(message);
		});
	}

	function liveReloadFunction(liveReload) {
		if (liveReload) {
			removeAlias();
			addAliasTitle();
			addAliasMessage();
		}
	}

	function addAliasTitle() {
		document.findAll("#chatRoot [class*='_chat-box-title_']").forEach((chatTitle) => {
			const chatPlayerTitle = chatTitle.getAttribute("title").trim();
			if (!chatPlayerTitle || (chatPlayerTitle && ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle))) return;

			for (const alias of Object.values(settings.userAlias)) {
				if (chatPlayerTitle === alias.name.trim()) {
					const nameNode = chatTitle.find("[class*='name_']");
					nameNode.dataset.userName = nameNode.textContent;
					nameNode.textContent = alias.alias;
				}
			}
		});
	}

	function addAliasMessage(message = "") {
		if (!message) {
			for (const [userID, alias] of Object.entries(settings.userAlias)) {
				document.findAll(`#chatRoot [class*="message_"] a[href*='/profiles.php?XID=${userID}']`).forEach((profileLink) => {
					profileLink.dataset.userName = profileLink.textContent;
					profileLink.textContent = alias.alias + ": ";
				});
			}
		} else {
			const profileLink = message.find("a[href*='/profiles.php?XID=']");
			const messageUserID = profileLink.href.split("=")[1];
			if (messageUserID in settings.userAlias) {
				profileLink.dataset.userName = profileLink.textContent;
				profileLink.textContent = settings.userAlias[messageUserID].alias + ": ";
			}
		}
	}

	function removeAlias() {
		document
			.findAll("#chatRoot [class*='_message_'] a[href*='/profiles.php?XID='], #chatRoot [class*='_chat-box-title_'] [class*='name_']")
			.forEach((x) => {
				if (x.dataset.userName) x.textContent = x.dataset.userName;
				delete x.dataset.userName;
			});
	}
})();
