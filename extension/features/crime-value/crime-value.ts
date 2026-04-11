import "./crime-value.css";
import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { isAttemptCrime, type TornInternalAttemptCrime } from "@/pages/crimes2-page";
import { settings, torndata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { addFetchListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";

function addListener() {
	addFetchListener(async ({ detail: { page, json, fetch } }) => {
		if (!FEATURE_MANAGER.isEnabled(CrimeValueFeature)) return;
		if (page !== "page" || !json) return;

		const params = new URL(fetch.url).searchParams;
		const sid = params.get("sid");
		const step = params.get("step");

		if (!isAttemptCrime(sid, step, json)) return;

		if (!hasItemOutcome(json)) return;

		const value = calculateValue(json);

		await displayCrimeValue(value);
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
	removeCrimeValue();

	const valueElement = elementBuilder({
		type: "span",
		class: "tt-crime-value-text",
		text: `Total value: ${formatNumber(value, { currency: true })}`,
	});

	await requireElement("[class*='loader___']", { invert: true });
	const rewardElement: Element = await requireElement("[class*='outcome___']:not([class*='exiting']) [class*='outcomeReward___'] [class*='reward___']");
	rewardElement.insertAdjacentElement("beforeend", valueElement);
}

function removeCrimeValue() {
	findAllElements(".tt-crime-value-text").forEach((x) => x.remove());
}

export default class CrimeValueFeature extends Feature {
	constructor() {
		super("Crime Value", "crimes");
	}

	async requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.crimes2.value;
	}

	initialise() {
		addListener();
	}

	cleanup() {
		removeCrimeValue();
	}

	storageKeys() {
		return ["settings.pages.crimes2.value"];
	}
}
