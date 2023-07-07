"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Gym Steadfast",
		"gym",
		() => settings.pages.gym.steadfast,
		initialiseListeners,
		showSteadfast,
		removeSteadfast,
		{
			storage: ["settings.pages.gym.steadfast"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.perks) return "No API access.";
		}
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.GYM_LOAD].push(() => {
			if (!feature.enabled()) return;

			showSteadfast();
		});
	}

	async function showSteadfast() {
		const properties = await requireElement("#gymroot ul[class*='properties___']");

		const factionPerks = userdata.faction_perks.filter((perk) => perk.includes("gym gains"));
		const jobPerks = userdata.job_perks.filter((perk) => perk.includes("gym gains"));
		const propertyPerk = userdata.property_perks.find((perk) => perk.includes("gym gains"));
		const eductionPerks = userdata.education_perks.filter((perk) => perk.includes("gym gains"));
		const bookPerk = userdata.book_perks.find((perk) => perk.includes("gym gains"));

		const bonus = {
			strength: [],
			defense: [],
			speed: [],
			dexterity: [],
		};
		Object.entries(bonus).forEach(([stat, values]) => {
			const factionPerk = factionPerks.find((perk) => perk.includes(stat));
			if (factionPerk) {
				values.push({ source: "faction", value: factionPerk.getNumber() });
			}

			const jobPerk = jobPerks.filter((perk) => perk.includes(stat) || perk.match(/\+ [0-9]+% gym gains?/));
			if (jobPerk.length) {
				let totalJob = jobPerk.map((perk) => 1 + perk.getNumber() / 100).reduce((total, value) => total * value, 1);
				totalJob -= 1;
				totalJob *= 100;
				totalJob = totalJob.dropDecimals();

				values.push({ source: "company", value: totalJob });
			}

			if (propertyPerk) {
				values.push({ source: "property", value: propertyPerk.getNumber() });
			}

			const eductionPerk = eductionPerks.filter((perk) => perk.includes(stat) || perk.match(/\+ [0-9]+% gym gains?/));
			if (eductionPerk.length) {
				let totalEducation = eductionPerk.map((perk) => 1 + perk.getNumber() / 100).reduce((total, value) => total * value, 1);
				totalEducation -= 1;
				totalEducation *= 100;
				totalEducation = totalEducation.dropDecimals();

				values.push({ source: "education", value: totalEducation });
			}

			if (bookPerk) {
				values.push({ source: "book", value: bookPerk.getNumber() });
			}
		});

		const maxBonus = Object.values(bonus)
			.map((x) => x.filter((y) => ["company", "faction"].includes(y.source)).length)
			.findHighest();

		for (const [stat, perks] of Object.entries(bonus)) {
			if (perks.length < 1) continue;

			const box = properties.find(`[class*='${stat}___']`);
			if (box.find(".tt-gym-steadfast")) continue;

			const parent = document.newElement({ type: "div", class: "tt-gym-steadfast", style: { height: `${maxBonus * 12}px` } });
			box.insertBefore(parent, box.firstElementChild);

			for (const perk of perks) {
				let title;
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

				parent.appendChild(document.newElement({ type: "span", text: `${title}: ${perk.value}%` }));
			}

			if (perks.length > 1) {
				let totalBonus = perks.map((perk) => 1 + perk.value / 100).reduce((total, value) => total * value, 1);
				totalBonus -= 1;
				totalBonus *= 100;
				totalBonus = (Math.round(totalBonus * 10) / 10).toFixed(1);

				parent.dataset.total = totalBonus;
			}
		}
	}

	function removeSteadfast() {
		for (const steadfast of document.findAll(".tt-gym-steadfast")) steadfast.remove();
	}
})();
