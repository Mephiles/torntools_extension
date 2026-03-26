import { addXHRListener, EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";

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
