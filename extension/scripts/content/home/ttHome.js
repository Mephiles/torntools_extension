"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Home - Loading script. ");

	storageListeners.settings.push(loadHome);

	loadHome();

	console.log("TT: Home - Script loaded.");
})();

function loadHome() {
	// FIXME - Check travel state.

	requireContent().then(async () => {
		displayNetworth();
		await displayEffectiveBattleStats();
	});
}

function displayNetworth() {
	if (settings.pages.home.networthDetails) {
	} else {
	}
}

async function displayEffectiveBattleStats() {
	if (settings.pages.home.effectiveStats) {
		const statsContainer = document.find("h5=Battle Stats").parentElement.nextElementSibling.find("ul.info-cont-wrap");
		const { content } = createContainer("Effective Battle Stats", { parentElement: statsContainer });

		let effectiveTotal = 0;
		const stats = ["Strength", "Defense", "Speed", "Dexterity"];
		for (let i = 0; i < stats.length; i++) {
			const base = parseInt(statsContainer.find(`li:nth-child(${i + 1}) .desc`).innerText.replace(/,/g, ""));
			let modifier = statsContainer.find(`li:nth-child(${i + 1}) .mod`).innerText;
			modifier = parseInt(modifier.slice(1, -1)) / 100 + (modifier.charAt(0) === "+" ? 1 : 0);
			const effective = (base * modifier).dropDecimals();

			effectiveTotal += effective;
			content.appendChild(await newRow(stats[i], formatNumber(effective)));
		}

		content.appendChild(await newRow("Total", formatNumber(effectiveTotal, false)));

		async function newRow(name, value) {
			return document.newElement({
				type: "li",
				children: [
					document.newElement({
						type: "div",
						class: "divider",
						children: [document.newElement({ type: "span", text: name, style: { backgroundColor: "transparent" } })],
					}),
					document.newElement({
						type: "div",
						class: "desc",
						style: { width: (await checkMobile()) ? "180px" : "184px" },
						children: [document.newElement({ type: "span", text: value, style: { paddingLeft: "3px" } })],
					}),
				],
			});
		}
	} else {
		removeContainer("Effective Battle Stats");
	}
}
