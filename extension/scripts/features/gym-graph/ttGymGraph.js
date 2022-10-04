"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Graph",
		"gym",
		() => settings.pages.gym.graph,
		null,
		showGraph,
		removeGraph,
		{
			storage: ["settings.pages.gym.graph", "settings.external.tornstats"],
		},
		async () => {
			if (!hasAPIData()) return "No API access.";
			else if (!settings.external.tornstats) return "TornStats not enabled";

			await checkDevice();
		}
	);

	async function showGraph() {
		const { content } = createContainer("Graph", { class: "mt10" });

		addButton();
		await loadGraph();

		function addButton() {
			const wrapper = document.newElement({ type: "div", class: "tornstats-update" });

			const button = document.newElement({ type: "button", text: "Update TornStats", class: "tt-btn tornstats-button" });

			button.addEventListener("click", async () => {
				if (wrapper.find(".tornstats-response")) wrapper.find(".tornstats-response").remove();

				const responseElement = document.newElement({ type: "div", class: "tornstats-response" });
				wrapper.appendChild(responseElement);

				button.setAttribute("disabled", "");
				showLoadingPlaceholder(responseElement, true);

				const { message, status } = await fetchData(FETCH_PLATFORMS.tornstats, { section: "battlestats/record" })
					.then((response) => {
						if (!response.status) {
							let message = response.message;

							if (message.includes("User not found")) {
								message =
									"Can't update stats because no TornStats account was found. This likely is because the API keys don't match. Change the key in the settings, under 'external services'.";
							}

							return { message, status: false };
						}

						let total = 0;
						let gains = [];
						for (const stat of ["Strength", "Defense", "Speed", "Dexterity"]) {
							const value = response[`delta${stat}`];
							if (!value) continue;

							total += value;
							gains.push(`${formatNumber(value)} ${stat}`);
						}

						const message = gains.length
							? gains.length > 1
								? `You have gained ${gains.join(", ")} for a total of ${formatNumber(total)} since your last update ${response.age}.`
								: `You have gained ${gains.join(", ")} since your last update ${response.age}.`
							: `You have not gained any stats since your last update ${response.age}.`;

						return { message, status: true };
					})
					.catch((error) => ({ message: error.error, status: false }));

				responseElement.textContent = message;
				responseElement.classList.add(status ? "success" : "error");

				button.removeAttribute("disabled");
			});

			wrapper.appendChild(button);
			content.appendChild(wrapper);
		}

		async function loadGraph() {
			const wrapper = document.newElement("div");
			content.appendChild(wrapper);

			showLoadingPlaceholder(wrapper, true);

			let result;
			if (ttCache.hasValue("gym", "graph")) {
				result = ttCache.get("gym", "graph");
			} else {
				try {
					result = await fetchData(FETCH_PLATFORMS.tornstats, { section: "battlestats/graph" });

					if (result.status) {
						ttCache.set({ graph: result }, TO_MILLIS.HOURS, "gym").then(() => {});
					}
				} catch (error) {
					const message = error.error instanceof HTTPException ? error.error.message : error.error;

					result = { status: false, message };
				}
			}

			if (!result.status) {
				let message = result.message;

				if (message.includes("Not enough data found")) {
					message = "Not enough data found on TornStats.";
				} else if (message.includes("User not found")) {
					message =
						"Can't display graph because no TornStats account was found. This likely is because the API keys don't match. Change the key in the settings, under 'external services'.";
				}

				console.log("TT - Couldn't load graph data from TornStats.", result);
				showError(message);
				return;
			}

			const width = mobile ? "312" : "784";
			const height = mobile ? "200" : "250";
			const canvas = document.newElement({ type: "canvas", attributes: { width, height } });
			wrapper.appendChild(canvas);

			const context = canvas.getContext("2d");

			const gymChart = createChart();
			darkModeObserver.addListener((darkMode) => {
				const color = darkMode ? "#fff" : "#000";
				gymChart.options.scales.x.ticks.color = color;
				gymChart.options.scales.y.ticks.color = color;
				gymChart.options.plugins.legend.labels.color = color;
				gymChart.update();
			});

			showLoadingPlaceholder(wrapper, false);

			function showError(message) {
				wrapper.appendChild(document.newElement({ type: "div", class: "tornstats-response error", text: message }));

				showLoadingPlaceholder(wrapper, false);
			}

			function createChart() {
				const darkMode = hasDarkMode();
				return new Chart(context, {
					type: "line",
					data: {
						labels: result.data.map((x) => formatDate({ seconds: x.timestamp })),
						datasets: [
							getDataset("Strength", "#3366cc", false),
							getDataset("Defense", "#dc3912", false),
							getDataset("Speed", "#ff9901", false),
							getDataset("Dexterity", "#109618", false),
							getDataset("Total", "#990199", true),
						],
					},
					options: {
						scales: {
							x: {
								ticks: {
									color: darkMode ? "#fff" : "#000",
								},
							},
							y: {
								ticks: {
									color: darkMode ? "#fff" : "#000",
								},
							},
						},
						interaction: {
							mode: "index",
							intersect: false,
						},
						plugins: {
							legend: {
								position: mobile ? "down" : "right",
								labels: {
									boxWidth: 10,
									usePointStyle: true,
									pointStyle: "circle",
									color: darkMode ? "#fff" : "#000",
								},
							},
							tooltip: {
								callbacks: {
									label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y)}`,
								},
							},
						},
					},
				});

				function getDataset(stat, color, hidden) {
					const field = stat.toLowerCase();

					return {
						label: stat,
						data: result.data.map((x) => x[field]),
						borderColor: [color],
						pointRadius: 0,
						pointBackgroundColor: color,
						pointHoverRadius: 5,
						hidden,
					};
				}
			}
		}
	}

	function removeGraph() {
		removeContainer("Graph");
	}
})();
