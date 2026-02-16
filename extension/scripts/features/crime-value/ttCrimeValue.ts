(async () => {
	const feature = featureManager.registerFeature(
		"Crime Value",
		"crimes",
		() => settings.pages.crimes2.value,
		addListener,
		undefined,
		removeCrimeValue,
		{ storage: ["settings.pages.crimes2.value"] },
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	function addListener() {
		addFetchListener(({ detail: { page, json, fetch } }) => {
			if (!feature.enabled()) return;
			if (page !== "page" || !json) return;

			const params = new URL(fetch.url).searchParams;
			const sid = params.get("sid");
			const step = params.get("step");

			if (!isAttemptCrime(sid, step, json)) return;

			if (!hasItemOutcome(json)) return;

			const value = calculateValue(json);

			displayCrimeValue(value);
		});
	}

	function hasItemOutcome(response: TornInternalAttemptCrime): boolean {
		return response.DB.outcome.rewards.some((x) => x.type === "items");
	}

	function calculateValue(response: TornInternalAttemptCrime): number {
		return response.DB.outcome.rewards
			.filter(({ type }) => type === "items" || type === "money")
			.map((reward) => {
				if (reward.type === "items") {
					reward.value;

					return reward.value
						.filter(({ id }) => id in torndata.itemsMap)
						.map(({ id, amount }) => torndata.itemsMap[id].value.market_price * amount)
						.reduce((a, b) => a + b, 0);
				} else if (reward.type === "money") {
					return reward.value;
				} else {
					return 0;
				}
			})
			.reduce((a, b) => a + b, 0);
	}

	async function displayCrimeValue(value: number) {
		console.log("DKK display crime value 1", value);
		removeCrimeValue();

		const valueElement = elementBuilder({
			type: "span",
			class: "tt-crime-value-text",
			text: `Total value: ${formatNumber(value, { currency: true })}`,
		});

		await requireElement("[class*='loader___']", { invert: true });
		const rewardElement: Element = await requireElement("[class*='outcome___']:not([class*='exiting']) [class*='outcomeReward___'] [class*='reward___']");
		console.log("DKK display crime value 2", rewardElement.parentElement.parentElement.parentElement.parentElement.parentElement.outerHTML);
		rewardElement.insertAdjacentElement("beforeend", valueElement);
	}

	function removeCrimeValue() {
		findAllElements(".tt-crime-value-text").forEach((x) => x.remove());
	}
})();
