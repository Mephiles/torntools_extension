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

			return true;
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

			const modifierText = statsContainer.find(`li:nth-child(${i + 1}) .mod`).textContent.trim();
			let modifier: number;
			if (modifierText.charAt(0) === "+") modifier = parseInt(modifierText.slice(1, -1)) / 100 + 1;
			else modifier = 1 - parseInt(modifierText.slice(1, -1)) / 100;
			const effective = (base * modifier).dropDecimals();

			effectiveTotal += effective;
			content.appendChild(newRow(stats[i], formatNumber(effective)));
		}

		content.appendChild(newRow("Total", formatNumber(effectiveTotal)));

		function newRow(name: string, value: string) {
			return elementBuilder({
				type: "li",
				class: "stats-row",
				children: [
					elementBuilder({ type: "div", class: "divider", children: [elementBuilder({ type: "span", text: name })] }),
					elementBuilder({ type: "div", class: "desc", children: [elementBuilder({ type: "span", text: value })] }),
				],
			});
		}
	}
})();
