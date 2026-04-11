import { getHashParameters } from "@/utils/common/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";

export function setupJailPage() {
	window.addEventListener("hashchange", (e) => {
		const oldHash = new URL(e.oldURL).hash || "#";
		const newHash = new URL(e.newURL).hash || "#";
		const oldStart = getHashParameters(oldHash).get("start");
		const newStart = getHashParameters(newHash).get("start");
		if (oldStart !== newStart) {
			requireElement(".user-info-list-wrap .last .ajax-preloader").then(() => {
				requireElement(".user-info-list-wrap .last #iconTray li").then(() => {
					triggerCustomListener(EVENT_CHANNELS.JAIL_SWITCH_PAGE);
				});
			});
		}
	});
}
