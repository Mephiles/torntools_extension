"use strict";

(() => {
	for (const type of document.findAll(".travel-agency .torn-tabs > li:not([data-state='disabled'])")) {
		type.addEventListener("click", async () => {
			triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: type.find(".travel-name").innerText.toLowerCase() });
		});
	}
	for (const flag of document.findAll(".travel-agency .raceway")) {
		flag.addEventListener("click", async () => {
			await requireElement(".travel-agency > div[aria-expanded='true'] .travel-container.full-map[style='display: block;']");

			triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country: flag.dataset.race });
		});
	}
})();
