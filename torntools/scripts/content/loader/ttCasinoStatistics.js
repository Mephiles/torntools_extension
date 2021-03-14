requireDatabase().then(() => {
	console.log("TT - Casino Statistics");
	if (!window.location.href.includes("Lottery") && (window.location.href.includes("Statistics") || window.location.href.includes("stats/"))) {
		addNetTotal("overall");
		addNetTotal("your");
	}
	if (window.location.href.includes("bookies")) {
		window.addEventListener("hashchange", () => {
			if (!window.location.href.includes("Lottery") && window.location.href.includes("stats/")) {
				addNetTotal("overall");
				addNetTotal("your");
			}
		});
	}
});

function addNetTotal(overallOrYour) {
	let totalWon, totalLost;
	if (doc.find("li#tt-net-total") || (window.location.toString().includes("Poker") && overallOrYour === "overall")) return;
	requireElement(`div.stats-wrap.m-top10 div.${overallOrYour}-stats-wrap li.stat`).then(() => {
		for (let x of doc.findAll(`div#${overallOrYour}-stats li.stat`)) {
			if (x.innerText.includes("Total money won") || x.innerText.includes("Total money gain")) totalWon = x;
			if (x.innerText.includes("Total money lost") || x.innerText.includes("Total money loss")) totalLost = x;
		}
		let netTotal =
			"$" +
			numberWithCommas(
				parseInt(totalWon.parentElement.find("li.stat-value").innerText.replace(/[$,]/g, "")) -
					parseInt(totalLost.parentElement.find("li.stat-value").innerText.replace(/[$,]/g, "")),
				false
			);
		totalLost.parentElement.parentElement.insertAdjacentHTML(
			"afterEnd",
			`<li id="tt-net-total">
			<ul class="item">
				<li class="stat" style="color: #acea00;">Net total<span class="m-show">:</span></li>
				<li class="stat-value">${netTotal}</li>
				<li class="clear"></li>
			</ul>
		</li>`
		);
	});
}
