import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { addXHRListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";

export function setupUserlistPage() {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (page !== "page") return;

		const sid = new URLSearchParams(xhr.requestBody).get("sid");
		if (sid !== "UserListAjax") return;

		await requireElement(".user-info-list-wrap");
		await requireElement(".user-info-list-wrap .ajax-placeholder", { invert: true });

		triggerCustomListener(EVENT_CHANNELS.USERLIST_SWITCH_PAGE);
	});
}
