import "./weapon-experience.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder, mobile, tablet } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
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
	const attacker = (await requireElement("[class*='green___']")).parentElement!;

	for (const weapon of findAllElements("#weapon_main, #weapon_second, #weapon_melee, #weapon_temp", attacker)) {
		if (weapon.className.includes("defender")) continue;

		const name = findElement("figure > img[alt]", weapon, true)?.getAttribute("alt");
		if (!name) continue;

		const experience = userdata.weaponexp.find((item) => item.name === name)?.exp;
		if (!experience) continue;

		const observer = new MutationObserver(() => {
			const target = findElement(`#${weapon.id}`, attacker, true);
			if (!target) return;

			if (!target.classList.contains("tt-weapon")) weapon.classList.add("tt-weapon");
			if (!findElement(".tt-weapon-experience", target, true))
				weapon.appendChild(elementBuilder({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
		});
		observer.observe(weapon, { childList: true, attributes: true });
		observers.push(observer);

		weapon.classList.add("tt-weapon");
		weapon.appendChild(elementBuilder({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
	}
}

export default class WeaponExperienceFeature extends Feature {
	constructor() {
		super("Weapon Experience", "attack");
	}

	override isEnabled(): boolean {
		return settings.pages.attack.weaponExperience;
	}

	override async initialise() {
		await initialiseListeners();
	}

	override async execute() {
		await showExperience();
	}

	override storageKeys() {
		return ["settings.pages.attack.weaponExperience"];
	}

	override requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.weaponexp) return "No API access.";
		return true;
	}
}
