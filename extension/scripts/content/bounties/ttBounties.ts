(() => {
	new MutationObserver(() => {
		triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
	}).observe(document.find(".content-wrapper"), { childList: true });
})();
