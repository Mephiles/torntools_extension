requireDatabase().then(() => {
	console.log("TT - Loader");
	if (settings.pages.attack.warn_when_stacking && getSearchParameters().get("ID") === null) displayWarning();
});

function displayWarning() {
	if (userdata.energy.current > userdata.energy.maximum) {
		let rawHTML = `<div class='tt-overlay-div'><span class='tt-overlay-text'>Warning! You have stacked energy. Beware!</span><button class='tt-overlay-button'>OK</button></div>`;
		doc.find("a[href='#skip-to-content']").insertAdjacentHTML("afterEnd", rawHTML);
		doc.find("button.tt-overlay-button").addEventListener("click", (event) => (event.target.parentElement.style.display = "none"));
	}
}
