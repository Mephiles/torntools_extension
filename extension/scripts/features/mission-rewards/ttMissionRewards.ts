(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Mission Rewards",
		"missions",
		() => settings.pages.missions.rewards,
		initialise,
		showRewards,
		removeRewards,
		{
			storage: ["settings.pages.missions.rewards"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.ammo) return "No API access.";

			return true;
		}
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.MISSION_REWARDS].push(() => {
			if (!feature.enabled()) return;

			showRewards();
		});
	}

	async function showRewards() {
		await requireElement("ul.rewards-list li");

		const credits = parseInt(document.find(".total-mission-points").textContent.replace(",", ""));

		for (const reward of document.findAll(".rewards-list li")) {
			const information = JSON.parse(reward.dataset.ammoInfo);
			const { points, basicType: type } = information;

			// Show if you can afford it.
			const actionsWrap = reward.find(".act-wrap");
			actionsWrap.classList.add("tt-mission-reward", credits < points ? "not-affordable" : "affordable");

			if (type === "Ammo") {
				const { title: size, ammoType } = information;

				const found = findItemInList(userdata.ammo, { size, type: ammoType });
				const owned = found ? found.quantity : 0;

				actionsWrap.insertBefore(
					elementBuilder({
						type: "div",
						children: [
							elementBuilder({
								type: "div",
								class: "tt-mission-reward-owned",
								text: "Owned: ",
								children: [elementBuilder({ type: "span", text: formatNumber(owned) })],
							}),
						],
					}),
					actionsWrap.find(".actions")
				);
				reward.classList.add("tt-modified");
			} else if (type === "Item") {
				const { image: id, amount } = information;
				if (!id || typeof id !== "number") continue;

				const value = torndata.items[id].market_value;
				const totalValue = amount * value;

				reward
					.find(".img-wrap")
					.appendChild(elementBuilder({ type: "span", class: "tt-mission-reward-individual", text: formatNumber(value, { currency: true }) }));

				actionsWrap.insertBefore(
					elementBuilder({
						type: "div",
						children: [
							elementBuilder({
								type: "div",
								text: "Total value: ",
								class: "tt-mission-reward-total",
								children: [
									elementBuilder({
										type: "span",
										text: formatNumber(totalValue, { shorten: totalValue > 10e6 ? 2 : true, currency: true }),
									}),
								],
							}),
							elementBuilder({
								type: "div",
								text: "Point value: ",
								class: "tt-mission-reward-points",
								children: [
									elementBuilder({
										type: "span",
										text: formatNumber(totalValue / points, { currency: true }),
									}),
								],
							}),
						],
					}),
					actionsWrap.find(".actions")
				);
				reward.classList.add("tt-modified");
			}
		}
	}

	function removeRewards() {}
})();
