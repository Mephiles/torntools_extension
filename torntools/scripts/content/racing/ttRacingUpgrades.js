requireDatabase().then(() => {
	upgradeView().then(() => {
		console.log("TT - Racing Upgrades");

		if (!settings.pages.racing.upgrades) return;

		showUpgrades();

		// start checking again when left site
		for (let category of doc.findAll(".categories li")) {
			category.addEventListener("click", () => {
				upgradeView().then(showUpgrades);
			});
		}
	});
});

function upgradeView() {
	return requireElement(".pm-categories-wrap");
}

function showUpgrades() {
	let items = document.querySelectorAll(".pm-items-wrap .d-wrap .pm-items .unlock");
	for (let item of items) {
		for (let property of item.findAll(".properties")) {
			let statOld = parseInt(property.find(".bar-gray-light-wrap-d").style.width);
			let statNew = parseInt(property.find(".bar-color-wrap-d").style.width);
			let difference = statNew - statOld;

			if (isNaN(difference)) continue;

			const bar = property.find(".bar-gray-d");

			if (difference > 0) bar.classList.add("positive");
			else if (difference < 0) bar.classList.add("negative");

			bar.innerText = `${difference}%`
		}
	}
}
