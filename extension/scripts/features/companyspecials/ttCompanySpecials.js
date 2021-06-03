"use strict";

(async () => {
	const data = {};

	// TODO - Test muggable cash again
	const feature = featureManager.registerFeature(
		"Company Specials",
		"companies",
		() => settings.pages.companies.specials,
		initialiseCompanySpecials,
		null,
		null,
		{
			storage: ["settings.pages.companies.specials"],
		},
		null
	);

	function initialiseCompanySpecials() {
		addXHRListener(async (event) => {
			if (!feature.enabled()) return;

			const { page, json } = event.detail;

			if (page === "companies" && json) {
				if (json.result && json.result.msg) {
					if (json.result.msg.money) showMuggableCash(json).catch((error) => console.error("Couldn't show the muggable cash.", error));
					if (json.result.msg.total) calculateSpies(json).catch((error) => console.error("Couldn't help with the spies.", error));
				}
			}
		});
	}

	async function showMuggableCash(json) {
		const api = hasAPIData() && settings.apiUsage.user.merits;

		let percentageMin = 5;
		let percentageMax = 10;

		if (api) {
			const merits = 1 + userdata.merits["Masterful Looting"] * 0.05;
			percentageMin *= merits;
			percentageMax *= merits;

			const result = await fetchData("torn", {
				section: "user",
				id: json.result.user.userID,
				selections: ["profile"],
				silent: true,
				succeedOnError: true,
			});
			if (result.job && result.job.company_type === 5) {
				const resultCompany = await fetchData("torn", {
					section: "company",
					id: result.job.company_id,
					selections: ["profile"],
					silent: true,
					succeedOnError: true,
				});
				if (resultCompany.company && resultCompany.company.rating >= 7) {
					percentageMin /= 4;
					percentageMax /= 4;
				}
			}
		}

		const cash = parseInt(json.result.msg.money.replaceAll(",", ""));

		const jobInfo = document.find(".job-info");
		jobInfo.appendChild(
			document.newElement({
				type: "li",
				text: `Potential mug${api ? "" : "*"}: ${formatNumber(cash * (percentageMin / 100), { decimals: 0, currency: true })} - ${formatNumber(
					cash * (percentageMax / 100),
					{ decimals: 0, currency: true }
				)}`,
			})
		);
		if (!api) jobInfo.appendChild(document.newElement({ type: "li", text: "* Might not be entirely accurate due to missing API information." }));
	}

	async function calculateSpies(json) {
		const user = parseInt(json.result.user.userID);

		const stats = ["strength", "speed", "dexterity", "defence", "total"];
		const result = {};
		const missing = [];
		const remembered = [];
		for (let [key, value] of Object.entries(json.result.msg)) {
			if (!stats.includes(key)) continue;

			if (value === "N/A") {
				if (data[user] && data[user][key] !== -1) {
					value = data[user][key];
					remembered.push(key);
				} else {
					value = -1;
					missing.push(key);
				}
			} else {
				value = parseInt(value.replaceAll(",", ""));
			}

			result[key] = value;
		}

		await requireElement(".specials-confirm-cont ul.job-info > li");

		const specialContext = document.find(".specials-confirm-cont");

		if (missing.length === 1) {
			const missingStat = missing[0];

			result[missingStat] = Object.entries(result)
				.filter(([stat]) => missingStat !== stat)
				.map(([stat, value]) => (stat === "total" ? value : -value))
				.totalSum();

			const position = stats.indexOf(missingStat) + 1;
			const element = specialContext.find(`ul.job-info > li:nth-child(${position})`);

			element.classList.add("missing");
			element.innerText = `${element.innerText.split(" ")[0]} ${formatNumber(result[missingStat])}`;
		}
		for (const stat of remembered) {
			const position = stats.indexOf(stat) + 1;
			const element = specialContext.find(`ul.job-info > li:nth-child(${position})`);

			element.classList.add("remembered");
			element.innerText = `${element.innerText.split(" ")[0]} ${formatNumber(result[stat])}`;
		}
		data[user] = result;

		console.log("TT - Detected stat spy: ", result, { missing, remembered });

		if (settings.external.tornstats) {
			specialContext.classList.add("tt-modified");

			const backWrap = specialContext.find(".back");
			const button = document.newElement({
				type: "button",
				class: "external-service tt-btn",
				text: "Save to TornStats",
				events: {
					click() {
						fetchData("tornstats", {
							section: "store/spy",
							method: "POST",
							params: {
								player_id: parseInt(json.result.user.userID),
								player_name: json.result.user.playername,
								player_level: parseInt(json.result.user.level),
								...data[user],
							},
						})
							.then((response) => {
								const responseElement = specialContext.find(".external-response");

								if (response.status) {
									if (responseElement) {
										responseElement.setClass(`external-response ${!response.status ? "error" : ""}`);
										responseElement.innerText = response.message;
									}
									button.setAttribute("disabled", "");
								} else {
									button.removeAttribute("disabled");
								}

								if (!responseElement) {
									specialContext.appendChild(
										document.newElement({
											type: "div",
											class: "external-response-wrap",
											children: [
												document.newElement({
													type: "span",
													class: `external-response ${!response.status ? "error" : ""}`,
													text: response.message,
												}),
											],
										})
									);
								}
							})
							.catch((error) => {
								console.error("Couldn't store your spy to TornStats.", error);
								specialContext.appendChild(
									document.newElement({
										type: "div",
										class: "external-response-wrap",
										children: [document.newElement({ type: "span", class: "external-response error", text: "Something went wrong!" })],
									})
								);
							});
					},
				},
			});

			backWrap.insertBefore(button, backWrap.firstElementChild);
		}
	}
})();
