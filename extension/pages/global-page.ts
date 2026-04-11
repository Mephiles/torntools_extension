import { checkDevice, elementBuilder, findAllElements, getSearchParameters, isElement, isHTMLElement } from "@/utils/common/functions/dom";
import { loadDatabase, settings, storageListeners } from "@/utils/common/data/database";
import { requireChatsLoaded, requireCondition, requireContent } from "@/utils/common/functions/requires";
import { getPage, isChatV3 } from "@/utils/common/functions/torn";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import {
	SELECTOR_CHAT_ROOT,
	SELECTOR_CHAT_V2__CHAT_BOX_BODY,
	SELECTOR_CHAT_V3__BOX,
	SELECTOR_CHAT_V3__BOX_SCROLLER,
	SELECTOR_CHAT_V3__MESSAGE,
	SELECTOR_CHAT_V3__MESSAGE_CONTENT,
	SELECTOR_CHAT_V3__VARIOUS_ROOT,
} from "@/utils/common/global/selectors/chatSelectors";
import { updateTimers } from "@/utils/common/functions/timers";
import { FEATURE_MANAGER } from "@/features/feature-manager";

function handleDeviceSizeClasses() {
	checkDevice().then(({ mobile, tablet }) => {
		if (mobile) document.body.classList.add("tt-mobile");
		else document.body.classList.remove("tt-mobile");

		if (tablet) document.body.classList.add("tt-tablet");
		else document.body.classList.remove("tt-tablet");
	});
}

function handlePopoutClass() {
	if (getSearchParameters().has("popped")) document.documentElement.classList.add("tt-popout");
	else document.documentElement.classList.remove("tt-popout");
}

async function handleTheme() {
	await loadDatabase();

	document.documentElement.style.setProperty("--tt-theme-color", settings.themes.containers !== "alternative" ? "#fff" : "#acea00");
	document.documentElement.style.setProperty(
		"--tt-theme-background",
		settings.themes.containers !== "alternative" ? "var(--tt-background-green)" : "var(--tt-background-alternative)"
	);
	storageListeners.settings.push((oldSettings) => {
		if (!oldSettings || !oldSettings.themes || !settings || !settings.themes || oldSettings.themes.containers !== settings.themes.containers) {
			document.documentElement.style.setProperty("--tt-theme-color", settings.themes.containers !== "alternative" ? "#fff" : "#acea00");
			document.documentElement.style.setProperty(
				"--tt-theme-background",
				settings.themes.containers !== "alternative" ? "var(--tt-background-green)" : "var(--tt-background-alternative)"
			);
		}
	});
}

function createOverlay() {
	document.body.appendChild(elementBuilder({ type: "div", class: "tt-overlay tt-hidden" }));
}

