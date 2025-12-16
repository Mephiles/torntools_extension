(() => {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (page !== "page") return;

		const sid = new URLSearchParams(xhr.requestBody).get("sid");
		if (sid !== "UserListAjax") return;

		await requireElement(".user-info-list-wrap");
		await requireElement(".user-info-list-wrap .ajax-placeholder", { invert: true });

		triggerCustomListener(EVENT_CHANNELS.USERLIST_SWITCH_PAGE);
	});
})();
