(async () => {
	addXHRListener(({ detail: { page, ...detail } }) => {
		if (page === "crimes" && "uri" in detail) {
			const step = detail.uri.step;

			if (step === "main" || step === "docrime" || step === "docrime3") {
				triggerCustomListener(EVENT_CHANNELS.CRIMES_LOADED);
			} else if (step === "docrime2" || step === "docrime4") {
				triggerCustomListener(EVENT_CHANNELS.CRIMES_CRIME);
			}
		}
	});
})();
