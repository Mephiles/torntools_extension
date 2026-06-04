import "./weapon-experience.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, findAllElements, mobile, tablet } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";

const observers: MutationObserver[] = [];

async function initialiseListeners() {
	if (mobile || tablet) {
		const area = await requireElement("[class*='weaponList___']");

		new MutationObserver(showExperience).observe(area, { childList: true });
	}
}

async function showExperience() {
	const attacker = ((await requireElement("[class*='green___']")) as Element).parentElement;

	for (const weapon of findAllElements("#weapon_main, #weapon_second, #weapon_melee, #weapon_temp", attacker)) {
		if (weapon.className.includes("defender")) continue;

		const name = weapon.querySelector("figure > img[alt]")?.getAttribute("alt");
		if (!name) continue;

		const experience = userdata.weaponexp.find((item) => item.name === name)?.exp;
		if (!experience) continue;

		const observer = new MutationObserver(() => {
			const target = attacker.querySelector(`#${weapon.id}`);
			if (!target) return;

			if (!target.classList.contains("tt-weapon")) weapon.classList.add("tt-weapon");
			if (!target.querySelector(".tt-weapon-experience"))
				weapon.appendChild(elementBuilder({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
		});
		observer.observe(weapon, { childList: true, attributes: true });
		observers.push(observer);

		weapon.classList.add("tt-weapon");
		weapon.appendChild(elementBuilder({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
	}
}

function removeExperience() {
	while (observers.length) observers.pop().disconnect();

	findAllElements(".tt-weapon").forEach((weapon) => weapon.classList.remove("tt-weapon"));
	findAllElements(".tt-weapon-experience").forEach((experience) => experience.remove());
}

export default class WeaponExperienceFeature extends Feature {
	constructor() {
		super("Weapon Experience", "attack");
	}

	isEnabled(): boolean {
		return settings.pages.attack.weaponExperience;
	}

	async initialise() {
		await initialiseListeners();
	}

	async execute() {
		await showExperience();
	}

	cleanup() {
		removeExperience();
	}

	storageKeys() {
		return ["settings.pages.attack.weaponExperience"];
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.weaponexp) return "No API access.";
		return true;
	}
}
