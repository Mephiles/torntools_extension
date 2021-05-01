"use strict";

(() => {
	document.addEventListener("click", (event) => {
		if (event.target.classList.contains("page-number") || event.target.classList.contains("page-nb")) {
			console.log("hi");
			requireElement(".user-info-list-wrap .last #iconTray li").then(() => {
				console.log("hi2");
				triggerCustomListener(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, null);
			});
		}
	});
})();
