window.addEventListener('load', async (event) => {
    console.log("TT - Home");

    if(await flying() || await abroad())
        return;

	local_storage.get(["settings", "networth", "extensions"], function([settings, networth, extensions]){
		if(settings.pages.home.networth && networth.previous.value.total)
			displayNetworth(networth);

		if(!extensions.doctorn)
			displayEffectiveBattleStats();
	});
});

function displayNetworth(networth){
	console.log("Networth", networth);

	// current networth
	let networth_text = `$${numberWithCommas(networth.current.value.total, shorten=false)}`;
	let networth_row = info_box.new_row("TornTools - Networth", networth_text, {
		parent_heading: "General Information",
		style: `background-color: #65c90069`
	});

	// networth change
	networth_row.removeAttribute("class");

	let headings = ["Type", "Value", "Change"];
	let types = ["Cash (Wallet+Vault)", "Points", "Items", "Bazaar", "Properties", "Stock Market", "Company", "Bookie", "Auction House"];

	let li = doc.new("li");
		li.setClass("last tt-networth-li");
	let table = doc.new("table");
		table.setClass("tt-networth-table");
	let footer = doc.new("div");
		footer.setClass("tt-networth-footer")

	// table header
	let header_row = doc.new("tr");
	for(let heading of headings){
		let th = doc.new("th");
		th.innerText = heading;
		header_row.appendChild(th);
	}
	table.appendChild(header_row);

	// table content
	for(let type of types){
		let current_value, previous_value;
		
		if(type.indexOf("Cash") > -1){
			current_value = networth.current.value.wallet + networth.current.value.vault;
			previous_value = networth.previous.value.wallet + networth.previous.value.vault;
		} else {
			current_value = networth.current.value[type.replace(" ", "").toLowerCase()];
			previous_value = networth.previous.value[type.replace(" ", "").toLowerCase()];
		}

		if(current_value == previous_value)
			continue;

		current_value = parseInt(current_value);
		previous_value = parseInt(previous_value);
		
		let tr = doc.new("tr");
		let td_type = doc.new("td");
			td_type.innerText = type;
		let td_value = doc.new("td");
			td_value.innerText = `$${numberWithCommas(current_value)}`;
		let td_change = doc.new("td");

		if(current_value < previous_value){
			td_change.innerText = `-$${numberWithCommas(Math.abs(current_value - previous_value))}`
			td_change.setClass("negative-change")
		} else if(current_value > previous_value){
			td_change.innerText = `+$${numberWithCommas(current_value - previous_value)}`
			td_change.setClass("positive-change")
		}

		tr.appendChild(td_type);
		tr.appendChild(td_value);
		tr.appendChild(td_change);
		table.appendChild(tr);
	}

	// table footer
	let [day, month, year, hours, minutes, seconds] = dateParts(new Date(networth.previous.date));
	footer.innerText = `Networth change compared to ${day}.${month}.${year} | ${hours}:${minutes}:${seconds}`;

	// compiling
	li.appendChild(table);
	li.appendChild(footer);
	networth_row.parentElement.appendChild(li);

}

function displayEffectiveBattleStats(){
	// ebs - effective battle stats

	let battle_stats_container = doc.find("h5=Battle Stats").parentElement.nextElementSibling;
	info_box.new_row("TornTools", "Effective Battle Stats", {heading: true, parent_heading: "Battle Stats"});
	
	let eff_total = 0;
	let battle_stats = ["Strength", "Defense", "Speed", "Dexterity"]

	for(let i in battle_stats){
		let stat = parseInt(battle_stats_container.find(`li:nth-child(${parseInt(i)+1}) .desc`).innerText.replace(/,/g, ""))
		let stat_modifier = battle_stats_container.find(`li:nth-child(${parseInt(i)+1}) .mod`).innerText;
		let effective_stat = (stat * (stat_modifier.indexOf("+") > -1 ? 1+(parseInt(stat_modifier)/100) : 1-(parseInt(stat_modifier)/100))).toFixed(0);

		eff_total += parseInt(effective_stat);
		info_box.new_row(battle_stats[i], numberWithCommas(effective_stat, shorten=false), {parent_heading: "Battle Stats", value_style: "width: 184px"});
	}

	info_box.new_row("Total", numberWithCommas(eff_total, shorten=false), {parent_heading: "Battle Stats", value_style: "width: 184px"});
}