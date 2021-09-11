"use strict";

(() => {
	addXHRListener(async ({ detail: { page, xhr, uri } }) => {
		if (page === "competition") {
			const params = new URLSearchParams(xhr.requestBody);
			const p = params.get("p");

			if (p === "team") {
				// console.log("DKK comp", document.find("a.user.name")?.dataset.placeholder);
				triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
			}
		}
	});
})();
