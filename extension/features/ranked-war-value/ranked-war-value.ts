import styles from "./ranked-war-value.module.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, torndata } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { hasAPIData } from "@/utils/common/functions/api";
import { formatNumber } from "@/utils/common/functions/formatting";

const REGEX_REWARD_LINE = /.*received .* bonus respect, (.*)/;
const REGEX_ITEM_ENTRY = /(\d+)x (.*)/;

async function showRWValue() {
	await requireElement(".members-bonus-row");

	findAllElements(".members-bonus-row").forEach((rewardRow) => {
		const matchedReward = rewardRow.textContent.match(REGEX_REWARD_LINE);
		if (!matchedReward) return;

		const items = matchedReward[1]
			.split(", ")
			.map((itemEntry) => {
				const itemMatch = itemEntry.match(REGEX_ITEM_ENTRY);
				if (!itemMatch) return null;

				const quantity = parseInt(itemMatch[1]);
				const itemName = itemMatch[2].trim();
				const item = torndata.items.find((item) => item.name === itemName);
				if (!item) return null;

				return quantity * item.value.market_price;
			})
			.filter((x) => !!x);

		const value = items.reduce((total, value) => total + value, 0);

		rewardRow.appendChild(
			elementBuilder({
				type: "div",
				class: styles.rankedWarValue,
				text: `Total Value: ${formatNumber(value, { currency: true })}`,
			})
		);
	});
}

function removeValue() {
	console.log("DKK remove value");
}

export default class RankedWarValueFeature extends Feature {
	constructor() {
		super("Ranked War Value", "faction");
	}

	precondition() {
		return getPageStatus().access;
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.pages.faction.rankedWarValue;
	}

	async execute() {
		await showRWValue();
	}

	cleanup() {
		removeValue();
	}

	storageKeys() {
		return ["settings.pages.faction.rankedWarValue"];
	}
}
