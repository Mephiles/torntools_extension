import { addXHRListener, EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { getHashParameters } from "@/utils/common/functions/dom";

export function setupTradePage() {
	addXHRListener(({ detail: { page, xhr } }) => {
		if (page === "trade") {
			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			triggerEvent(step);
		}
	});
	window.addEventListener("hashchange", () => {
		const params = getHashParameters();
		const step = params.get("step");

		triggerEvent(step);
	});
}

function triggerEvent(step: string) {
	const active = ["view", "initiateTrade", "accept"].includes(step);

	triggerCustomListener(EVENT_CHANNELS.TRADE, { step, active });
}
