"use strict";

(async () => {
	document.addEventListener("click", (event) => {
		if (event.target.classList.contains("page-number")) {
			requireElement(".user-info-list-wrap > *:not(.last)").then(() => {
				triggerCustomListener(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, null);
			});
		}
	});
})();