async function observeChat() {
	await requireChatsLoaded();

	if (isChatV3()) {
		const chatRefreshObserver = new MutationObserver((mutations) => {
			triggerCustomListener(EVENT_CHANNELS.CHAT_REFRESHED, { chat: mutations[0].target as Element });
		});
		new MutationObserver((mutations) => {
			if (mutations.every((mutation) => mutation.removedNodes.length === 0)) return;

			triggerCustomListener(EVENT_CHANNELS.CHAT_CLOSED);
		}).observe(document.querySelector("#chatRoot > [class*='root___'] > [class*='root___']:first-child"), {
			childList: true,
		});
		new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				Array.from(mutation.addedNodes)
					.filter(isElement)
					.forEach((node) => {
						if (node.tagName === "svg" || !isHTMLElement(node)) return;

						if (node.className?.includes("item___")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: node });
							chatRefreshObserver.observe(node.querySelector(`${SELECTOR_CHAT_V3__BOX_SCROLLER} > div`), { childList: true });
						} else if (node.id === "settings_panel") {
							const panel = (mutation.target as Element).querySelector<HTMLElement>(":scope > [class*='root___']");

							triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: panel });
						} else if (node.id === "people_panel") {
							const panel = (mutation.target as Element).querySelector<HTMLElement>(":scope > [class*='root___']");

							triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: panel });
						} else if (isElement(mutation.target) && mutation.target.className === "" && node.querySelector(SELECTOR_CHAT_V3__MESSAGE_CONTENT)) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: node.querySelector(SELECTOR_CHAT_V3__MESSAGE) });
						}
					});
			}
		}).observe(document.querySelector(SELECTOR_CHAT_ROOT), { childList: true, subtree: true });
		new MutationObserver(() => {
			triggerCustomListener(EVENT_CHANNELS.CHAT_RECONNECTED);
		}).observe(document.querySelector(SELECTOR_CHAT_ROOT), { childList: true });

		for (const chat of findAllElements(`${SELECTOR_CHAT_ROOT} ${SELECTOR_CHAT_V3__BOX}`)) {
			const chatPanel = chat.querySelector(`:scope > ${SELECTOR_CHAT_V3__VARIOUS_ROOT}`);
			if (!chatPanel) continue; // No content in the panel.

			if (chatPanel.id === "people_panel") {
				triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: chat });
			} else if (chatPanel.id === "settings_panel") {
				triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: chat });
			} else if (!chatPanel.id) {
				// Special panels have an id, normal chats don't.
				triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: chat });
			}
		}
	} else {
		const chatRefreshObserver = new MutationObserver(() => {
			triggerCustomListener(EVENT_CHANNELS.CHAT_REFRESHED);
		});
		new MutationObserver(() => {
			triggerCustomListener(EVENT_CHANNELS.CHAT_CLOSED);
		}).observe(document.querySelector("#chatRoot [class*='group-minimized-chat-box__']"), { childList: true });
		new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				Array.from(mutation.addedNodes)
					.filter(isElement)
					.forEach((node) => {
						if (node.tagName === "svg" || !isHTMLElement(node)) return;

						if (node.className?.includes("group-chat-box__")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_OPENED, { chat: node });

							chatRefreshObserver.observe(node.querySelector(SELECTOR_CHAT_V2__CHAT_BOX_BODY), { childList: true });
						} else if (!node.className && node.parentElement?.className.includes("chat-box-body__")) {
							triggerCustomListener(EVENT_CHANNELS.CHAT_MESSAGE, { message: node });
						} else if (node.className?.includes("chat-app__panel__")) {
							if (node.children[0].className.includes("settings-panel__"))
								triggerCustomListener(EVENT_CHANNELS.CHAT_SETTINGS_MENU_OPENED, { settingsPanel: node.children[0] as HTMLElement });
							else triggerCustomListener(EVENT_CHANNELS.CHAT_PEOPLE_MENU_OPENED, { peopleMenu: node });
						}
					});

				const openedChats = findAllElements("#chatRoot [class*='group-chat-box__chat-box-wrapper__']");
				if (openedChats.length) chatRefreshObserver.observe(openedChats[0].querySelector(SELECTOR_CHAT_V2__CHAT_BOX_BODY), { childList: true });
				else chatRefreshObserver.disconnect();
			}
		}).observe(document.querySelector(SELECTOR_CHAT_ROOT), { childList: true, subtree: true });
	}
}

async function observeBody() {
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			switch (mutation.attributeName) {
				case "data-layout":
					triggerCustomListener(EVENT_CHANNELS.STATE_CHANGED, { oldState: mutation.oldValue, newState: document.body.dataset.layout });
					break;
			}
		}
	}).observe(document.body, { attributes: true, attributeFilter: ["data-layout"], attributeOldValue: true });
}

function handleFocus() {
	let focusTimeout: number | null = null;

	window.addEventListener("focus", () => {
		if (focusTimeout) return;

		focusTimeout = setTimeout(() => {
			focusTimeout = null;

			triggerCustomListener(EVENT_CHANNELS.WINDOW__FOCUS);
		}, 50);
	});
}

function handlePage() {
	document.body.dataset.page = getPage();
}

export function runGlobalPageScripts() {
	handleDeviceSizeClasses();
	handlePopoutClass();

	requireCondition(() => document.body).then(() => {
		handleTheme().catch(() => {});
		createOverlay();
		observeChat().catch(console.error);
		observeBody().catch(console.error);
		handlePage();

		setInterval(updateTimers, 1000);
		handleFocus();
	});
	requireContent().then(() => FEATURE_MANAGER.createPopup());
}
