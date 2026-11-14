import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { addFetchListener } from "@common/utils/functions/listeners";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import type { TornGymsResponse, UserBarsResponse, UserGymResponse } from "tornapi-typescript";
import { estimateGymGains, gymPerkMultiplier } from "./gym-gain-calculation";
import styles from "./gym-gain-estimate.module.css";

const STATS = ["strength", "defense", "speed", "dexterity"] as const;
let gyms: TornGymsResponse["gyms"] | undefined;
let requestId = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleRefresh() {
	clearTimeout(timer);
	timer = setTimeout(() => void refresh(), 750);
}

async function refresh() {
	if (!settings.pages.gym.gainEstimate) return;
	const request = ++requestId;
	try {
		const [user, gymData] = await Promise.all([
			fetchData<UserBarsResponse & UserGymResponse>("tornv2", { section: "user", selections: ["bars", "gym"], relay: true, silent: true }),
			gyms ? Promise.resolve({ gyms }) : fetchData<TornGymsResponse>("tornv2", { section: "torn", selections: ["gyms"], relay: true, silent: true }),
		]);
		if (request !== requestId || !settings.pages.gym.gainEstimate) return;
		gyms = gymData.gyms;
		const gym = gyms.find((item) => item.id === user.gym.id);
		if (!gym || !user.bars?.happy || !user.bars?.energy) return;
		for (const stat of STATS) {
			const row = findElement(`#gymroot ul[class*='properties_'] li[class*='${stat}_']`, true);
			const statValue = row && findElement("[class*='propertyValue_']", row, true);
			if (!row || !statValue) continue;
			const value = Number(statValue.textContent.replaceAll(",", "").trim());
			const dots = gym.modifiers[stat] / 10;
			const trains = Math.floor(user.bars.energy.current / gym.energy_cost);
			const perksAvailable = settings.apiUsage.user.perks && userdata.perks;
			const multiplier = perksAvailable ? gymPerkMultiplier(Object.values(userdata.perks).flat(), stat) : 1;
			const one = estimateGymGains(value, user.bars.happy.current, dots, gym.energy_cost, 1, multiplier);
			const total = estimateGymGains(value, user.bars.happy.current, dots, gym.energy_cost, trains, multiplier);
			let display = findElement(`.${styles.gainEstimate}`, row, true);
			if (one === null || total === null) {
				display?.remove();
				continue;
			}
			if (!display) {
				display = document.createElement("div");
				display.className = styles.gainEstimate;
				row.appendChild(display);
			}
			display.textContent = `Estimated ${perksAvailable ? "" : "base "}gain: ${formatNumber(one)} / train; ${formatNumber(total)} for ${trains} trains`;
			display.title = perksAvailable
				? "Approximate gains include recognized gym perks; other bonuses may be missing. Happiness decreases between trains."
				: "Approximate base gains before perks and other bonuses. Happiness decreases between trains.";
		}
	} catch {
		if (request !== requestId) return;
		// API access may be unavailable; do not display stale estimates.
		for (const stat of STATS) findElement(`#gymroot li[class*='${stat}_'] .${styles.gainEstimate}`, true)?.remove();
	}
}

export default class GymGainEstimateFeature extends Feature {
	constructor() {
		super("Gym Gain Estimate", "gym");
	}

	override isEnabled() {
		return settings.pages.gym.gainEstimate;
	}

	override requirements() {
		return hasAPIData() || "No API access.";
	}

	override precondition() {
		return getPageStatus().access;
	}

	override initialise() {
		addCustomListener(EVENT_CHANNELS.GYM_LOAD, scheduleRefresh);
		addCustomListener(EVENT_CHANNELS.GYM_TRAIN, scheduleRefresh);
		addFetchListener(({ detail }) => {
			if (detail.page === "gym" && new URL(detail.fetch.url).searchParams.get("step") === "changeGym" && detail.json?.success) scheduleRefresh();
		});
	}

	override execute() {
		scheduleRefresh();
	}

	override storageKeys() {
		return ["settings.pages.gym.gainEstimate"];
	}
}
