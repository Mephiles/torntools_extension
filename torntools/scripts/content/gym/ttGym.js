const GYM_SELECTORS = {
	"strength": "strength___1GeGr",
	"speed": "speed___1o1b_",
	"defense": "defense___311kR",
	"dexterity": "dexterity___1YdUM",
};

requireDatabase().then(function () {
	gymLoaded().then(function () {
		addFetchListener((event) => {
			const { page, json, fetch } = event.detail;
			if (page !== "gym" || !json) return

			const params = new URL(fetch.url).searchParams;
			if (params.get("step") !== "getInitialGymInfo") return;

			disableGyms();
		});

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

		checkbox.addEventListener("click", function () {
			if (checkbox.checked) {
				disableGymButton(["strength", "speed", "dexterity", "defense"], true);
			} else {
				disableGymButton(["strength", "speed", "dexterity", "defense"], false);
			}
		});

		disableGyms();

		// Train button listeners
		let train_button_observer = new MutationObserver(function (mutations) {
			for (let mutation of mutations) {
				if (mutation.target.classList) {
					if (!mutation.target.classList.contains("tt-gym-locked") && mutation.target.find(".tt-gym-stat-checkbox").checked === true) {
						mutation.target.classList.add("tt-gym-locked")
					} else if (mutation.target.classList.contains("tt-gym-locked") && mutation.target.find(".tt-gym-stat-checkbox").checked === false) {
						mutation.target.classList.remove("tt-gym-locked")
					}
				}
			}
		});
		train_button_observer.observe(doc.find("ul.properties___Vhhr7"), { classList: true, attributes: true, subtree: true });
	});
});

function gymLoaded() {
	return new Promise(function (resolve) {
		let checker = setInterval(function () {
			if (doc.find(".gymButton___3OFdI")) {
				resolve(true);
				return clearInterval(checker);
			}
		});
	});
}

