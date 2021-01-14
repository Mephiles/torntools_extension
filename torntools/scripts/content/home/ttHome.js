requireDatabase().then(() => {
	requireContent().then(async () => {
		console.log("TT - Home");

		// Networth
		if (settings.pages.home.networth) {
			await displayNetworth();
		}

		// Battle Stats
		if (settings.pages.home.battle_stats && !shouldDisable()) {
			displayEffectiveBattleStats();
		}
	});
});

async function displayNetworth() {
	let parent_box = doc.find("h5=General Information").parentElement.nextElementSibling.find("ul.info-cont-wrap");
	loadingPlaceholder(parent_box, true);

	if (networth.current.date === undefined || new Date() - new Date(networth.current.date) >= 5 * 60 * 1000) {
		// 5 minutes
		networth = await new Promise((resolve) => {
			fetchApi_v2("torn", { section: "user", selections: "personalstats,networth" })
				.then((data) => {
					let ps = data.personalstats;
					let new_networth = data.networth;
					let networth = {
						current: {
							date: new Date().toString(),
							value: new_networth,
						},
						previous: {
							value: {
								pending: ps.networthpending,
								wallet: ps.networthwallet,
								bank: ps.networthbank,
								points: ps.networthpoints,
								cayman: ps.networthcayman,
								vault: ps.networthvault,
								piggybank: ps.networthpiggybank,
								items: ps.networthitems,
								displaycase: ps.networthdisplaycase,
								bazaar: ps.networthbazaar,
								properties: ps.networthproperties,
								stockmarket: ps.networthstockmarket,
								auctionhouse: ps.networthauctionhouse,
								company: ps.networthcompany,
								bookie: ps.networthbookie,
								loan: ps.networthloan,
								unpaidfees: ps.networthunpaidfees,
								total: ps.networth,
							},
						},
					};

					// Set Userdata & Networth
					ttStorage.set({ networth: networth }, () => {
						console.log("Networth info updated.");
						return resolve(networth);
					});
				})
				.catch((err) => {
					console.log("ERROR", err);
				});
		});
	}
	console.log("Networth", networth);
	loadingPlaceholder(parent_box, false);

	// current networth
	let networth_text = `$${numberWithCommas(networth.current.value.total, false)}`;
	let networth_row = infoBox.newRow("(Live) Networth", networth_text, { id: "ttLiveNetworth" });
	networth_row.style.backgroundColor = "#65c90069";

	// Networth last updated info icon
	let info_icon = doc.new({
		type: "i",
		class: "networth-info-icon",
		attributes: {
			seconds: (new Date() - Date.parse(networth.current.date)) / 1000,
			title: "Last updated: " + timeAgo(Date.parse(networth.current.date)),
			style: "margin-left: 9px;",
		},
	});
	networth_row.find(".desc").appendChild(info_icon);
	parent_box.appendChild(networth_row);

	// increment time
	setInterval(() => {
		let time_span = doc.find("#ttLiveNetworth .networth-info-icon");

		let seconds = parseInt(time_span.getAttribute("seconds"));
		let new_time = timeAgo(new Date() - (seconds + 1) * 1000);

		time_span.setAttribute("title", `Last updated: ${new_time}`);
		time_span.setAttribute("seconds", seconds + 1);
	}, 1000);

	if (!networth.previous.value) return;

	// networth change
	let headings = ["Type", "Value", "Change"];
	let types = ["Cash (Wallet+Vault)", "Points", "Items", "Bazaar", "Properties", "Stock Market", "Company", "Bookie", "Auction House"];

	let li = doc.new({ type: "li", class: "last tt-networth-li" });
	let table = doc.new({ type: "table", class: "tt-networth-table" });
	let footer = doc.new({ type: "div", class: "tt-networth-footer", text: "Networth change compared to Torn's last known Networth" });

	// table header
	let header_row = doc.new("tr");
	for (let heading of headings) {
		let th = doc.new({ type: "th", text: heading });
		header_row.appendChild(th);
	}
	table.appendChild(header_row);

	// table content
	for (let type of types) {
		let current_value, previous_value;

		if (type.indexOf("Cash") > -1) {
			current_value = networth.current.value.wallet + networth.current.value.vault;
			previous_value = networth.previous.value.wallet + networth.previous.value.vault;
		} else {
			current_value = networth.current.value[type.replace(" ", "").toLowerCase()];
			previous_value = networth.previous.value[type.replace(" ", "").toLowerCase()];
		}

		if (current_value === previous_value) continue;

		current_value = parseInt(current_value);
		previous_value = parseInt(previous_value);

		let tr = doc.new("tr");
		let td_type = doc.new("td");
		td_type.innerText = type;
		let td_value = doc.new("td");
		td_value.innerText = `$${numberWithCommas(current_value)}`;
		let td_change = doc.new("td");

		if (current_value < previous_value) {
			td_change.innerText = `-$${numberWithCommas(Math.abs(current_value - previous_value))}`;
			td_change.setClass("negative-change");
		} else if (current_value > previous_value) {
			td_change.innerText = `+$${numberWithCommas(current_value - previous_value)}`;
			td_change.setClass("positive-change");
		}

		tr.appendChild(td_type);
		tr.appendChild(td_value);
		tr.appendChild(td_change);
		table.appendChild(tr);
	}

	// compiling
	li.appendChild(table);
	li.appendChild(footer);
	networth_row.parentElement.appendChild(li);
}

function displayEffectiveBattleStats() {
	// ebs - effective battle stats
	let battle_stats_container = doc.find("h5=Battle Stats").parentElement.nextElementSibling.find("ul.info-cont-wrap");

	let heading = infoBox.newRow("Effective Battle Stats", "", { heading: true });
	battle_stats_container.appendChild(heading);

	let eff_total = 0;
	let battle_stats = ["Strength", "Defense", "Speed", "Dexterity"];

	for (let i in battle_stats) {
		let stat = parseInt(battle_stats_container.find(`li:nth-child(${parseInt(i) + 1}) .desc`).innerText.replace(/,/g, ""));
		let stat_modifier = battle_stats_container.find(`li:nth-child(${parseInt(i) + 1}) .mod`).innerText;
		let effective_stat = (
			stat *
			(stat_modifier.indexOf("+") > -1
				? 1 + parseInt(stat_modifier.replace("+", "").replace("%", "")) / 100
				: 1 - parseInt(stat_modifier.replace("−", "").replace("%", "")) / 100)
		).toFixed(0); // Not a normal minus symbol "−" (not "-")
		console.log("stat", stat);
		console.log("modifier", stat_modifier);
		console.log("eff_stat", effective_stat);

		eff_total += parseInt(effective_stat);
		let row = infoBox.newRow(battle_stats[i], numberWithCommas(effective_stat, false));
		row.find(".desc").style.width = mobile ? "180px" : "184px";
		battle_stats_container.appendChild(row);
	}

	let total_row = infoBox.newRow("Total", numberWithCommas(eff_total, false), { last: true });
	total_row.find(".desc").style.width = mobile ? "180px" : "184px";

	battle_stats_container.appendChild(total_row);
}
