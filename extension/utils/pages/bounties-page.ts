import { requireDOMContentLoaded, requireElement } from "@/utils/common/functions/requires";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";

export async function setupBountiesPage() {
	await requireDOMContentLoaded();

	new MutationObserver(() => {
		triggerCustomListener(EVENT_CHANNELS.SWITCH_PAGE);
	}).observe(await requireElement(".content-wrapper"), { childList: true });
}
