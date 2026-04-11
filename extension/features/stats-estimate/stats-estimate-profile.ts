import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { elementBuilder, isTextNode } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, isOwnProfile } from "@/utils/common/functions/torn";
import { StatsEstimate } from "./stats-estimate";

const statsEstimate = new StatsEstimate("Profile", false);

let observer: MutationObserver | undefined;

async function showEstimate() {
	const userInfoValue = await requireElement(".basic-information .info-table .user-info-value > *:first-child");

	if (settings.scripts.statsEstimate.maxLevel && settings.scripts.statsEstimate.maxLevel < getLevel()) return;

	const id = parseInt(userInfoValue.textContent.trim().match(/\[(\d*)]/i)[1]);

	const estimate = await statsEstimate.fetchEstimate(id);

	const title = document.querySelector(".profile-right-wrapper > .profile-action .title-black");

	title.appendChild(elementBuilder({ type: "span", class: "tt-stats-estimate-profile", text: estimate }));

	observer?.disconnect();
	observer = new MutationObserver((mutations) => {
		if (!mutations.some((mutation) => Array.from(mutation.addedNodes).every(isTextNode))) return;
		if (title.querySelector(".tt-stats-estimate-profile")) return;

		title.appendChild(elementBuilder({ type: "span", class: "tt-stats-estimate-profile", text: estimate }));
	});
	observer.observe(title, { childList: true });

	function getLevel() {
		const levelWrap = document.querySelector(".box-info .box-value");

		return (
			(parseInt(levelWrap.querySelector(".digit-r .digit").textContent) || 0) * 100 +
			(parseInt(levelWrap.querySelector(".digit-m .digit").textContent) || 0) * 10 +
			parseInt(levelWrap.querySelector(".digit-l .digit").textContent)
		);
	}
}

function removeEstimate() {
	observer?.disconnect();
	observer = undefined;

	document.querySelector(".tt-stats-estimate-profile")?.remove();
}

export default class StatsEstimateProfileFeature extends Feature {
	constructor() {
		super("Stats Estimate Profile", "profiles");
	}

	precondition() {
		return getPageStatus().access && !isOwnProfile();
	}

	requirements() {
		if (!hasAPIData()) return "No API access.";

		return true;
	}

	isEnabled() {
		return settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.profiles;
	}

	async execute() {
		await showEstimate();
	}

	cleanup() {
		removeEstimate();
	}

	storageKeys(): string[] {
		return ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.profiles"];
	}
}
