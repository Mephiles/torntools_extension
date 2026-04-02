import "./gym-steadfast.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings, userdata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { convertToNumber, dropDecimals } from "@/utils/common/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";

interface SteadfastBonus {
	source: "faction" | "company" | "property" | "education" | "book";
	value: number;
}

function initialiseListeners() {
	CUSTOM_LISTENERS[EVENT_CHANNELS.GYM_LOAD].push(async () => {
		if (!settings.pages.gym.steadfast) return;

		await showSteadfast();
	});
}

async function showSteadfast() {
	const properties = ((await requireElement("#gymroot ul[class*='properties___'] [class*='strength___']")) as Element).closest(
		"#gymroot ul[class*='properties___']"
	);

	const factionPerks = userdata.faction_perks.filter((perk) => perk.includes("gym gains"));
	const jobPerks = userdata.job_perks.filter((perk) => perk.includes("gym gains"));
	const propertyPerk = userdata.property_perks.find((perk) => perk.includes("gym gains"));
	const eductionPerks = userdata.education_perks.filter((perk) => perk.includes("gym gains"));
	const bookPerk = userdata.book_perks.find((perk) => perk.includes("gym gains"))?.toLowerCase();

	const bonus: Record<string, SteadfastBonus[]> = {
		strength: [],
		defense: [],
		speed: [],
		dexterity: [],
	};
	Object.entries(bonus).forEach(([stat, values]) => {
		const factionPerk = factionPerks.find((perk) => perk.includes(stat));
		if (factionPerk) {
			values.push({ source: "faction", value: convertToNumber(factionPerk) });
		}

		const jobPerk = jobPerks.filter((perk) => perk.includes(stat) || perk.match(/\+ [0-9]+% gym gains?/));
		if (jobPerk.length) {
			let totalJob = jobPerk.map((perk) => 1 + convertToNumber(perk) / 100).reduce((total, value) => total * value, 1);
			totalJob -= 1;
			totalJob *= 100;
			totalJob = dropDecimals(totalJob);

			values.push({ source: "company", value: totalJob });
		}

		if (propertyPerk) {
			values.push({ source: "property", value: convertToNumber(propertyPerk) });
		}

		const eductionPerk = eductionPerks.filter((perk) => perk.includes(stat) || perk.match(/\+ [0-9]+% gym gains?/));
		if (eductionPerk.length) {
			let totalEducation = eductionPerk.map((perk) => 1 + convertToNumber(perk) / 100).reduce((total, value) => total * value, 1);
			totalEducation -= 1;
			totalEducation *= 100;
			totalEducation = dropDecimals(totalEducation);

			values.push({ source: "education", value: totalEducation });
		}

		if (bookPerk && (bookPerk.includes(" all ") || bookPerk.includes(stat))) {
			values.push({ source: "book", value: convertToNumber(bookPerk) });
		}
	});

	const maxBonus = Object.values(bonus)
		.map((x) => x.filter((y) => ["company", "faction"].includes(y.source)).length)
		.reduce((a, b) => Math.max(a, b), 0);

	for (const [stat, perks] of Object.entries(bonus)) {
		if (perks.length < 1) continue;

		const box = properties.querySelector(`[class*='${stat}___']`);
		if (box.querySelector(".tt-gym-steadfast")) continue;

		const parent = elementBuilder({ type: "div", class: "tt-gym-steadfast", style: { height: `${maxBonus * 12}px` } });
		box.insertBefore(parent, box.firstElementChild);

		for (const perk of perks) {
			let title: string;
			switch (perk.source) {
				case "company":
					title = "Company";
					break;
				case "faction":
					title = "Steadfast";
					break;
				default:
					// Ignoring all other types for now.
					continue;
			}

			parent.appendChild(elementBuilder({ type: "span", text: `${title}: ${perk.value}%` }));
		}

		if (perks.length > 1) {
			let totalBonus = perks.map((perk) => 1 + perk.value / 100).reduce((total, value) => total * value, 1);
			totalBonus -= 1;
			totalBonus *= 100;

			parent.dataset.total = (Math.round(totalBonus * 10) / 10).toFixed(1);
		}
	}
}

function removeSteadfast() {
	for (const steadfast of findAllElements(".tt-gym-steadfast")) steadfast.remove();
}

export default class GymSteadfastFeature extends Feature {
	constructor() {
		super("Gym Steadfast", "gym");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.gym.steadfast;
	}

	initialise() {
		initialiseListeners();
	}

	async execute() {
		await showSteadfast();
	}

	cleanup() {
		removeSteadfast();
	}

	storageKeys() {
		return ["settings.pages.gym.steadfast"];
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.perks) return "No API access.";

		return true;
	}
}
