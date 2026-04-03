import "./mission-rewards.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, torndata, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { formatNumber } from "@/utils/common/functions/formatting";
import { findItemInList } from "@/utils/common/functions/utilities";
import { UserV1Ammo } from "@/utils/common/functions/api-v1.types";

function initialise() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.MISSION_REWARDS].push(async () => {
		if (!FEATURE_MANAGER.isEnabled(MissionRewardsFeature)) return;

		await showRewards();
	});
}

async function showRewards() {
	await requireElement("ul.rewards-list li");

	const credits = parseInt(document.querySelector(".total-mission-points").textContent.replace(",", ""));

	for (const reward of findAllElements(".rewards-list li")) {
		const information = JSON.parse(reward.dataset.ammoInfo);
		const { points, basicType: type } = information;

		// Show if you can afford it.
		const actionsWrap = reward.querySelector(".act-wrap");
		actionsWrap.classList.add("tt-mission-reward", credits < points ? "not-affordable" : "affordable");

		if (type === "Ammo") {
			const { title: size, ammoType } = information;

			// @ts-expect-error Bundling Migration; wrong type in tornapi-typescript
			const ammo: UserV1Ammo[] = userdata.ammo;
			const found = findItemInList<UserV1Ammo>(ammo, { size, type: ammoType });
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
				actionsWrap.querySelector(".actions")
			);
			reward.classList.add("tt-modified");
		} else if (type === "Item") {
			const { image: id, amount } = information;
			if (!id || typeof id !== "number") continue;

			const value = torndata.itemsMap[id].value.market_price;
			const totalValue = amount * value;

			reward
				.querySelector(".img-wrap")
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
				actionsWrap.querySelector(".actions")
			);
			reward.classList.add("tt-modified");
		}
	}
}

export default class MissionRewardsFeature extends Feature {
	constructor() {
		super("Mission Rewards", "missions");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.missions.rewards;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await showRewards();
	}

	storageKeys() {
		return ["settings.pages.missions.rewards"];
	}

	async requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.ammo) return "No API access.";
		return true;
	}
}
