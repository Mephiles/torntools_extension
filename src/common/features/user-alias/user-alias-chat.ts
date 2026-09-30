import "./user-alias.css";
import { settings } from "@common/utils/data/database";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireChatsLoaded } from "@common/utils/functions/requires";
import {
	SELECTOR_CHAT_ROOT,
	SELECTOR_CHAT_V3__HEADER_NAME,
	SELECTOR_CHAT_V3__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__MINIMIZED_NAME,
} from "@common/utils/global/selectors/chatSelectors";
import { Feature } from "@features/feature";
import { getUserAliasById, getUserAliasByName } from "@features/user-alias/alias";

async function addListeners() {
	await requireChatsLoaded();

	addAliasTitle();
	addAliasMessage();

	addCustomListener(EVENT_CHANNELS.CHAT_OPENED, () => {
		addAliasTitle();
		addAliasMessage();
	});
	addCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, ({ message }) => addAliasMessage(message));
	addCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, () => {
		removeAlias();
		addAliasTitle();
		addAliasMessage();
	});
	addCustomListener(EVENT_CHANNELS.CHAT_RECONNECTED, () => {
		removeAlias();
		addAliasTitle();
		addAliasMessage();
	});
	addCustomListener(EVENT_CHANNELS.CHAT_CLOSED, addAliasTitle);
}

function addAliasTitle() {
	findAllElements([SELECTOR_CHAT_V3__MINIMIZED_NAME, SELECTOR_CHAT_V3__HEADER_NAME].join(", ")).forEach((chatHeader) => {
		const chatPlayerTitle = chatHeader.textContent;
		if (!chatPlayerTitle || ["Global", "Faction", "Company", "Trade", "People"].includes(chatPlayerTitle)) return;

		const alias = getUserAliasByName(chatPlayerTitle);
		if (!alias) return;

		originalValue(chatHeader);
		chatHeader.textContent = alias.alias;
	});
}

function addAliasMessage(message: Element | null = null) {
	if (!message) {
		settings.userAlias.forEach(({ userId, alias }) => {
			findAllElements(`${SELECTOR_CHAT_ROOT} a${SELECTOR_CHAT_V3__MESSAGE_SENDER}[href*='/profiles.php?XID=${userId}']`).forEach((profileLink) => {
				originalValue(profileLink);
				profileLink.firstChild!.textContent = `${alias}:`;
			});
		});
		return;
	}

	const profileLink = findElement<HTMLAnchorElement>("a[href*='/profiles.php?XID=']", message, true);
	if (!profileLink) return;

	const messageUserID = parseInt(profileLink.href.split("=")[1]);
	const alias = getUserAliasById(messageUserID);
	if (!alias) return;

	originalValue(profileLink);
	profileLink.firstChild!.textContent = `${alias.alias}:`;
}

function originalValue(element: HTMLElement) {
	const hasOriginal = "original" in element.dataset;
	if (hasOriginal) return element.dataset.original!;

	let original = element.textContent;
	if (original.endsWith(":")) original = original.slice(0, original.length - 1);

	element.dataset.original = original;

	return original;
}

function removeAlias() {
	findAllElements(`${SELECTOR_CHAT_ROOT} [data-original]`).forEach((element) => {
		if (element.dataset.original) element.firstChild!.textContent = element.dataset.original;
		delete element.dataset.original;
	});
	findAllElements(`${SELECTOR_CHAT_ROOT} [data-original-self]`).forEach((element) => {
		if (element.dataset.original) element.textContent = element.dataset.originalSelf!;
		delete element.dataset.original;
	});
}

export default class UserAliasChatFeature extends Feature {
	constructor() {
		super("User Alias - Chat", "chat");
	}

	override isEnabled() {
		return settings.userAlias.length > 0;
	}

	override async initialise() {
		await addListeners();
	}

	override reload() {
		removeAlias();
		addAliasTitle();
		addAliasMessage();
	}

	override storageKeys() {
		return ["settings.userAlias"];
	}
}
