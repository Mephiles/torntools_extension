const GYM_SELECTORS = {
	strength: "strength___1GeGr",
	speed: "speed___1o1b_",
	defense: "defense___311kR",
	dexterity: "dexterity___1YdUM",
};

const STATS = {};

requireDatabase().then(() => {
	gymLoaded().then(() => {
		addFetchListener((event) => {
			if (!event.detail) return;
			const { page, json, fetch } = event.detail;
			if (page !== "gym" || !json) return;

			const params = new URL(fetch.url).searchParams;
			const step = params.get("step");

			switch (step) {
				case "getInitialGymInfo":
					disableGyms();

					for (let stat in json.stats) {
						STATS[stat] = parseInt(json.stats[stat].value.replaceAll(",", ""));
					}
					setupSpecialtyGym();
					break;
				case "train":
					if (!json.success) break;

					STATS[json.stat.name] = parseInt(json.stat.newValue.replaceAll(",", ""));
					setupSpecialtyGym();
					break;
			}
		});

		for (let stat of ["strength", "defense", "speed", "dexterity"]) {
			STATS[stat] = parseInt(doc.find(`#${stat}-val`).innerText.replaceAll(",", ""));
		}
		setupSpecialtyGym();

		let gym_container = content.newContainer("Gym", { id: "tt-gym" });

		// Graph
		if (!shouldDisable()) {
			displayGraph();
		}

		// Energy needed for next gym estimates
		if (settings.pages.gym.estimated_energy) {
			let div = doc.new({ type: "div", id: "ttEnergyEstimate" });

			gym_container.find(".content").appendChild(div);
			showProgress();
		}

		// Disable buttons
		let div = doc.new({ type: "div", class: "tt-checkbox-wrap" });
		let checkbox = doc.new({ type: "input", id: "tt-gym-global-disable", attributes: { type: "checkbox" } });
		let div_text = doc.new({ type: "div", text: "Disable Gym buttons" });

		div.appendChild(checkbox);
		div.appendChild(div_text);
		gym_container.find(".content").appendChild(div);

		checkbox.addEventListener("click", () => {
			if (checkbox.checked) {
				disableGymButton(["strength", "speed", "dexterity", "defense"], true);
			} else {
				disableGymButton(["strength", "speed", "dexterity", "defense"], false);
			}
		});

		disableGyms();

		// Train button listeners
		new MutationObserver((mutations) => {
			for (let mutation of mutations) {
				const checkbox = mutation.target.find(".tt-gym-stat-checkbox");
				if (!checkbox) continue;

				let classList = mutation.target.classList;
				if (!classList.contains("tt-gym-locked") && checkbox.checked === true) {
					classList.add("tt-gym-locked");
				} else if (mutation.target.classList.contains("tt-gym-locked") && checkbox.checked === false) {
					classList.remove("tt-gym-locked");
				}
			}
		}).observe(doc.find("ul.properties___Vhhr7"), { classList: true, attributes: true, subtree: true });
	});
});

function gymLoaded() {
	return requireElement(".gymButton___3OFdI, .jail .button___3AlDV");
}

function showProgress() {
	let gym_goals = [
		200,
		500,
		1000,
		2000,
		2750,
		3000,
		3500,
		4000,
		6000,
		7000,
		8000,
		11000,
		12420,
		18000,
		18100,
		24140,
		31260,
		36610,
		46640,
		56520,
		67775,
		84535,
		106305,
	];

	let in_prog_gym = doc.find(".gymButton___3OFdI.inProgress___1Nd26");
	if (!in_prog_gym) return;

	let index = parseInt(in_prog_gym.id.split("-")[1]) - 2;
	let percentage = parseInt(in_prog_gym.find(".percentage___1vHCw").innerText.replace("%", ""));
	let goal = gym_goals[index];
	for (let perk of userdata.company_perks) {
		if (perk.indexOf("increased gym experience") > -1) {
			goal = parseInt(goal / 1.3);
			break;
		}
	}

	let stat = parseInt((goal * (percentage / 100)).toFixed(0));

	console.log("Estimated stat", stat);
	console.log("Estimated goal", goal);

	if (!stat || !goal) return;
	doc.find("#ttEnergyEstimate").innerText = `Estimated Energy progress: ${numberWithCommas(stat, false)}E/${numberWithCommas(goal, false)}E`;
}

