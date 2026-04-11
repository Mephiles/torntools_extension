import "./user-alias.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { findAllElements } from "@/utils/common/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireChatsLoaded } from "@/utils/common/functions/requires";
import { isChatV3 } from "@/utils/common/functions/torn";
import {
	SELECTOR_CHAT_ROOT,
	SELECTOR_CHAT_V2__CHAT_BOX,
	SELECTOR_CHAT_V2__CHAT_BOX_HEADER,
	SELECTOR_CHAT_V2__HEADER_NAME,
	SELECTOR_CHAT_V2__MESSAGE_SENDER,
	SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX,
	SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX_WRAPPER,
	SELECTOR_CHAT_V3__HEADER_NAME,
	SELECTOR_CHAT_V3__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__MINIMIZED_NAME,
} from "@/utils/common/global/selectors/chatSelectors";

async function addListeners() {
	await requireChatsLoaded();

	addAliasTitle();
	addAliasMessage();

	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_OPENED].push(() => {
		if (FEATURE_MANAGER.isEnabled(UserAliasChatFeature)) {
			addAliasTitle();
			addAliasMessage();
		}
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_MESSAGE].push(({ message }) => {
		if (FEATURE_MANAGER.isEnabled(UserAliasChatFeature)) addAliasMessage(message);
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_REFRESHED].push(() => {
		if (!FEATURE_MANAGER.isEnabled(UserAliasChatFeature)) return;

		removeAlias();
		addAliasTitle();
		addAliasMessage();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_RECONNECTED].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(UserAliasChatFeature)) return;

		removeAlias();
		addAliasTitle();
		addAliasMessage();
	});
	CUSTOM_LISTENERS[EVENT_CHANNELS.CHAT_CLOSED].push(() => {
		if (!FEATURE_MANAGER.isEnabled(UserAliasChatFeature)) return;

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
	if (isChatV3()) {
		findAllElements([SELECTOR_CHAT_V3__MINIMIZED_NAME, SELECTOR_CHAT_V3__HEADER_NAME].join(", ")).forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle)) return;

			Object.values(settings.userAlias)
				.filter((alias) => alias.name.trim() === chatPlayerTitle)
				.forEach((alias) => {
					chatHeader.dataset.originalSelf = chatHeader.textContent;
					chatHeader.textContent = alias.alias;
				});
		});
	} else {
		findAllElements(`${SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX_WRAPPER} > ${SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX}`).forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle)) return;

			for (const alias of Object.values(settings.userAlias)) {
				if (chatPlayerTitle === alias.name.trim()) {
					const nameNode = chatHeader.querySelector<HTMLElement>("[class*='minimized-chat-box__username-text__']");
					nameNode.dataset.original = nameNode.textContent;
					nameNode.firstChild.textContent = alias.alias;
				}
			}
		});
		findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX} > ${SELECTOR_CHAT_V2__CHAT_BOX_HEADER}`).forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle)) return;

			for (const alias of Object.values(settings.userAlias)) {
				if (chatPlayerTitle === alias.name.trim()) {
					const nameNode = chatHeader.querySelector<HTMLElement>(SELECTOR_CHAT_V2__HEADER_NAME);
					nameNode.dataset.original = nameNode.textContent;
					nameNode.firstChild.textContent = alias.alias;
				}
			}
		});
	}
}

function addAliasMessage(message: Element | null = null) {
	if (!message) {
		for (const [userID, alias] of Object.entries(settings.userAlias)) {
			findAllElements(
				[
					`${SELECTOR_CHAT_ROOT} a${SELECTOR_CHAT_V2__MESSAGE_SENDER}[href*='/profiles.php?XID=${userID}']`,
					`${SELECTOR_CHAT_ROOT} a${SELECTOR_CHAT_V3__MESSAGE_SENDER}[href*='/profiles.php?XID=${userID}']`,
				].join(", "),
			).forEach((profileLink) => {
				profileLink.dataset.original = profileLink.textContent;
				profileLink.firstChild.textContent = alias.alias;
			});
		}
	} else {
		const profileLink = message.querySelector<HTMLAnchorElement>("a[href*='/profiles.php?XID=']");
		const messageUserID = profileLink.href.split("=")[1];
		if (messageUserID in settings.userAlias) {
			profileLink.dataset.original = profileLink.textContent;
			profileLink.firstChild.textContent = settings.userAlias[messageUserID].alias;
		}
	}
}

function removeAlias() {
	findAllElements(`${SELECTOR_CHAT_ROOT} [data-original]`).forEach((element) => {
		if (element.dataset.original) element.firstChild.textContent = element.dataset.original;
		delete element.dataset.original;
	});
	findAllElements(`${SELECTOR_CHAT_ROOT} [data-original-self]`).forEach((element) => {
		if (element.dataset.original) element.textContent = element.dataset.originalSelf;
		delete element.dataset.original;
	});
}

export default class UserAliasChatFeature extends Feature {
	constructor() {
		super("User Alias - Chat", "chat");
	}

	isEnabled() {
		return Object.keys(settings.userAlias).length > 0;
	}

	async initialise() {
		await addListeners();
	}

	execute(liveReload?: boolean) {
		liveReloadFunction(liveReload);
	}

	cleanup() {
		removeAlias();
	}

	storageKeys() {
		return ["settings.userAlias"];
	}

	shouldLiveReload() {
		return true;
	}
}
