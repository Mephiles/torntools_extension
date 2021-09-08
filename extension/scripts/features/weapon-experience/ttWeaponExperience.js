"use strict";

(async () => {
	featureManager.registerFeature(
		"Weapon Experience",
		"attack",
		() => settings.pages.attack.weaponExperience,
		undefined,
		showExperience,
		removeExperience,
		{
			storage: ["settings.pages.attack.weaponExperience"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.weaponexp) return "No API access.";
		}
	);

	async function showExperience() {
		const attacker = await requireElement("#attacker");

		for (const weapon of attacker.findAll("#weapon_main, #weapon_second, #weapon_melee, #weapon_temp")) {
			const name = weapon.find("figure > img[alt]")?.getAttribute("alt");
			if (!name) continue;

			const experience = userdata.weaponexp.find((item) => item.name === name)?.exp;
			if (!experience) continue;

			weapon.classList.add("tt-weapon");
			weapon.appendChild(document.newElement({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
		}
	}

	function removeExperience() {
		document.findAll(".tt-weapon").forEach((weapon) => weapon.classList.remove("tt-weapon"));
		document.findAll(".tt-weapon-experience").forEach((experience) => experience.remove());
	}
})();
