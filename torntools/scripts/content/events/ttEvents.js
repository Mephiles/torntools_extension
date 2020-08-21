requireDatabase(true).then(() => {
	console.log("TT - Events");

	addXHRListener((event) => {
		const { page, xhr } = event.detail;
		if (page !== "events") return;

		const params = new URL(xhr.responseURL).searchParams;

		if (params.get("step") === "all") {
			eventsLoaded().then(handleEvents);
		}
	});

	eventsLoaded().then(handleEvents);
});

function eventsLoaded() {
	return requireElement(".events .body-wrap");
}

function handleEvents() {
	const VALUE_REGEX = [
		/.* bought ([0-9,]+) x .* from your bazaar for \$([0-9,]+)\./i,
		/([0-9,]+) shares? in [A-Z]+ ha..? been sold for \$([0-9,]+)\. You can withdraw your check from the bank, or wait for it to be credited to your account in 24 hours\./i,
		/.* bought ([0-9,]+) of your points that were on the market for \$([0-9,]+)\./i,
	];

	for (let event of doc.findAll(".events .body-wrap")) {
		const mailLink = event.find(".mail-link");

		showWorth(mailLink);
	}

	function showWorth(link) {
		for (let regex of VALUE_REGEX) {
			let result = link.innerText.match(regex);
			if (!result) continue;

			const price = parseInt(result[2].replaceAll(",", "")) / parseInt(result[1].replaceAll(",", ""));
			link.setAttribute("title", `(worth $${numberWithCommas(price, false, FORMATTER_VALUES)} each)`);
		}
	}
}

