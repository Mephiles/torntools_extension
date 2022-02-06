"use strict";

(() => {
	document.addEventListener("click", (event) => {
		if (event.target.classList.contains("page-number") || event.target.className.includes("pagination")) {
			requireElement(".user-info-list-wrap .last #iconTray li").then(() => {
				triggerCustomListener(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, {});
			});
		}
	});
})();
