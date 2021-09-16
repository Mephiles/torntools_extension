"use strict";

(async () => {
	if (!getPageStatus().access) return;

	if (isFlying() || isAbroad()) return;

	featureManager.registerFeature(
		"Effective Battle Stats",
		"home",
		() => settings.pages.home.effectiveStats,
		null,
		showEffectiveBattleStats,
		() => removeContainer("Effective Battle Stats"),
		{
			storage: ["settings.pages.home.effectiveStats"],
		},
		async () => {
			await checkDevice();
		}
	);

	async function showEffectiveBattleStats() {
		await requireContent();

		const statsContainer = document.find("h5=Battle Stats").parentElement.nextElementSibling.find("ul.info-cont-wrap");
		const { content } = createContainer("Effective Battle Stats", {
			collapsible: false,
			applyRounding: false,
			compact: true,
			parentElement: statsContainer,
		});

		let effectiveTotal = 0;
		const stats = ["Strength", "Defense", "Speed", "Dexterity"];
		for (let i = 0; i < stats.length; i++) {
			const base = statsContainer.find(`li:nth-child(${i + 1}) .desc`).textContent.getNumber();
			let modifier = statsContainer.find(`li:nth-child(${i + 1}) .mod`).textContent.trim();
			if (modifier.charAt(0) === "+") modifier = parseInt(modifier.slice(1, -1)) / 100 + 1;
			else modifier = 1 - parseInt(modifier.slice(1, -1)) / 100;
			const effective = (base * modifier).dropDecimals();

			effectiveTotal += effective;
			content.appendChild(newRow(stats[i], formatNumber(effective)));
		}

		content.appendChild(newRow("Total", formatNumber(effectiveTotal, false)));

		function newRow(name, value) {
			return document.newElement({
				type: "li",
				class: "stats-row",
				children: [
					document.newElement({ type: "div", class: "divider", children: [document.newElement({ type: "span", text: name })] }),
					document.newElement({ type: "div", class: "desc", children: [document.newElement({ type: "span", text: value })] }),
				],
			});
		}
	}
})();
