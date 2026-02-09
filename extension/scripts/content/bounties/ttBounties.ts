(() => {
	new MutationObserver(() => {
		triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
	}).observe(document.querySelector(".content-wrapper"), { childList: true });
})();
