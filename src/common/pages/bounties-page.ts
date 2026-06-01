import { EVENT_CHANNELS, triggerCustomListener } from "@utils/functions/listeners";
import { requireDOMContentLoaded, requireElement } from "@utils/functions/requires";

export async function setupBountiesPage() {
	await requireDOMContentLoaded();

	new MutationObserver(() => {
		triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
	}).observe(await requireElement(".content-wrapper"), { childList: true });
}
