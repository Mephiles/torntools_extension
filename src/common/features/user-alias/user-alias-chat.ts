import "./user-alias.css";
import { settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/dom";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireChatsLoaded } from "@common/utils/functions/requires";
import { isChatV3 } from "@common/utils/functions/torn";
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
} from "@common/utils/global/selectors/chatSelectors";
import { FEATURE_MANAGER, Feature } from "@extension/context/feature-manager";
import { getUserAliasById, getUserAliasByName } from "@features/user-alias/alias";

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

			const alias = getUserAliasByName(chatPlayerTitle);
			if (!alias) return;

			chatHeader.dataset.originalSelf = chatHeader.textContent;
			chatHeader.textContent = alias.alias;
		});
	} else {
		findAllElements(`${SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX_WRAPPER} > ${SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX}`).forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle)) return;

			const alias = getUserAliasByName(chatPlayerTitle);
			if (!alias) return;

			const nameNode = chatHeader.querySelector<HTMLElement>("[class*='minimized-chat-box__username-text__']");
			nameNode.dataset.original = nameNode.textContent;
			nameNode.firstChild.textContent = alias.alias;
		});
		findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX} > ${SELECTOR_CHAT_V2__CHAT_BOX_HEADER}`).forEach((chatHeader) => {
			const chatPlayerTitle = chatHeader.textContent;
			if (!chatPlayerTitle || ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle)) return;

			const alias = getUserAliasByName(chatPlayerTitle);
			if (!alias) return;

			const nameNode = chatHeader.querySelector<HTMLElement>(SELECTOR_CHAT_V2__HEADER_NAME);
			nameNode.dataset.original = nameNode.textContent;
			nameNode.firstChild.textContent = alias.alias;
		});
	}
}

function addAliasMessage(message: Element | null = null) {
	if (!message) {
		settings.userAlias.forEach(({ userId, alias }) => {
			findAllElements(
				[
					`${SELECTOR_CHAT_ROOT} a${SELECTOR_CHAT_V2__MESSAGE_SENDER}[href*='/profiles.php?XID=${userId}']`,
					`${SELECTOR_CHAT_ROOT} a${SELECTOR_CHAT_V3__MESSAGE_SENDER}[href*='/profiles.php?XID=${userId}']`,
				].join(", "),
			).forEach((profileLink) => {
				profileLink.dataset.original = profileLink.textContent;
				profileLink.firstChild.textContent = alias;
			});
		});
		return;
	}

	const profileLink = message.querySelector<HTMLAnchorElement>("a[href*='/profiles.php?XID=']");
	if (!profileLink) return;

	const messageUserID = parseInt(profileLink.href.split("=")[1]);
	const alias = getUserAliasById(messageUserID);
	if (!alias) return;

	profileLink.dataset.original = profileLink.textContent;
	profileLink.firstChild.textContent = alias.alias;
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
		return settings.userAlias.length > 0;
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
