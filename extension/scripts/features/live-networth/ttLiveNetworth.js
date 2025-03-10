"use strict";

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
		const networthRow = newRow("(Live) Networth", `${formatNumber(userdata.networth.total, { currency: true })}`);

		// Networth last updated info icon
		const infoIcon = document.newElement({
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
			infoIcon.setAttribute("seconds", seconds);
		}, 1000);

		const table = document.newElement({
			type: "table",
			class: "tt-networth-comparison",
			children: [
				document.newElement({
					type: "tr",
					children: ["Type", "Value", "Change"].map((value) => document.newElement({ type: "th", text: value })),
				}),
			],
		});

		for (const type of getNetworthTypes()) {
			addToTable(type);
		}

		content.appendChild(
			document.newElement({
				type: "li",
				class: "comparison",
				children: [
					table,
					document.newElement({
						type: "div",
						class: "tt-networth-footer",
						text: `Networth change compared to Torn's last known Networth (updated ${formatTime({ seconds: userdata.networth.timestamp }, { type: "ago" })})`,
					}),
				],
			})
		);

		function newRow(name, value) {
			return document.newElement({
				type: "li",
				class: "networth-row",
				children: [
					document.newElement({ type: "div", class: "divider", children: [document.newElement({ type: "span", text: name })] }),
					document.newElement({ type: "div", class: "desc", children: [document.newElement({ type: "span", text: value })] }),
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
			];
		}

		function addToTable(type) {
			let current, previous;

			let nameNetworth = type.toLowerCase().replaceAll(" ", "");
			let nameStats = type.toLowerCase().replaceAll(" ", "_");
			if (type === "Trade") {
				nameNetworth = "pending";
				nameStats = "pending";
			} else if (type === "Cayman") nameStats = "overseas_bank";
			else if (type === "Items") nameStats = "inventory";
			else if (type === "Properties") nameStats = "property";
			else if (type === "Loan") nameStats = "loans";
			else if (type === "Vault") nameStats = "vaults";

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
				document.newElement({
					type: "tr",
					children: [
						document.newElement({ type: "td", text: type }),
						document.newElement({ type: "td", text: `${formatNumber(current, { shorten: true, currency: true })}` }),
						document.newElement({
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
