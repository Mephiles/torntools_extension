import "./search-chat.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireChatsLoaded } from "@common/utils/functions/requires";
import {
	SELECTOR_CHAT_ROOT,
	SELECTOR_CHAT_V2__CHAT_BOX_BODY,
	SELECTOR_CHAT_V2__MESSAGE_BOX,
	SELECTOR_CHAT_V2__MESSAGE_SENDER,
	SELECTOR_CHAT_V3__BOX,
	SELECTOR_CHAT_V3__BOX_SCROLLER,
	SELECTOR_CHAT_V3__MESSAGE,
	SELECTOR_CHAT_V3__MESSAGE_CONTENT,
	SELECTOR_CHAT_V3__MESSAGE_SENDER,
} from "@common/utils/global/selectors/chatSelectors";
import { Feature } from "@features/feature";

function initialiseSearchChat() {
	addCustomListener(EVENT_CHANNELS.CHAT_OPENED, ({ chat }) => {
		if (!FEATURE_MANAGER.isEnabled(SearchChatFeature)) return;

		addChatSearch(chat);
	});
	addCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, ({ message }) => {
		if (!FEATURE_MANAGER.isEnabled(SearchChatFeature)) return;

		const parent = message.closest(`[class*='chat-box__'], ${SELECTOR_CHAT_V3__BOX}`);
		if (!parent) return;

		const input = findElement<HTMLInputElement>(".tt-chat-filter input", parent, true);
		if (!input) return;

		const inputValue = input.value;
		if (inputValue) searchChat(findElement(`${SELECTOR_CHAT_V2__MESSAGE_BOX}, ${SELECTOR_CHAT_V3__MESSAGE}`, message, true), inputValue);
	});
	addCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, () => {
		if (!FEATURE_MANAGER.isEnabled(SearchChatFeature)) return;

		// Re-filter all chats after they refresh.
		findAllElements(`[class*='group-chat-box__chat-box-wrapper__'], ${SELECTOR_CHAT_ROOT} ${SELECTOR_CHAT_V3__BOX}[style*='z-index']`).forEach((chat) => {
			const input = findElement<HTMLInputElement>(".tt-chat-filter input", chat, true);
			if (!input) return;

			const inputValue = input.value;
			if (inputValue) onChatSearch({ target: input }, chat);
		});
	});
	addCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, ({ peopleMenu }) => {
		addPeopleSearch(peopleMenu);
	});
}

async function showSearch() {
	await requireChatsLoaded();
	for (const chat of findAllElements(
		[
			`${SELECTOR_CHAT_ROOT} [class*='group-chat-box__'] [class*='group-chat-box__chat-box-wrapper__']`,
			`${SELECTOR_CHAT_ROOT} ${SELECTOR_CHAT_V3__BOX}[style*='z-index']:not(:has(#people_panel))`,
		].join(", "),
	)) {
		addChatSearch(chat);
	}
	addPeopleSearch();
}

function addChatSearch(chat: Element) {
	if (findElement(".tt-chat-filter", chat, true)) return;

	const chatFooter = findElement("[class*='chat-box-footer__'], [class*='content___'] > [class*='root___']:nth-child(2)", chat, true);
	if (!chatFooter) return;

	const searchElement = elementBuilder({
		type: "div",
		class: "tt-chat-filter",
		children: [
			elementBuilder({
				type: "label",
				text: "Search:",
				children: [
					elementBuilder({
						type: "input",
						events: { input: (event) => onChatSearch(event, chat) },
						attributes: { autocomplete: "false" },
					}),
				],
			}),
		],
	});

	const scrollContainer = findElement("[class*='scrollContainer___']", chat, true);
	if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;

	chatFooter.insertAdjacentElement("beforebegin", searchElement);
}

