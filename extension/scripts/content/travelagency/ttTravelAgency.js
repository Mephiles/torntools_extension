"use strict";

(async () => {
	await checkDevice();

	if (mobile || tablet) {
		document.find(".travel-agency").addEventListener("click", (event) => {
			const parent = event.target.closest(".travel-info-table-list[aria-selected*='true'][role*='tab']");

			if (parent) {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country: parent.find(".city-flag").classList[1] });
			}
		});
		document.find(".torn-tabs").addEventListener("click", (event) => {
			const parent = event.target.closest(".torn-tabs li[aria-selected='true']");

			if (parent) {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: parent.find(".travel-name").innerText.toLowerCase() });
			}
		});
	} else {
		for (const type of document.findAll(".travel-agency .torn-tabs > li:not([data-state='disabled'])")) {
			type.addEventListener("click", async () => {
				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_TYPE, { type: type.find(".travel-name").innerText.toLowerCase() });
			});
		}
		for (const flag of document.findAll(".travel-agency .raceway")) {
			flag.addEventListener("click", async () => {
				const container = document.find(".travel-agency > div[aria-expanded='true'] .travel-container.full-map[style='display: block;']");
				if (container) {
					await new Promise((resolve) => {
						new MutationObserver((mutations, observer) => {
							observer.disconnect();
							resolve();
						}).observe(container, { childList: true });
					});
				} else await requireElement(".travel-agency > div[aria-expanded='true'] .travel-container.full-map[style='display: block;']");

				triggerCustomListener(EVENT_CHANNELS.TRAVEL_SELECT_COUNTRY, { country: flag.dataset.race });
			});
		}
	}
})();