function displayGraph() {
	const container = doc.find("#tt-gym .content");
	const graph_area = doc.new({ type: "div", class: "tt-graph-area" });
	container.appendChild(graph_area);

	fetchApi_v2("tornstats", { section: "api.php", action: "getStatGraph", from: ((new Date() - 2 * 24 * 60 * 60 * 1000) / 1000).toFixed(0) })
		.then((result) => {
			let w = mobile ? "312" : "784";
			let h = mobile ? "200" : "250";
			let canvas = doc.new({ type: "canvas", id: "tt-gym-graph", attributes: { width: w, height: h } });
			graph_area.appendChild(canvas);

			let ctx = doc.find("#tt-gym-graph").getContext("2d");
			new Chart(ctx, {
				type: "line",
				data: {
					labels: result.data.map((x) => {
						let date = new Date(x.timestamp * 1000);
						return formatDate([date.getDate(), date.getMonth() + 1, 0], settings.format.date);
					}),
					datasets: [
						{
							label: "Strength",
							data: result.data.map((x) => x.strength),
							borderColor: ["#3366CC"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#3366CC",
							pointHoverRadius: 5,
						},
						{
							label: "Defense",
							data: result.data.map((x) => x.defense),
							borderColor: ["#DC3912"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#DC3912",
							pointHoverRadius: 5,
						},
						{
							label: "Speed",
							data: result.data.map((x) => x.speed),
							borderColor: ["#FF9901"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#FF9901",
							pointHoverRadius: 5,
						},
						{
							label: "Dexterity",
							data: result.data.map((x) => x.dexterity),
							borderColor: ["#109618"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#109618",
							pointHoverRadius: 5,
						},
						{
							label: "Total",
							data: result.data.map((x) => x.total),
							borderColor: ["#990199"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#990199",
							pointHoverRadius: 5,
							hidden: true,
						},
					],
				},
				options: {
					scales: {
						yAxes: [
							{
								ticks: {
									step: 2000000,
									callback: (value) => numberWithCommas(value, mobile),
								},
							},
						],
					},
					legend: {
						position: mobile ? "bottom" : "right",
						labels: {
							boxWidth: 13,
						},
					},
					tooltips: {
						intersect: false,
						mode: "index",
						// enabled: true,
						// mode: "y",
						callbacks: {
							label: (tooltipItem, data) => `${data.datasets[tooltipItem.datasetIndex].label}: ${numberWithCommas(tooltipItem.yLabel, false)}`,
						},
					},
					hover: {
						intersect: false,
						mode: "index",
					},
				},
			});

			// Update TornStats button
			let update_button = doc.new({ type: "button", text: "Update TornStats", class: "update-button tt-torn-button" });
			graph_area.appendChild(update_button);

			update_button.addEventListener("click", () => {
				if (graph_area.find(".response-message")) graph_area.find(".response-message").remove();
				if (graph_area.find(".tt-info-message")) graph_area.find(".tt-info-message").remove();

				const response_div = doc.new({ type: "div", class: "response-message" });
				graph_area.appendChild(response_div);

				fetchApi_v2("tornstats", { section: "api.php", action: "recordStats" })
					.then((result) => {
						console.log("result", result);

						response_div.classList.add("success");
						response_div.innerText = result.message;

						let gains = [];
						let update_message = `You have gained `;

						if (result.deltaStrength !== 0) {
							gains.push(`${numberWithCommas(result.deltaStrength, false)} Strength`);
						}
						if (result.deltaDefense !== 0) {
							gains.push(`${numberWithCommas(result.deltaDefense, false)} Defense`);
						}
						if (result.deltaDexterity !== 0) {
							gains.push(`${numberWithCommas(result.deltaDexterity, false)} Dexterity`);
						}
						if (result.deltaSpeed !== 0) {
							gains.push(`${numberWithCommas(result.deltaSpeed, false)} Speed`);
						}

						update_message += gains.join(", ") + ` since your last update ${result.age}.`;
						if (gains.length === 0) update_message = `You have not gained any stats since your last update ${result.age}.`;

						let info_div = doc.new({ type: "div", class: "tt-info-message", text: update_message });
						graph_area.appendChild(info_div);
					})
					.catch((err) => {
						console.log("TornStats API result", err);

						response_div.classList.add("failure");
						response_div.innerText = result.error;
					});
			});
		})
		.catch((err) => {
			console.log("TornStats API result", err);

			let text;
			if (err.error.indexOf("User not found") > -1) {
				text = "Can't display graph because no TornStats account was found. Please register an account @ www.tornstats.com";
			}

			const div = doc.new({ type: "div", text: text || err.error, class: "tt-error-message" });
			graph_area.appendChild(div);
		});
}

function disableGyms() {
	let checkbox = doc.find("#tt-gym-global-disable");

	// Individual buttons
	for (let stat in GYM_SELECTORS) {
		let checkbox = doc.new({ type: "input", class: "tt-gym-stat-checkbox", attributes: { type: "checkbox" } });
		checkbox.checked = settings.pages.gym[`disable_${stat}`];

		if (settings.pages.gym[`disable_${stat}`] && !doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).classList.contains("locked___r074J")) {
			doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).classList.add("tt-gym-locked");
		}

		doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).appendChild(checkbox);

		checkbox.onclick = () => {
			if (!doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).classList.contains("tt-gym-locked") && checkbox.checked) {
				disableGymButton([stat], true);
			} else if (!checkbox.checked) {
				disableGymButton([stat], false);
			}
		};
	}

	if (settings.pages.gym.disable_strength && settings.pages.gym.disable_speed && settings.pages.gym.disable_dexterity && settings.pages.gym.disable_defense) {
		checkbox.checked = true;
		disableGymButton(["strength", "speed", "dexterity", "defense"], true);
	}
}

function disableGymButton(types, disable) {
	for (let stat of types) {
		if (disable) {
			if (!doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).classList.contains("tt-gym-locked")) {
				doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).classList.add("tt-gym-locked");
				doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]} .tt-gym-stat-checkbox`).checked = true;
			}
		} else {
			doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]}`).classList.remove("tt-gym-locked");
			doc.find(`ul.properties___Vhhr7 > li.${GYM_SELECTORS[stat]} .tt-gym-stat-checkbox`).checked = false;
		}
	}

	ttStorage.get("settings", (settings) => {
		for (let stat of types) {
			settings.pages.gym[`disable_${stat}`] = disable;
		}

		ttStorage.set({ settings: settings });
	});
}

