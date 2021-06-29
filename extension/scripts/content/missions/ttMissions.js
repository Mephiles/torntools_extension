"use strict";

(async () => {
	addXHRListener(({ detail: { page, xhr, uri } }) => {
		if (page === "loader" || page === "loader2") {
			const params = new URLSearchParams(xhr.requestBody);
			let sid = params.get("sid");
			if (!sid && uri && (uri.sid || uri["?sid"])) sid = uri.sid || uri["?sid"];

			if (sid === "missionsRewards") requireMissions().then(() => triggerCustomListener(EVENT_CHANNELS.MISSION_REWARDS));
			else if (sid === "missions" || sid === "completeContract" || sid === "acceptMission")
				requireMissions().then(() => triggerCustomListener(EVENT_CHANNELS.MISSION_LOAD));
		}
	});

	function requireMissions() {
		return requireElement("ul.rewards-list li");
	}
})();
