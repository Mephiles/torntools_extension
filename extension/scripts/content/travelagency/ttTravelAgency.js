"use strict";

(() => {
	for (const type of document.findAll(".travel-agency .torn-tabs > li:not([data-state='disabled'])")) {
		type.addEventListener("click", async () => {
			triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: type.find(".travel-name").innerText.toLowerCase() });
		});
	}
})();
