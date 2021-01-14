requireDatabase().then(() => {
	console.log("TT - Display Case");
	displayCabinetWorth();
});

function displayCabinetWorth() {
	if (settings.pages.displaycase.worth) {
		let display_user_id = window.location.href.split("/")[4];
		fetchApi_v2("torn", {
			section: "user",
			objectid: display_user_id,
			selections: "display",
		}).then((result) => {
			let totalValue = 0;
			for (let item in result.display) {
				totalValue +=
					result.display[item].market_price *
					result.display[item].quantity;
			}
			doc.find(
				"div.msg.right-round"
			).innerHTML += `<br>This display cabinet is worth <b><span style="color: #678c00">${
				"$" + numberWithCommas(totalValue, false)
			}</span></b>`;
		});
	}
}
