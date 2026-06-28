import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { requireDOMContentLoaded, requireElement } from "@common/utils/functions/requires";

export async function setupBountiesPage() {
	await requireDOMContentLoaded();

	new MutationObserver(() => {
		triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
	}).observe(await requireElement(".content-wrapper"), { childList: true });
}
