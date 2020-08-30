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

	let parts = [];
	for (let item of items) {
		parts.push(item.getAttribute("data-part"));

		for (let property of item.findAll(".properties")) {
			let statOld = parseInt(property.find(".bar-gray-light-wrap-d").style.width);
			let statNew = parseInt(property.find(".bar-color-wrap-d").style.width);
			let difference = statNew - statOld;

			if (isNaN(difference)) continue;

			const bar = property.find(".bar-gray-d");

			if (difference !== 0) {
				if (property.find(".bar-tpl-wrap").classList.contains("negative")) bar.classList.add("negative");
				else bar.classList.add("positive");
			}

			bar.innerText = `${difference}%`
		}
	}

	parts = parts.filter((value, index, self) => self.indexOf(value) === index);
	let needed = [];
	parts.forEach(part => {
		if (doc.find(`.pm-items .bought[data-part="${part}"]`)) return;

		const color = `#${(Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6)}`
		needed.push(`<span class="tt-race-upgrade-needed" style="color: ${color};">${part}</span>`);

		let category;
		for (let item of doc.findAll(`.pm-items .unlock[data-part="${part}"]`)) {
			if (!category) category = findParent(item, { class: "pm-items-wrap" }).getAttribute("category");

			item.find(".status").style['background-color'] = color;
			item.find(".status").classList.add("tt-modified");
		}

		const elCategory = doc.find(`.pm-categories > li[data-category="${category}"]`);
		if (elCategory.find(".tt-race-need-icon")) {
			elCategory.find(".tt-race-need-icon").innerText = parseInt(elCategory.find(".tt-race-need-icon").innerText) + 1;
		} else {
			elCategory.find(".bg-hover").appendChild(doc.new({ type: "div", class: "tt-race-need-icon", text: 1 }));
		}
	})

	doc.find("#racingAdditionalContainer > .info-msg-cont .msg").appendChild(doc.new({
		type: "div",
		html: `
			<p class="tt-race-upgrades">
				<br/>
				<br/>
				${needed.length ? `
				<strong>${needed.length}</strong> part available to upgrade: <strong>${needed.join(", ")}</strong>
				` : "Your car is <strong style='color: #789e0c;'>FULLY UPGRADED</strong>"}
			</p>
		`,
	}));
}
