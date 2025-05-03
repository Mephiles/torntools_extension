(async () => {
	const playerID = (await cookieStore.get("uid")).value;
	const traderID = $(`#trade-container .log > li .desc a:not([href*="${playerID}"])`)
		.attr("href")
		.match(/XID=(\d*)/i)[1];

	if (window.chat && typeof window.chat === "object")
		// For Chat 2.0.
		window.chat.r(traderID);
	else
		// For Chat 3.0, copied from Torn's mini profiles code.
		window.dispatchEvent(
			new CustomEvent("chat.openChannel", {
				detail: {
					userId: String(traderID),
				},
			})
		);
})();
