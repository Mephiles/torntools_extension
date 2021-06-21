"use strict";

(async () => {
	addXHRListener(({ detail: { page, uri } }) => {
		if (page === "crimes") {
			const step = uri.step;

			if (step === "main" || step === "docrime" || step === "docrime3") {
				triggerCustomListener(EVENT_CHANNELS.CRIMES_LOADED);
			} else if (step === "docrime2" || step === "docrime4") {
				triggerCustomListener(EVENT_CHANNELS.CRIMES_CRIME);
			}
		}
	});
})();
