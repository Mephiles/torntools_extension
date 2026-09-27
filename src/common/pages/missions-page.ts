import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { addXHRListener } from "@common/utils/functions/listeners";

export function setupMissionsPage() {
	addXHRListener(async ({ detail: { page, xhr, ...detail } }) => {
		if (page !== "page") return;

		const { uri } = detail;

		const params = new URLSearchParams(xhr.requestBody);
		const sid = extractParameter("sid", params, uri);
		const step = extractParameter("step", params, uri);

		if (sid === "missionsRewards" || (sid === "missions" && step === "buy")) {
			new MutationObserver((_mutations, observer) => {
				triggerCustomListener(EVENT_CHANNELS.MISSION_REWARDS);
				observer.disconnect();
			}).observe(findElement("#viewMissionsRewardsContainer"), { childList: true });
		} else if (sid === "missions" || sid === "completeContract" || sid === "acceptMission") {
			new MutationObserver((_mutations, observer) => {
				triggerCustomListener(EVENT_CHANNELS.MISSION_LOAD);
				observer.disconnect();
			}).observe(findElement("#missionsMainContainer"), { childList: true });
		}
	});
}

function extractParameter(key: string, params: URLSearchParams, uri: Record<string, string> | undefined): string | null {
	let value = params.get(key);
	if (value !== null) return value;

	if (!uri) return null;

	return uri[key] ?? uri[`?${key}`];
}
