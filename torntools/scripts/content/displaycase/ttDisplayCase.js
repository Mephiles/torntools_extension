requireDatabase().then(() => {
	console.log("TT - Display Case");
	displayCabinetWorth();
});

function displayCabinetWorth() {
	if (settings.pages.displaycase.worth) {
		let displayUserId = window.location.href.split("/")[4];
		fetchApi_v2("torn", {
			section: "user",
			objectid: displayUserId,
			selections: "display",
		}).then((result) => {
			let totalValue = 0;
			for (let item in result.display) {
				totalValue +=
					result.display[item].market_price *
					result.display[item].quantity;
			}
			let displayCabinetWorthSpan = doc.new({
				type: "span",
				html: `<br>This display cabinet is worth <b><span style="color: #678c00">${
					"$" + numberWithCommas(totalValue, false)
				}</span></b>`,
			});
			doc.find("div.msg.right-round").appendChild(
				displayCabinetWorthSpan
			);
		});
	}
}
