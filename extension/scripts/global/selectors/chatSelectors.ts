/*
 * Chat V2 + V3
 */
const SELECTOR_CHAT_ROOT = "#chatRoot";

/*
 * Chat V3
 */
const SELECTOR_CHAT_V3__BOX = "[class*='item___']";
const SELECTOR_CHAT_V3__BOX_SCROLLER = "[class*='scrollWrapper___']";
const SELECTOR_CHAT_V3__BOX_LIST = `${SELECTOR_CHAT_V3__BOX_SCROLLER} > div`;
const SELECTOR_CHAT_V3__MESSAGE = "[class*='virtualItem___'] [class*='box___']";
const SELECTOR_CHAT_V3__MESSAGE_CONTENT = "[class*='box___'] [class*='message___']";
const SELECTOR_CHAT_V3__MESSAGE_SENDER = "[class*='sender___']";
const SELECTOR_CHAT_V3__MESSAGE_SELF = "[class*='self___']";
const SELECTOR_CHAT_V3__SEND_BUTTON = "button[class*='iconWrapper___']";
const SELECTOR_CHAT_V3__TRADE_CHAT = "div#public_trade";
/**
 * Used for a lot of classes, use carefully.
 */
const SELECTOR_CHAT_V3__VARIOUS_ROOT = "[class*='root___']";

/*
 * Chat V2
 */
const SELECTOR_CHAT_V2__CHAT_BOX_BODY = "[class*='chat-box-body__']";
const SELECTOR_CHAT_V2__MESSAGE_BOX = "[class*='chat-box-message__box__']";
const SELECTOR_CHAT_V2__MESSAGE_SENDER = "[class*='chat-box-message__sender__']";
