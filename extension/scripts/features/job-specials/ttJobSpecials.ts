(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Job Specials",
		"joblist",
		() => settings.pages.joblist.specials,
		addListener,
		showSpecials,
		removeSpecials,
		{
			storage: ["settings.pages.joblist.specials"],
		},
		async () => {
			await checkDevice();
			return true;
		}
	);

	async function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
			if (!feature.enabled) return;

			showSpecials();
		});
	}

	async function showSpecials() {
		if (findContainer("Job Specials")) return;
		await requireElement(".content-wrapper .company-details");

		const { content } = createContainer("Job Specials", {
			previousElement: document.find(".company-details-wrap"),
			spacer: true,
		});

		const companyType = document.find(".details-wrap ul.info .m-title .m-show:not(.arrow-left)").textContent.trim();
		const companyInfo = COMPANY_INFORMATION[companyType];

		for (const stars of [1, 3, 5, 7, 10] as const) {
			let name: string, cost: string, effect: string;
			if (stars in companyInfo) {
				name = companyInfo[stars].name;
				cost = companyInfo[stars].cost;
				effect = companyInfo[stars].effect;
			} else {
				name = "No Special";
				cost = "N/A";
				effect = "";
			}

			let costText: string;
			if (cost === "Passive" || cost === "N/A") costText = cost;
			else costText = `${cost} job point${applyPlural(parseInt(cost))}`;

			if (!mobile) {
				content.appendChild(
					document.newElement({
						type: "div",
						class: "tt-company-info-wrap",
						children: [
							document.newElement({ type: "div", class: "heading", text: `${name} (${stars}★)` }),
							document.newElement({ type: "hr", class: "first-hr" }),
							document.newElement({ type: "div", text: costText }),
							document.newElement({ type: "hr", class: "second-hr" }),
							document.newElement({ type: "div", text: effect }),
						],
					})
				);
			} else {
				content.appendChild(
					document.newElement({
						type: "tr",
						class: "tt-company-info-wrap",
						children: [
							document.newElement({
								type: "div",
								class: "heading",
								children: [document.newElement({ type: "div", text: name }), document.newElement({ type: "div", text: `(${stars}★)` })],
							}),
							document.newElement({ type: "div", text: costText }),
							document.newElement({ type: "div", text: effect }),
						],
					})
				);
			}
		}
	}

	function removeSpecials() {
		removeContainer("Job Specials");
	}
})();