function setupSpecialtyGym() {
	let container = doc.find("#tt-specialty-gyms .content");
	if (!container) {
		container = content
			.newContainer("Specialty Gym Requirements", {
				id: "tt-specialty-gyms",
				adjacent_element: doc.find("#gymroot"),
				collapseId: 1,
			})
			.find(".content");

		createRow("specialty-gym-1");
		createRow("specialty-gym-2");
	} else {
		container.findAll(".specialty-gym-row").forEach(updateRow);
	}

	function createRow(id) {
		const row = doc.new({
			type: "div",
			class: "specialty-gym-row",
			id,
		});

		const selector = doc.new({
			type: "select",
			value: settings.pages.gym[id.replaceAll("-", "_")] || "balboas",
			html: `
                <option value="balboas">Balboas Gym (def/dex)</option>
                <option value="frontline">Frontline Fitness (str/spd)</option>
                <option value="gym3000">Gym 3000 (str)</option>
                <option value="isoyamas">Mr. Isoyamas (def)</option>
                <option value="rebound">Total Rebound (spd)</option>
                <option value="elites">Elites (dex)</option>
            `,
		});

		const text = doc.new({
			type: "p",
			class: "specialty-gym-information",
			text: calculateTarget(selector.value),
		});

		selector.addEventListener("change", (event) => {
			text.innerText = calculateTarget(event.target.value);

			ttStorage.change({
				settings: {
					pages: {
						gym: {
							[id.replaceAll("-", "_")]: event.target.value,
						},
					},
				},
			});
		});

		row.appendChild(selector);
		row.appendChild(text);
		container.appendChild(row);

		return row;
	}

	function updateRow(row) {
		row.find(".specialty-gym-information").innerText = calculateTarget(row.find("select").value);
	}

	function calculateTarget(gym) {
		const SPECIALITY_GYMS = {
			balboas: ["defense", "dexterity"],
			frontline: ["strength", "speed"],
			gym3000: ["strength"],
			isoyamas: ["defense"],
			rebound: ["speed"],
			elites: ["dexterity"],
		};

		let primaryStats = {};
		let secondaryStats = {};
		for (const stat in STATS) {
			if (SPECIALITY_GYMS[gym].includes(stat)) primaryStats[stat] = STATS[stat];
			else secondaryStats[stat] = STATS[stat];
		}

		if (Object.keys(primaryStats).length > 1) {
			const primary = Object.values(primaryStats).reduce((a, b) => a + b);
			const secondary = Object.values(secondaryStats).reduce((a, b) => a + b);

			if (primary >= 1.25 * secondary)
				return `Gain no more than ${numberWithCommas(primary / 1.25 - secondary, false, FORMATTER_NO_DECIMALS)} ${Object.keys(STATS)
					.filter((s) => !SPECIALITY_GYMS[gym].includes(s))
					.join(" and ")}.`;
			else return `Gain ${numberWithCommas(secondary * 1.25 - primary, false, FORMATTER_NO_DECIMALS)} ${SPECIALITY_GYMS[gym].join(" and ")}.`;
		} else {
			const primary = parseInt(primaryStats[SPECIALITY_GYMS[gym][0]]);
			let secondary = Object.values(secondaryStats).reduce((a, b) => Math.max(a, b));

			if (primary >= 1.25 * secondary)
				return `Gain no more than ${numberWithCommas(primary / 1.25 - secondary, false, FORMATTER_NO_DECIMALS)} ${
					Object.entries(secondaryStats).filter((a) => a[1] === secondary)[0][0]
				}.`;
			else return `Gain ${numberWithCommas(secondary * 1.25 - primary, false, FORMATTER_NO_DECIMALS)} ${SPECIALITY_GYMS[gym][0]}.`;
		}
	}
}
