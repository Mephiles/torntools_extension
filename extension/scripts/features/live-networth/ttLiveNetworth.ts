(async () => {
	if (!getPageStatus().access) return;

	if (isFlying() || isAbroad()) return;

	featureManager.registerFeature(
		"Live Networth",
		"home",
		() => settings.pages.home.networthDetails,
		null,
		showNetworth,
		() => removeContainer("Live Networth"),
		{
			storage: ["settings.pages.home.networthDetails", "userdata.networth"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.networth) return "No API access.";

			return true;
		}
	);

	async function showNetworth() {
		await requireContent();

		const { content } = createContainer("Live Networth", {
			collapsible: false,
			showHeader: false,
			applyRounding: false,
			compact: true,
			parentElement: document.find("h5=General Information").parentElement.nextElementSibling.find("ul.info-cont-wrap"),
		});
		const networthRow = newRow("(Live) Networth", formatNumber(userdata.networth.total, { currency: true }));

		// Networth last updated info icon
		const infoIcon = elementBuilder({
			type: "i",
			class: "networth-info-icon",
			attributes: {
				seconds: (Date.now() - userdata.date) / 1000,
				title: "Last updated " + formatTime({ seconds: userdata.networth.timestamp }, { type: "ago" }),
				style: "margin-left: 9px;",
			},
		});
		networthRow.find(".desc").appendChild(infoIcon);
		content.appendChild(networthRow);

		// Update 'last updated'
		setInterval(() => {
			const seconds = parseInt(infoIcon.getAttribute("seconds")) + 1;

			if (!infoIcon.hasAttribute("aria-describedby"))
				infoIcon.setAttribute("title", `Last updated: ${formatTime({ milliseconds: Date.now() - seconds * 1000 }, { type: "ago" })}`);
			infoIcon.setAttribute("seconds", seconds.toString());
		}, 1000);

		const table = elementBuilder({
			type: "table",
			class: "tt-networth-comparison",
			children: [
				elementBuilder({
					type: "tr",
					children: ["Type", "Value", "Change"].map((value) => elementBuilder({ type: "th", text: value })),
				}),
			],
		});

		for (const type of getNetworthTypes()) {
			addToTable(type);
		}

		content.appendChild(
			elementBuilder({
				type: "li",
				class: "comparison",
				children: [
					table,
					elementBuilder({
						type: "div",
						class: "tt-networth-footer",
						text: `Networth change compared to Torn's last known Networth (updated ${formatTime({ seconds: userdata.networth.timestamp }, { type: "ago" })})`,
					}),
				],
			})
		);

		function newRow(name: string, value: string) {
			return elementBuilder({
				type: "li",
				class: "networth-row",
				children: [
					elementBuilder({ type: "div", class: "divider", children: [elementBuilder({ type: "span", text: name })] }),
					elementBuilder({ type: "div", class: "desc", children: [elementBuilder({ type: "span", text: value })] }),
				],
			});
		}

		function getNetworthTypes() {
			return [
				"Cash (Wallet and Vault)",
				"Points",
				"Items",
				"Bazaar",
				"Display Case",
				"Bank",
				"Trade",
				"Piggy Bank",
				"Stock Market",
				"Company",
				"Bookie",
				"Auction House",
				"Cayman",
				"Properties",
				"Enlisted Cars",
				"Item Market",
				"Loan",
				"Total",
			] as const;
		}

		type NetworthType = ReturnType<typeof getNetworthTypes>[number];

		function addToTable(type: NetworthType) {
			let current: number, previous: number;

			let nameNetworth = type.toLowerCase().replaceAll(" ", "");
			let nameStats = type.toLowerCase().replaceAll(" ", "_");
			if (type === "Trade") {
				nameNetworth = "pending";
				nameStats = "pending";
			} else if (type === "Cayman") nameStats = "overseas_bank";
			else if (type === "Items") nameStats = "inventory";
			else if (type === "Properties") nameStats = "property";
			else if (type === "Loan") nameStats = "loans";

			if (type.includes("Cash")) {
				current = userdata.networth.wallet + userdata.networth.vault;
				previous = userdata.personalstats.networth.wallet + userdata.personalstats.networth.vaults;
			} else {
				current = userdata.networth[nameNetworth];
				previous = userdata.personalstats.networth[nameStats];
			}
			if (current === previous) return;

			const isPositive = current > previous;

			table.appendChild(
				elementBuilder({
					type: "tr",
					children: [
						elementBuilder({ type: "td", text: type }),
						elementBuilder({ type: "td", text: `${formatNumber(current, { shorten: true, currency: true })}` }),
						elementBuilder({
							type: "td",
							text: `${formatNumber(current - previous, { shorten: true, currency: true, forceOperation: true })}`,
							class: isPositive ? "positive" : "negative",
						}),
					],
				})
			);
		}
	}
})();
