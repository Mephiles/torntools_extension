(async () => {
	const playerID = (await cookieStore.get("uid")).value;
	const traderID = $(`#trade-container .log > li .desc a:not([href*="${playerID}"])`)
		.attr("href")
		.match(/XID=(\d*)/i)[1];

	chat.r(traderID);
})();
