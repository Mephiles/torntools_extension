/*
 * Chat V2 + V3
 */
export const SELECTOR_CHAT_ROOT = "#chatRoot";

/*
 * Chat V3
 */
export const SELECTOR_CHAT_V3__BOX = "[class*='item___']";
export const SELECTOR_CHAT_V3__BOX_SCROLLER = "[class*='scrollWrapper___']";
export const SELECTOR_CHAT_V3__BOX_LIST = `${SELECTOR_CHAT_V3__BOX_SCROLLER} > div`;
export const SELECTOR_CHAT_V3__MESSAGE = "[class*='virtualItem___'] [class*='box___']";
export const SELECTOR_CHAT_V3__MESSAGE_CONTENT = "[class*='box___'] [class*='message___']";
export const SELECTOR_CHAT_V3__MESSAGE_SENDER = "[class*='sender___']";
export const SELECTOR_CHAT_V3__MESSAGE_SELF = "[class*='self___']";
export const SELECTOR_CHAT_V3__SEND_BUTTON = "button[class*='iconWrapper___']";
export const SELECTOR_CHAT_V3__TRADE_CHAT = "div#public_trade";
export const SELECTOR_CHAT_V3__MINIMIZED_NAME = "button [class*='name___']";
export const SELECTOR_CHAT_V3__HEADER_NAME = "button [class*='title___']";

/**
 * Used for a lot of classes, use carefully.
 */
export const SELECTOR_CHAT_V3__VARIOUS_ROOT = "[class*='root___']";

/*
 * Chat V2
 */
export const SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX_WRAPPER = "[class*='group-minimized-chat-box__']";
export const SELECTOR_CHAT_V2__MINIMIZED_CHAT_BOX = "[class*='minimized-chat-box__']";
export const SELECTOR_CHAT_V2__CHAT_BOX = "[class*='chat-box__']";
export const SELECTOR_CHAT_V2__CHAT_BOX_BODY = "[class*='chat-box-body__']";
export const SELECTOR_CHAT_V2__CHAT_BOX_HEADER = "[class*='chat-box-header__']";
export const SELECTOR_CHAT_V2__HEADER_NAME = "[class*='chat-box-header__name__']";
export const SELECTOR_CHAT_V2__MESSAGE_BOX = "[class*='chat-box-message__box__']";
export const SELECTOR_CHAT_V2__MESSAGE_SENDER = "[class*='chat-box-message__sender__']";
