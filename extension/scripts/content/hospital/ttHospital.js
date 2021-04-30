"use strict";

(async () => {
	requireElement(".pagination-wrap .page-number:not([style*='display: none'])").then(() => {
		document.addEventListener("click", (event) => {
			if (event.target.classList.contains("page-number")) {
				window.dispatchEvent(
					new CustomEvent(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, null);
				);
				triggerCustomListener(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, null);
			};
		})
	});
})();
