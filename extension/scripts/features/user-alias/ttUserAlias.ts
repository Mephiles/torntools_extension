(async () => {
	const feature = featureManager.registerFeature(
		"User Alias - Chat",
		"chat",
		() => Object.keys(settings.userAlias).length > 0,
		addListeners,
		liveReloadFunction,
		removeAlias,
		{
			storage: ["settings.userAlias"],
		},
		null,
		{ liveReload: true }
	);

	async function addListeners() {
		await requireElement("#chatRoot [class*='chat-note-button__']");

		addAliasTitle();
		addAliasMessage();

		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(() => {
			if (feature.enabled()) {
				addAliasTitle();
				addAliasMessage();
			}
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
			if (feature.enabled()) addAliasMessage(message);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REFRESHED].push(() => {
			if (!feature.enabled()) return;

			removeAlias();
			addAliasTitle();
			addAliasMessage();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_CLOSED].push(() => {
			if (!feature.enabled()) return;

			addAliasTitle();
		});
	}

	function liveReloadFunction(liveReload: boolean) {
		if (liveReload) {
			removeAlias();
			addAliasTitle();
			addAliasMessage();
		}
	}

	function addAliasTitle() {
		findAllElements("[class*='group-minimized-chat-box__'] > [class*='minimized-chat-box__']").forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || (chatPlayerTitle && ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle))) return;

			for (const alias of Object.values(settings.userAlias)) {
				if (chatPlayerTitle === alias.name.trim()) {
					const nameNode = chatHeader.find("[class*='minimized-chat-box__username-text__']");
					nameNode.dataset.original = nameNode.textContent;
					nameNode.firstChild.textContent = alias.alias;
				}
			}
		});
		findAllElements("[class*='chat-box__'] > [class*='chat-box-header__']").forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || (chatPlayerTitle && ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle))) return;

			for (const alias of Object.values(settings.userAlias)) {
				if (chatPlayerTitle === alias.name.trim()) {
					const nameNode = chatHeader.find("[class*='chat-box-header__name__']");
					nameNode.dataset.original = nameNode.textContent;
					nameNode.firstChild.textContent = alias.alias;
				}
			}
		});
	}

	function addAliasMessage(message: Element | null = null) {
		if (!message) {
			for (const [userID, alias] of Object.entries(settings.userAlias)) {
				findAllElements(`#chatRoot a[class*="chat-box-message__sender__"][href*='/profiles.php?XID=${userID}']`).forEach((profileLink) => {
					profileLink.dataset.original = profileLink.textContent;
					profileLink.firstChild.textContent = alias.alias;
				});
			}
		} else {
			const profileLink = message.find<HTMLAnchorElement>("a[href*='/profiles.php?XID=']");
			const messageUserID = profileLink.href.split("=")[1];
			if (messageUserID in settings.userAlias) {
				profileLink.dataset.original = profileLink.textContent;
				profileLink.firstChild.textContent = settings.userAlias[messageUserID].alias;
			}
		}
	}

	function removeAlias() {
		findAllElements(
			"#chatRoot [class*='group-minimized-chat-box__'] > [class*='minimized-chat-box__'] [class*='minimized-chat-box__username-text__'], #chatRoot [class*='chat-box__'] > [class*='chat-box-header__'] [class*='chat-box-header__name__']"
		).forEach((x) => {
			if (x.dataset.original) x.firstChild.textContent = x.dataset.original;
			delete x.dataset.original;
		});
	}
})();
