requireDatabase(true).then(async () => {
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

	if (await isAbroad()) {
		warnEnergy();
	}
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

function warnEnergy() {
	if (doc.find(".travel-home-content")) listen();
	else
		new MutationObserver((mutations, observer) => {
			if (!doc.find(".travel-home-content")) return;

			listen();
			observer.disconnect();
		}).observe(doc.find("#mainContainer > .content-wrapper"), { childList: true, subtree: true });

	function listen() {
		if (!doc.find(".travel-home-content").style.display === "none") show();

		new MutationObserver((mutations) => {
			if (mutations[0].target.style.display === "none") return;

			show();
		}).observe(doc.find("#mainContainer > .content-wrapper"), { attributes: true, attributeFilter: ["style"], childList: true, subtree: true });
	}

	function show() {
		let content = doc.find(".travel-home-content .msg > p");
		let search = content.innerText.match(/take around (.*) to reach/i);
		if (!search) return;

		const splitTime = search[1].split(" ");

		let hours = 0,
			minutes = 0;
		if (splitTime.includes("minutes")) minutes = parseInt(splitTime[splitTime.indexOf("minutes") - 1]);
		if (splitTime.includes("hours")) hours = parseInt(splitTime[splitTime.indexOf("hours") - 1]);

		const fulltime = userdata.energy.fulltime;
		const flytime = (hours * 60 + minutes) * 60;

		if (fulltime < flytime) {
			content.appendChild(doc.new("br"));
			content.appendChild(
				doc.new({
					type: "span",
					text: "Starting this flight will waste some energy!",
					attributes: { color: "error" },
				})
			);
		}
	}
}
