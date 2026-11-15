import { settings, torndata, userdata } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { addFetchListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus, getUserBar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { estimateGymGains, gymPerkMultiplier } from "./gym-gain-calculation";
import styles from "./gym-gain-estimate.module.css";

const STATS = ["strength", "defense", "speed", "dexterity"] as const;
let timer: ReturnType<typeof setTimeout> | undefined;

function scheduleRefresh() {
	clearTimeout(timer);
	timer = setTimeout(() => void refresh(), 750);
}

async function refresh() {
	const logo = await requireElement<HTMLImageElement>("#gymroot img[class*='logo_']");
	const gym = torndata.gyms?.find((item) => item.name === logo.alt);
	if (!gym) return;

	const [energy] = getUserBar("energy");
	const [happy] = getUserBar("happy");
	const trains = Math.floor(energy / gym.energy_cost);

	for (const stat of STATS) {
		const row = findElement(`#gymroot ul[class*='properties_'] li[class*='${stat}_']`);
		const description = findElement("[class*='description_']", row);
		const value = Number(findElement("[class*='propertyValue_']", row).textContent.replaceAll(",", "").trim());
		const perksAvailable = settings.apiUsage.user.perks && userdata.perks;
		const multiplier = perksAvailable ? gymPerkMultiplier(Object.values(userdata.perks).flat(), stat) : 1;
		const estimate = estimateGymGains(value, happy, gym.modifiers[stat], gym.energy_cost, trains, multiplier, stat);
		let display = findElement(`.${styles.gainEstimate}`, description, true);
		if (!display) {
			display = elementBuilder({ type: "div", class: styles.gainEstimate });
			description.appendChild(display);
		}
		display.textContent = `Est. ${perksAvailable ? "" : "base "}gain: +${formatNumber(estimate.one, { decimals: 2 })} / train\n+${formatNumber(estimate.total, { decimals: 2 })} for ${trains} ${trains === 1 ? "train" : "trains"}`;
		display.title = "Approximate gain. Some bonuses may be missing; happiness loss varies between trains.";
	}
}

export default class GymGainEstimateFeature extends Feature {
	constructor() {
		super("Gym Gain Estimate", "gym");
	}

	override isEnabled() {
		return settings.pages.gym.gainEstimate;
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