function showProgress() {
	let gym_goals = [
		200, 500, 1000, 2000, 2750, 3000, 3500, 4000,
		6000, 7000, 8000, 11000, 12420, 18000, 18100, 24140,
		31260, 36610, 46640, 56520, 67775, 84535, 106305
	]

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

	fetchApi_v2('tornstats', { section: 'api.php', action: 'getStatGraph', from: ((new Date() - 2 * 24 * 60 * 60 * 1000) / 1000).toFixed(0) })
		.then(result => {
			let w = mobile ? "312" : "784";
			let h = mobile ? "200" : "250";
			let canvas = doc.new({ type: "canvas", id: "tt-gym-graph", attributes: { width: w, height: h } });
			graph_area.appendChild(canvas);

			let ctx = doc.find("#tt-gym-graph").getContext("2d");
			new Chart(ctx, {
				type: "line",
				data: {
					labels: result.data.map(function (x) {
						let date = new Date(x.timestamp * 1000);
						return formatDate([date.getDate(), date.getMonth() + 1, 0], settings.format.date);
					}),
					datasets: [
						{
							label: "Strength",
							data: result.data.map(x => x.strength),
							borderColor: ["#3366CC"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#3366CC",
							pointHoverRadius: 5
						},
						{
							label: "Defense",
							data: result.data.map(x => x.defense),
							borderColor: ["#DC3912"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#DC3912",
							pointHoverRadius: 5
						},
						{
							label: "Speed",
							data: result.data.map(x => x.speed),
							borderColor: ["#FF9901"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#FF9901",
							pointHoverRadius: 5
						},
						{
							label: "Dexterity",
							data: result.data.map(x => x.dexterity),
							borderColor: ["#109618"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#109618",
							pointHoverRadius: 5
						},
						{
							label: "Total",
							data: result.data.map(x => x.total),
							borderColor: ["#990199"],
							fill: false,
							pointRadius: 0,
							pointBackgroundColor: "#990199",
							pointHoverRadius: 5,
							hidden: true
						}
					]
				},
				options: {
					scales: {
						yAxes: [{
							ticks: {
								step: 2000000,
								callback: function (value) {
									return numberWithCommas(value, mobile)
								}
							},
						}]
					},
					legend: {
						position: mobile ? "bottom" : "right",
						labels: {
							boxWidth: 13
						}
					},
					tooltips: {
						intersect: false,
						mode: "index",
						// enabled: true,
						// mode: "y",
						callbacks: {
							label: function (tooltipItem, data) {
								return `${data.datasets[tooltipItem.datasetIndex].label}: ${numberWithCommas(tooltipItem.yLabel, false)}`;
							}
						}
					},
					hover: {
						intersect: false,
						mode: "index"
					}
				}
			});

			// Update TornStats button
			let update_button = doc.new({ type: "button", text: "Update TornStats", class: "update-button tt-torn-button" });
			graph_area.appendChild(update_button);

			update_button.addEventListener("click", function () {
				if (graph_area.find(".response-message")) graph_area.find(".response-message").remove();
				if (graph_area.find(".tt-info-message")) graph_area.find(".tt-info-message").remove();

				const response_div = doc.new({ type: "div", class: "response-message" });
				graph_area.appendChild(response_div);

				fetchApi_v2('tornstats', { section: 'api.php', action: 'recordStats' })
					.then(result => {
						console.log("result", result);

						response_div.classList.add("success");
						response_div.innerText = result.message;

						let gains = []
						let update_message = `You have gained `

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
						if (gains.length === 0) update_message = `You have not gained any stats since your last update ${result.age}.`

						let info_div = doc.new({ type: "div", class: "tt-info-message", text: update_message });
						graph_area.appendChild(info_div);
					})
					.catch(err => {
						console.log("TornStats API result", err);

						response_div.classList.add("failure");
						response_div.innerText = result.error;
					})
			});
		})
		.catch(err => {
			console.log("TornStats API result", err);

			let text;
			if (err.error.indexOf("User not found") > -1) {
				text = "Can't display graph because no TornStats account was found. Please register an account @ www.tornstats.com";
			}

			const div = doc.new({ type: "div", text: text || err.error, class: "tt-error-message" });
			graph_area.appendChild(div);
		})
}

function disableGyms() {
	let checkbox = doc.find("#tt-gym-global-disable");

	// Individual buttons
	for (let stat in GYM_SELECTORS) {
		let checkbox = doc.new({ type: "input", class: "tt-gym-stat-checkbox", attributes: { type: "checkbox" } });
		checkbox.checked = settings.pages.gym[`disable_${stat}`];

		if (settings.pages.gym[`disable_${stat}`] && !doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).classList.contains("locked___r074J")) {
			doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).classList.add("tt-gym-locked");
		}

		doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).appendChild(checkbox);

		checkbox.onclick = function () {
			if (!doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).classList.contains("tt-gym-locked") && checkbox.checked) {
				disableGymButton([stat], true);
			} else if (!checkbox.checked) {
				disableGymButton([stat], false);
			}
		}
	}

	if (settings.pages.gym.disable_strength && settings.pages.gym.disable_speed && settings.pages.gym.disable_dexterity && settings.pages.gym.disable_defense) {
		checkbox.checked = true;
		disableGymButton(["strength", "speed", "dexterity", "defense"], true);
	}
}

function disableGymButton(types, disable) {
	for (let stat of types) {
		if (disable) {
			if (!doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).classList.contains("tt-gym-locked")) {
				doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).classList.add("tt-gym-locked");
				doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]} .tt-gym-stat-checkbox`).checked = true;
			}
		} else {
			doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]}`).classList.remove("tt-gym-locked");
			doc.find(`ul.properties___Vhhr7>li.${GYM_SELECTORS[stat]} .tt-gym-stat-checkbox`).checked = false;
		}

	}

	ttStorage.get("settings", function (settings) {
		for (let stat of types) {
			settings.pages.gym[`disable_${stat}`] = disable;
		}

		ttStorage.set({ "settings": settings });
	});
}

function setupSpecialtyGym() {
	try {
		let container = doc.find("#tt-specialty-gyms");
		if (!container) {
			container = content.newContainer("Specialty Gym Requirements", {
				id: "tt-specialty-gyms",
				adjacent_element: doc.find("#gymroot"),
				collapseId: 1,
			});

			const row1 = createRow("tt-specialty-gym-1")
		}


		function createRow(id) {
			const row = doc.new({
				type: "div",
				class: "specialty-gym-row",
				id,
			});

			const selector = doc.new("select");
			selector.innerHTML = `
                <option value="balboas">Balboas Gym (def/dex)</option>
                <option value="frontline">Frontline Fitness (str/spd)</option>
                <option value="gym3000">Gym 3000 (str)</option>
                <option value="isoyamas">Mr. Isoyamas (def)</option>
                <option value="rebound">Total Rebound (spd)</option>
                <option value="elites">Elites (dex)</option>
            `;

			row.appendChild(selector);
			container.appendChild(row);

			return row;
		}
	} catch (e) {
		console.error("DKK setupSpecialtyGym error", e);
	}
}