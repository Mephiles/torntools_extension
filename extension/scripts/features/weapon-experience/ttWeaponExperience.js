"use strict";

(async () => {
	const { mobile, tablet } = await checkDevice();

	featureManager.registerFeature(
		"Weapon Experience",
		"attack",
		() => settings.pages.attack.weaponExperience,
		initialiseListeners,
		showExperience,
		removeExperience,
		{
			storage: ["settings.pages.attack.weaponExperience"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.weaponexp) return "No API access.";
		}
	);

	let observers = [];

	async function initialiseListeners() {
		if (mobile || tablet) {
			const area = await requireElement("[class*='weaponList___']");

			new MutationObserver(showExperience).observe(area, { childList: true });
		}
	}

	async function showExperience() {
		const attacker = (await requireElement("[class*='green___']")).parentElement;

		for (const weapon of attacker.findAll("#weapon_main, #weapon_second, #weapon_melee, #weapon_temp")) {
			if (weapon.className.includes("defender")) continue;

			const name = weapon.find("figure > img[alt]")?.getAttribute("alt");
			if (!name) continue;

			const experience = userdata.weaponexp.find((item) => item.name === name)?.exp;
			if (!experience) continue;

			const observer = new MutationObserver(() => {
				const target = attacker.find(`#${weapon.id}`);
				if (!target) return;

				if (!target.classList.contains("tt-weapon")) weapon.classList.add("tt-weapon");
				if (!target.find(".tt-weapon-experience"))
					weapon.appendChild(document.newElement({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
			});
			observer.observe(weapon, { childList: true, attributes: true });
			observers.push(observer);

			weapon.classList.add("tt-weapon");
			weapon.appendChild(document.newElement({ type: "div", class: "tt-weapon-experience", text: `XP: ${experience}%` }));
		}
	}

	function removeExperience() {
		while (observers.length) observers.pop().disconnect();

		document.findAll(".tt-weapon").forEach((weapon) => weapon.classList.remove("tt-weapon"));
		document.findAll(".tt-weapon-experience").forEach((experience) => experience.remove());
	}
})();
