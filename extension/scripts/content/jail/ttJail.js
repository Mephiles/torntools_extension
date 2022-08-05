"use strict";

window.addEventListener("hashchange", e => {
	const oldStart = getHashParameters((new URL(e.oldURL)).hash).get("start") || 0;
	const newStart = getHashParameters((new URL(e.newURL)).hash).get("start") || 0;
	if (oldStart !== newStart) {
		requireElement(".user-info-list-wrap .last #iconTray li").then(() => {
			triggerCustomListener(EVENT_CHANNELS.JAIL_SWITCH_PAGE, null);
		});
	}
});