function addPeopleSearch(peopleMenu: Element | null = null) {
	if (!peopleMenu) peopleMenu = findElement("#chatRoot [class*='chat-app__panel__']", true);

	if (!peopleMenu || findElement(".tt-chat-filter", peopleMenu, true)) return;

	findElement("[class*='chat-list-header__tabs__']", peopleMenu, true)?.insertAdjacentElement(
		"beforebegin",
		elementBuilder({
			type: "div",
			class: "tt-chat-filter",
			children: [
				elementBuilder({
					type: "label",
					text: "Search:",
					children: [
						elementBuilder({
							type: "input",
							events: {
								input: (event) => {
									const keyword = (event.target as HTMLInputElement).value.toLowerCase();
									const isUserID = !Number.isNaN(parseInt(keyword));

									if (
										findElement(
											"[class*='chat-list-header__tabs__'] [class*='chat-list-header__tab--active__']:first-child",
											peopleMenu,
											true,
										)
									) {
										// "Chats" tab opened.
										const list = findAllElements<HTMLAnchorElement>(
											"#scrollableDiv .infinite-scroll-component > button [class*='detailed-chat-card__header__'] a",
											peopleMenu,
										);
										list.forEach((chatEntry) => {
											const shouldHide =
												keyword &&
												((isUserID && chatEntry.href.split("?XID=")[1] !== keyword) ||
													(!isUserID && !chatEntry.textContent.toLowerCase().includes(keyword)));
											if (shouldHide) chatEntry.closest("button").classList.add("tt-hidden");
											else chatEntry.closest("button").classList.remove("tt-hidden");
										});
									} else {
										// Other tabs opened.
										const list = findAllElements<HTMLAnchorElement>("#scrollableDiv > [class*='member-card__'] a", peopleMenu);
										list.forEach((chatEntry) => {
											const shouldHide =
												keyword &&
												((isUserID && chatEntry.href.split("?XID=")[1] !== keyword) ||
													(!isUserID && !chatEntry.textContent.toLowerCase().includes(keyword)));
											if (shouldHide) chatEntry.closest("[class*='member-card__']").classList.add("tt-hidden");
											else chatEntry.closest("[class*='member-card__']").classList.remove("tt-hidden");
										});
									}
								},
							},
						}),
					],
				}),
			],
		}),
	);
}

function onChatSearch(event: { target: EventTarget }, chat: Element) {
	const keyword = (event.target as HTMLInputElement).value.toLowerCase();

	for (const message of findAllElements(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY} ${SELECTOR_CHAT_V2__MESSAGE_BOX}, ${SELECTOR_CHAT_V3__MESSAGE}`, chat)) {
		searchChat(message, keyword);
	}

	if (!keyword) {
		const chatBody = findElement(`${SELECTOR_CHAT_V2__CHAT_BOX_BODY}, ${SELECTOR_CHAT_V3__BOX_SCROLLER}`, chat);
		chatBody.scrollTop = chatBody.scrollHeight;
	}
}
function searchChat(message: Element | null, keyword: string) {
	if (!message) return;

	if (keyword.startsWith("by:") || keyword.startsWith("u:")) {
		const splitInput = keyword.split(" ");
		const target = splitInput.shift().split(":")[1];
		keyword = splitInput.join(" ");

		const sender = findElement<HTMLAnchorElement>(`${SELECTOR_CHAT_V2__MESSAGE_SENDER}, ${SELECTOR_CHAT_V3__MESSAGE_SENDER}`, message);
		if (!sender.textContent.toLowerCase().includes(target) && (Number.isNaN(parseInt(target)) || !sender.href.match(`XID=${target}$`))) {
			message.closest("[class*='chat-box-message___'], div[class*='root___']").classList.add("tt-hidden");
			return;
		}
	}

	const messageText = findElement(`p, ${SELECTOR_CHAT_V3__MESSAGE_CONTENT}`, message).textContent.toLowerCase();
	if (keyword && !messageText.includes(keyword)) {
		message.closest("[class*='chat-box-message___'], div[class*='root___']").classList.add("tt-hidden");
	} else {
		message.closest("[class*='chat-box-message___'], div[class*='root___']").classList.remove("tt-hidden");
	}
}

export default class SearchChatFeature extends Feature {
	constructor() {
		super("Search Chat", "chat");
	}

	override isEnabled() {
		return settings.pages.chat.searchChat;
	}

	override initialise() {
		initialiseSearchChat();
	}

	override async execute() {
		await showSearch();
	}

	override storageKeys() {
		return ["settings.pages.chat.searchChat"];
	}
}
