"use strict";

(async () => {
	addXHRListener(async ({ detail: { page, xhr, uri } }) => {
		if (page === "loader" || page === "loader2") {
			const params = new URLSearchParams(xhr.requestBody);
			let sid = params.get("sid");
			if (!sid && uri && (uri.sid || uri["?sid"])) sid = uri.sid || uri["?sid"];

			if (sid === "missionsRewards") {
				new MutationObserver((mutations, observer) => {
					triggerCustomListener(EVENT_CHANNELS.MISSION_REWARDS);
					observer.disconnect();
				}).observe(document.find("#viewMissionsRewardsContainer"), { childList: true });
			} else if (sid === "missions" || sid === "completeContract" || sid === "acceptMission") {
				new MutationObserver((mutations, observer) => {
					triggerCustomListener(EVENT_CHANNELS.MISSION_LOAD);
					observer.disconnect();
				}).observe(document.find("#missionsMainContainer"), { childList: true });
			}
		}
	});
})();
