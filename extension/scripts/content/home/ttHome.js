"use strict";

let networthInterval = false;

(async () => {
	await loadDatabase();
	console.log("TT: Home - Loading script. ");

	storageListeners.settings.push(loadHome);
	storageListeners.userdata.push(async (oldUserdata) => {
		if (oldUserdata.networth && userdata.networth && oldUserdata.networth.date !== userdata.networth.date) {
			await displayNetworth();
		}
	});

	loadHome();

	console.log("TT: Home - Script loaded.");
})();

function loadHome() {
	// FIXME - Check travel state.

	requireContent().then(async () => {
		await displayNetworth();
		await displayEffectiveBattleStats();
	});
}

async function displayNetworth() {
	if (networthInterval) {
		clearInterval(networthInterval);
		networthInterval = false;
	}

	if (settings.pages.home.networthDetails) {
		const { content } = createContainer("Live Networth", {
			showHeader: false,
			parentElement: document.find("h5=General Information").parentElement.nextElementSibling.find("ul.info-cont-wrap"),
		});

		if (!userdata.networth || Date.now() - userdata.networth.date >= TO_MILLIS.MINUTES * 5) {
			chrome.runtime.sendMessage({ action: "updateData", type: "networth" });
			return;
		}

		let networthRow = newRow("(Live) Networth", `$${formatNumber(userdata.networth.total)}`);
		networthRow.style.backgroundColor = "#65c90069";

		// Networth last updated info icon
		let infoIcon = document.newElement({
			type: "i",
			class: "networth-info-icon",
			attributes: {
				seconds: (Date.now() - userdata.networth.date) / 1000,
				title: "Last updated " + formatTime({ milliseconds: userdata.networth.date }, { type: "ago" }),
				style: "margin-left: 9px;",
			},
		});
		networthRow.find(".desc").appendChild(infoIcon);
		content.appendChild(networthRow);

		// Update 'last updated'
		networthInterval = setInterval(() => {
			let seconds = parseInt(infoIcon.getAttribute("seconds")) + 1;

			infoIcon.setAttribute("title", `Last updated: ${formatTime({ milliseconds: Date.now() - seconds * 1000 }, { type: "ago" })}`);
			infoIcon.setAttribute("seconds", seconds);
		}, 1000);

		// FIXME - Compare old stuff.

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

		/*
		"properties": 562500,
		"loan": 0,
		"unpaidfees": 0,
		"total": 8916331537,
		 */
		for (let type of [
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
			"Total",
		]) {
			let current, previous;

			let name = type.toLowerCase().replaceAll(" ", "");
			if (type === "Trade") name = "pending";

			if (type.includes("Cash")) {
				current = userdata.networth.wallet + userdata.networth.vault;
				previous = userdata.personalstats.networthwallet + userdata.personalstats.networthvault;
			} else if (type === "Total") {
				current = userdata.networth.total;
				previous = userdata.personalstats.networth;
			} else {
				current = userdata.networth[name];
				previous = userdata.personalstats[`networth` + name];
			}
			if (current === previous) continue;

			const isPositive = current > previous;

			table.appendChild(
				document.newElement({
					type: "tr",
					children: [
						document.newElement({ type: "td", text: type }),
						document.newElement({ type: "td", text: `$${formatNumber(current, { shorten: true })}` }),
						document.newElement({
							type: "td",
							text: `${isPositive ? "+" : "-"}$${formatNumber(Math.abs(current - previous), { shorten: true })}`,
							class: isPositive ? "positive" : "negative",
						}),
					],
				})
			);
		}

		content.appendChild(
			document.newElement({
				type: "li",
				class: "comparison",
				children: [
					table,
					document.newElement({ type: "div", class: "tt-networth-footer", text: "Networth change compared to Torn's last known Networth" }),
				],
			})
		);

		function newRow(name, value) {
			return document.newElement({
				type: "li",
				children: [
					document.newElement({
						type: "div",
						class: "divider",
						children: [document.newElement({ type: "span", text: name, style: { backgroundColor: "transparent" } })],
					}),
					document.newElement({
						type: "div",
						class: "desc",
						children: [document.newElement({ type: "span", text: value, style: { paddingLeft: "3px" } })],
					}),
				],
			});
		}
	} else {
		removeContainer("Live Networth");
	}
}

async function displayEffectiveBattleStats() {
	if (settings.pages.home.effectiveStats) {
		const statsContainer = document.find("h5=Battle Stats").parentElement.nextElementSibling.find("ul.info-cont-wrap");
		const { content } = createContainer("Effective Battle Stats", { parentElement: statsContainer });

		let effectiveTotal = 0;
		const stats = ["Strength", "Defense", "Speed", "Dexterity"];
		for (let i = 0; i < stats.length; i++) {
			const base = parseInt(statsContainer.find(`li:nth-child(${i + 1}) .desc`).innerText.replace(/,/g, ""));
			let modifier = statsContainer.find(`li:nth-child(${i + 1}) .mod`).innerText;
			if (modifier.charAt(0) === "+") modifier = modifier = parseInt(modifier.slice(1, -1)) / 100 + 1;
			else modifier = modifier = 1 - parseInt(modifier.slice(1, -1)) / 100;
			const effective = (base * modifier).dropDecimals();

			effectiveTotal += effective;
			content.appendChild(await newRow(stats[i], formatNumber(effective)));
		}

		content.appendChild(await newRow("Total", formatNumber(effectiveTotal, false)));

		async function newRow(name, value) {
			return document.newElement({
				type: "li",
				children: [
					document.newElement({
						type: "div",
						class: "divider",
						children: [document.newElement({ type: "span", text: name, style: { backgroundColor: "transparent" } })],
					}),
					document.newElement({
						type: "div",
						class: "desc",
						style: { width: (await checkMobile()) ? "180px" : "184px" },
						children: [document.newElement({ type: "span", text: value, style: { paddingLeft: "3px" } })],
					}),
				],
			});
		}
	} else {
		removeContainer("Effective Battle Stats");
	}
}
