requireDatabase().then(() => {
	console.log("TT - Casino Statistics");
	if (!window.location.toString().includes("Lottery")) {
		addNetTotal("overall");
		addNetTotal("your");
	}
});

function addNetTotal(overallOrYour) {
	requireElement(`div.stats-wrap.m-top10 div#${overallOrYour}-stats`).then(() => {
		let totalWon, totalLost;
		for (let x of doc.findAll(`div#${overallOrYour}-stats li.stat`)) {
			if (x.innerText.includes("Total money won")) totalWon = x;
			if (x.innerText.includes("Total money lost")) totalLost = x;
		}
		let netTotal = "$" + numberWithCommas(parseInt(totalWon.parentElement.find("li.stat-value").innerText.replace(/[$,]/g, "")) - parseInt(totalLost.parentElement.find("li.stat-value").innerText.replace(/[$,]/g, "")), false);
		totalLost.parentElement.parentElement.insertAdjacentHTML("afterEnd", `<li>
			<ul class="item">
				<li class="stat" style="color: #acea00;">Net total<span class="m-show">:</span></li>
				<li class="stat-value">${netTotal}</li>
				<li class="clear"></li>
			</ul>
		</li>`)
	});
}
