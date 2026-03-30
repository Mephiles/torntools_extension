// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(async () => {
	const playerID = (await cookieStore.get("uid")).value;
	// @ts-expect-error Bundling Migration
	const traderID = $(`#trade-container .log > li .desc a:not([href*="${playerID}"])`)
		.attr("href")
		.match(/XID=(\d*)/i)[1];

	// @ts-expect-error Bundling Migration
	if (window.chat && typeof window.chat === "object")
		// For Chat 2.0.
		// @ts-expect-error Bundling Migration
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
});
