requireDatabase().then(() => {
	console.log("TT - Casino");

	requireElement(".games-list.m-top10").then(disableCasinoGames);
});

function disableCasinoGames() {
	if (hide_casino_games.length > 0) {
		doc.find(".msg.right-round").appendChild(
			doc.new({
				type: "div",
				html: "<span style='color: #07a207'>Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.</span>",
			})
		);
		for (let game of hide_casino_games) {
			doc.find(`.${game}`).style.display = "none";
			doc.find(`.${game}`).parentElement.cssText =
				"text-align: center; display: flex; justify-content: center; align-items: center; background: #c5c5c5;";
			doc.find(`.${game}`).insertAdjacentHTML(
				"beforebegin",
				"<div style='width: fit-content;margin: auto;font-weight: 600;line-height: 15;'><span><b>•&nbsp;REMOVED&nbsp;•</b></span></div>"
			);
		}
	}
}
