"use strict";

(() => {
	document.addEventListener("click", (event) => {
		if (event.target.classList.contains("page-number") || event.target.classList.contains("page-nb")) {
			requireElement(".user-info-list-wrap .last #iconTray li").then(() => {
				triggerCustomListener(EVENT_CHANNELS.PEOPLE_SWITCH_PAGE, null);
			});
		}
	});
})();
