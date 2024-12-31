"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const TYPES = {
		Debuff: "Enemy Debuff",
		Damage: "Damage Bonus",
		DOT: "DOT",
		Happy: "Happy Bonus",
		DamagePenalty: "Damage Penalty",
		Passive: "Passive",
	};
	const BONUSES = {
		Demoralized: {
			weapons: [{ id: 382, name: "Gold Plated AK-47" }],
			type: TYPES.Debuff,
			description:
				"Demoralized provides an additive 10% passive debuff to each of your opponents battle stats. Up to 5 of these may stack at once, for a 50% debuff to all stats.",
		},
		Freeze: {
			weapons: [{ id: 76, name: "Snow Cannon" }],
			type: TYPES.Debuff,
			description:
				"Freeze provides an additive 50% passive debuff to your opponents speed and dexterity. Only one of these can be applied at once, although it can be applied simultaneously with other passive effects.",
		},
		Blindfire: {
			weapons: [{ id: 837, name: "Rheinmetall MG3" }],
			type: TYPES.Damage,
			description:
				"Blindfire causes you to expend the remaining ammunition in your current clip in as many actions as required, in a single turn. With each successful action, the accuracy of the MG3 is reduced by 5.00.",
		},
		Poisoned: {
			weapons: [{ id: 244, name: "Blowgun" }],
			type: TYPES.DOT,
			description:
				"Poisoned causes a long DOT effect, with damage ticks starting at 95% that of the damage dealt when the proc occurs, and reducing to zero over 19 turns.",
		},
		Burning: {
			weapons: [{ id: 255, name: "Flamethrower" }],
			type: TYPES.DOT,
			description:
				"Burning causes a short DOT effect, with damage ticks starting at 45% that of the damage dealt when proc occurs, and reducing to zero over 3 turns.",
		},
		Laceration: {
			weapons: [{ id: 1053, name: "Bread Knife" }],
			type: TYPES.DOT,
			description:
				"Laceration causes a devastating DOT effect, with damage ticks starting at 90% that of the damage dealt when proc occurs, and reducing to zero over 9 turns.",
		},
		SevereBurning: {
			weapons: [{ id: 742, name: "Molotov Cocktail" }],
			type: TYPES.DOT,
			description:
				"Severe Burning causes a short DOT effect, with damage ticks starting at 45% that of the damage dealt when proc occurs, and reducing to zero over 3 turns.",
		},
		Spray: {
			weapons: [
				{ id: 545, name: "Dual TMPs" },
				{ id: 546, name: "Dual Bushmasters" },
				{ id: 547, name: "Dual MP5s" },
				{ id: 548, name: "Dual P90s" },
				{ id: 549, name: "Dual Uzis" },
			],
			type: TYPES.Damage,
			description:
				"Spray causes an entire clip to be emptied into an opponent in a single turn, causing twice the damage of a regular hit. This can only proc while a clip is full.",
		},
		Emasculate: {
			weapons: [{ id: 388, name: "Pink MAC-10" }],
			type: TYPES.Happy,
			description:
				"If the Pink MAC-10 is used for the finishing hit when you defeat someone, you will receive a percentage (the special bonus percentage) of your maximum happy.",
		},
		Hazardous: {
			weapons: [{ id: 830, name: "Nock Gun" }],
			type: TYPES.Debuff,
			description: "Hazardous causes you to receive a percentage of the damage you deal to someone else in the same hit.",
		},
		Storage: {
			weapons: [{ id: 387, name: "Handbag" }],
			type: TYPES.Passive,
			description:
				"Storage allows you to use two temporary items in a fight. You must use up an additional turn in order to withdraw the second temporary item.",
		},
		Toxin: {
			weapons: [{ id: 1055, name: "Poison Umbrella" }],
			type: TYPES.Debuff,
			description:
				"Toxin applies a 25% passive debuff to an opponents stats (random between: 'Wither' - Strength, 'Slow' - Speed, 'Cripple' - Dexterity, 'Weaken' - Defense). Up to 3 of each may stack, for -75%.",
		},
		Sleep: {
			weapons: [{ id: 844, name: "Tranquilizer Gun" }],
			type: TYPES.Debuff,
			description: "Sleep will cause your enemy to miss turns until they receive damage.",
		},
	};

	const feature = featureManager.registerFeature(
		"Weapon Bonus Information",
		"attack log",
		() => settings.pages.attack.bonusInformation,
		initialiseListeners,
		showInformation,
		null,
		{
			storage: ["settings.pages.attack.bonusInformation"],
		},
		null
	);

	function initialiseListeners() {
		addXHRListener(({ detail: { page, uri } }) => {
			if (!feature.enabled()) return;
			if (page !== "loader") return;

			if (uri.sid === "getAttackLogSequence") showInformation();
		});
	}

	function showInformation() {
		// TODO - Spray					Dual SMGs				Damage Bonus
		// TODO - Emasculate			Pink MAC-10				Happy Bonus
		// TODO - Hazardous				Nock Gun				Damage Penalty
		// TODO - Storage				Handbag					Passive
		// TODO - Toxin // wither		Poison Umbrella			Debuff
		// TODO - Sleep (unreleased)	Tranquilizer Gun		Debuff

		for (const log of document.findAll(".log-list > li:not(.tt-modified)")) {
			log.classList.add("tt-modified");

			const icon = log.find(".message-wrap span:first-child").classList[0];
			const messageElement = log.find(".message");

			let bonus;
			switch (icon) {
				case "attacking-events-demoralized":
					bonus = BONUSES.Demoralized;
					break;
				case "attacking-events-frozen":
					bonus = BONUSES.Freeze;
					break;
				case "attacking-events-lacerated":
					if (messageElement.textContent.includes("is lacerated")) bonus = BONUSES.Laceration;
					else continue;
					break;
				case "attacking-events-poisoned":
					if (messageElement.textContent.includes("is poisoned")) bonus = BONUSES.Poisoned;
					else continue;
					break;
				case "attacking-events-blindfire":
					bonus = BONUSES.Blindfire;
					break;
				case "attacking-events-burn":
				case "attacking-events-burning":
					if (messageElement.textContent.includes("is set alight")) bonus = BONUSES.Burning;
					else if (messageElement.textContent.includes("is set ablaze")) bonus = BONUSES.SevereBurning;
					else continue;
					break;
				case "attacking-events-slowed":
				case "attacking-events-weakened":
				case "attacking-events-crippled":
					if (log.nextElementSibling && log.nextElementSibling.textContent.includes("Poison Umbrella")) bonus = BONUSES.Toxin;
					else continue;
					break;
				default:
					continue;
			}

			messageElement.appendChild(
				document.newElement({
					type: "div",
					class: "tt-bonus-information",
					children: [document.newElement({ type: "i", class: "fa-solid fa-circle-info", attributes: { title: bonus.description } })],
				})
			);
		}
	}
})();
