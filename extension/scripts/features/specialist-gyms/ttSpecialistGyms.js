"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Specialist Gyms",
		"gym",
		() => settings.pages.gym.specialist,
		initialiseListeners,
		startFeature,
		dispose,
		{
			storage: ["settings.pages.gym.specialist"],
		},
		null
	);

	let battleStats = {};

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.GYM_LOAD].push(({ stats }) => {
			if (!feature.enabled()) return;

			battleStats = stats;
			updateStats();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.GYM_TRAIN].push(({ stats }) => {
			if (!feature.enabled()) return;

			battleStats = stats;
			updateStats();
		});
	}

	function startFeature() {
		const { content } = createContainer("Specialist Gyms", { class: "mt10", flexContainer: true, compact: true });

		content.appendChild(createSection(filters.gym.specialist1, (gym) => ttStorage.change({ filters: { gym: { specialist1: gym } } })));
		content.appendChild(createSection(filters.gym.specialist2, (gym) => ttStorage.change({ filters: { gym: { specialist2: gym } } })));

		function createSection(gym, callback) {
			const select = document.newElement({ type: "select", html: getGyms(), value: gym });
			const section = document.newElement({
				type: "div",
				class: "specialist-gym",
				children: [select, document.newElement({ type: "span", class: "specialist-gym-text" })],
			});

			select.addEventListener("change", async () => {
				updateStats();

				await callback(select.value);
			});

			return section;

			function getGyms() {
				return `
					<option value="none">None</option>
					<option value="balboas">Balboas Gym (def/dex)</option>
					<option value="frontline">Frontline Fitness (str/spd)</option>
					<option value="gym3000">Gym 3000 (str)</option>
					<option value="isoyamas">Mr. Isoyamas (def)</option>
					<option value="rebound">Total Rebound (spd)</option>
					<option value="elites">Elites (dex)</option>
				`;
			}
		}
	}

	function updateStats() {
		const SPECIALITY_GYMS = {
			balboas: ["defense", "dexterity"],
			frontline: ["strength", "speed"],
			gym3000: ["strength"],
			isoyamas: ["defense"],
			rebound: ["speed"],
			elites: ["dexterity"],
		};

		const allowedGains = Object.keys(battleStats).reduce((a, b) => ({ ...a, [b]: [] }), {});

		for (const section of document.findAll(".specialist-gym")) {
			const gym = section.find("select").value;

			const requiredStats = SPECIALITY_GYMS[gym];
			if (!requiredStats) {
				section.find("span").textContent = "";
				continue;
			}

			const primaryStats = {};
			const secondaryStats = {};
			for (const stat in battleStats) {
				if (requiredStats.includes(stat)) primaryStats[stat] = battleStats[stat];
				else secondaryStats[stat] = battleStats[stat];
			}

			let text, secondary, otherStats;
			let silentStats = [];
			const primary = Object.values(primaryStats).totalSum();
			if (requiredStats.length === 1) {
				secondary = Object.values(secondaryStats).findHighest();
				otherStats = [Object.entries(secondaryStats).find(([, value]) => value === secondary)[0]];
				silentStats = Object.keys(secondaryStats).filter((stat) => stat !== otherStats[0]);
			} else {
				secondary = Object.values(secondaryStats).totalSum();
				otherStats = Object.keys(battleStats).filter((stat) => !requiredStats.includes(stat));
			}

			if (primary >= 1.25 * secondary) {
				const amount = (primary / 1.25 - secondary).dropDecimals();

				otherStats.forEach((stat) => allowedGains[stat].push(amount));

				for (const stat of silentStats) {
					allowedGains[stat].push((primary / 1.25 - secondaryStats[stat]).dropDecimals());
				}

				text = `Gain no more than ${formatNumber(amount, { decimals: 0 })} ${otherStats.join(" and ")}.`;
			} else {
				const amount = (secondary * 1.25 - primary).dropDecimals();

				requiredStats.forEach((stat) => allowedGains[stat].push(-amount));

				text = `Gain ${formatNumber(amount, { decimals: 0 })} ${requiredStats.join(" and ")}.`;
			}

			if (text) section.find("span").textContent = text;
		}

		Object.entries(allowedGains).forEach(([stat, values]) => (allowedGains[stat] = values.length ? values.findLowest() : 0));

		const hasAllowed = Object.values(allowedGains).some((value) => !!value);

		const gymProperties = document.find("ul[class*='properties___']");
		for (const [stat, value] of Object.entries(allowedGains)) {
			let specialistStat = gymProperties.find(`.tt-specialist-stat[data-stat="${stat}"]`);

			if (!value && !hasAllowed) {
				if (specialistStat) specialistStat.remove();
				continue;
			}

			let text, colorClass, title;
			if (value > 0) {
				text = `Allowed: ${formatNumber(value, { decimals: 0 })}`;
				colorClass = "tt-color-green";
				title = `Gain no more than ${formatNumber(value, { decimals: 0 })} ${stat} to keep access to your selected gyms.`;
			} else if (value < 0) {
				text = `Required: ${formatNumber(-value, { decimals: 0 })}`;
				colorClass = "tt-color-red";
				title = `Gain ${formatNumber(-value, { decimals: 0 })} ${stat} to get your selected gyms.`;
			} else {
				text = "";
				title = false;
			}

			if (specialistStat) specialistStat.textContent = text;
			else {
				specialistStat = document.newElement({
					type: "div",
					class: "tt-specialist-stat",
					children: [document.newElement({ type: "p", text })],
					dataset: { stat },
				});

				gymProperties.find(`:scope > [class*='${stat}___'] [class*='propertyContent___']`).appendChild(specialistStat);
			}

			if (title) specialistStat.setAttribute("title", title);
			else specialistStat.removeAttribute("title");

			specialistStat.classList.remove("tt-color-green", "tt-color-red");
			if (colorClass) specialistStat.classList.add(colorClass);
		}
	}

	function dispose() {
		removeContainer("Specialist Gyms");

		for (const stat of document.findAll(".tt-specialist-stat")) stat.remove();
	}
})();
