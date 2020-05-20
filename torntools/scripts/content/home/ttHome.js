window.addEventListener('load', async (event) => {
    console.log("TT - Home");

    if(await flying() || await abroad())
        return;

	local_storage.get(["settings", "networth", "extensions"], function([settings, networth, extensions]){
		if(settings.pages.home.networth)
			displayNetworth(networth, settings.format);

		if(settings.pages.home.battle_stats && !extensions.doctorn)
			displayEffectiveBattleStats(settings.theme);
	});
});

function displayNetworth(networth, format){
	console.log("Networth", networth);

	// current networth
	let networth_text = `$${numberWithCommas(networth.current.value.total, shorten=false)}`;
	let networth_row = info_box.new_row("TornTools - Networth", networth_text, {
		parent_heading: "General Information",
		style: `background-color: #65c90069`,
		id: "ttLiveNetworth"
	});

	// Networth last updated info icon
	let info_icon = doc.new("i");
		info_icon.setClass("networth-info-icon");
		info_icon.setAttribute("seconds", ((new Date() - Date.parse(networth.current.date))/1000));
		info_icon.setAttribute("title", ("Last updated: " + time_ago(Date.parse(networth.current.date))));
		info_icon.style.marginLeft = "9px"

	networth_row.find(".desc").appendChild(info_icon);

	// increment time
    let time_increase = setInterval(function(){
        let time_span = doc.find("#ttLiveNetworth .networth-info-icon");

        let seconds = parseInt(time_span.getAttribute("seconds"));
        let new_time = time_ago(new Date() - (seconds+1)*1000);

        time_span.setAttribute("title", `Last updated: ${new_time}`);
        time_span.setAttribute("seconds", seconds+1);
    }, 1000);

	if(!networth.previous.value)
		return;

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
	footer.innerText = `Networth change compared to ${formatDate([day, month, year], format.date)} | ${formatTime([hours, minutes, seconds], format.time)}`;

	// compiling
	li.appendChild(table);
	li.appendChild(footer);
	networth_row.parentElement.appendChild(li);

}

function displayEffectiveBattleStats(theme){
	// ebs - effective battle stats

	let battle_stats_container = doc.find("h5=Battle Stats").parentElement.nextElementSibling;
	info_box.new_row("TornTools", "Effective Battle Stats", {heading: true, parent_heading: "Battle Stats", theme: theme});
	console.log("Container", battle_stats_container);
	
	let eff_total = 0;
	let battle_stats = ["Strength", "Defense", "Speed", "Dexterity"]

	for(let i in battle_stats){
		let stat = parseInt(battle_stats_container.find(`li:nth-child(${parseInt(i)+1}) .desc`).innerText.replace(/,/g, ""));
		let stat_modifier = battle_stats_container.find(`li:nth-child(${parseInt(i)+1}) .mod`).innerText;
		let effective_stat = (stat * (stat_modifier.indexOf("+") > -1 ? 1+(parseInt(stat_modifier.replace("+", "").replace("%", ""))/100) : 1-(parseInt(stat_modifier.replace("-", "").replace("%", ""))/100))).toFixed(0);
		console.log("stat", stat);
		console.log("modifier", stat_modifier);
		console.log("eff_stat", effective_stat);

		eff_total += parseInt(effective_stat);
		info_box.new_row(battle_stats[i], numberWithCommas(effective_stat, shorten=false), {parent_heading: "Battle Stats", value_style: "width: 184px"});
	}

	info_box.new_row("Total", numberWithCommas(eff_total, shorten=false), {parent_heading: "Battle Stats", value_style: "width: 184px"});
}