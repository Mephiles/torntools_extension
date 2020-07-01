window.addEventListener('load', (event) => {
	console.log("TT - API");
	
	// auto-fill API key
	let demo_page_checker = setInterval(function(){
		if(document.querySelector("#demo").style.display != "none"){
			// apply API key
			if(settings.pages.api.key){
				doc.find("#api_key").value = api_key;
				doc.find("#api_key").focus();
			}

			if(settings.pages.api.marking){
				// Show fields in use
				for(let panel of doc.findAll(".panel-group")){
					panel.addEventListener("click", markFieldsTimeout);
					panel.find("button").addEventListener("click", function(event){
						let response_div = event.target.nextElementSibling;
						let responses_before = [...response_div.findAll("span")].length;

						responseLoaded(response_div, responses_before).then(function(loaded){
							if(!loaded)
								return;

							let type = panel.previousElementSibling.innerText.toLowerCase();
							let fields = panel.find(`#${type[0]}_selections`).value;
							markResponse(type, fields, response_div.firstElementChild.find("pre"));
						});
					});

					function markFieldsTimeout() {
						setTimeout(function(){
							let name = panel.previousElementSibling.innerText.toLowerCase();
							let id = panel.find("div[role=tabpanel]").id;
							markFields(name, id);
							panel.removeEventListener("click", markFieldsTimeout);
						}, 500);
					}
				}
			}

			clearInterval(demo_page_checker);
		}
	}, 500);

	// auto-set all responses to Pretty
	if(settings.pages.api.pretty){
		// set resonse type to pretty
		for(let type_pretty of doc.findAll("input[value=pretty]")){
			type_pretty.checked=true
		}
	}
});

function responseLoaded(response_div, responses_before){
	let promise = new Promise(function(resolve, reject){
		let checker = setInterval(function(){
			console.log("checking");
			let responses_now = [...response_div.findAll("span")].length;

			if(responses_now > responses_before){
				resolve(true);
				return clearInterval(checker);
			}
		}, 100);
	});

	return promise.then(function(data){
		return data;
	});
}

function markFields(name, id){
	let fields_container = findFieldsContainer(id);
	let strong = doc.new("strong");
		strong.innerText = "Available fields: ";

	let fields = fields_container.innerText.replace("Available fields: ", "").split(",").map(x => x.trim());
	
	// Clear fields
	fields_container.innerText = "";

	// Add strong
	fields_container.appendChild(strong);

	// Add field spans
	for(let field of fields){
		let span = doc.new("span");
			span.innerText = field;
			in_use[name] && in_use[name][field] ? span.setClass("in-use") : null;

		fields_container.appendChild(span);
		
		if(!lastInList(field, fields)){
			let separator = doc.new("span");
				separator.innerText = ", ";
			
			fields_container.appendChild(separator);
		}
	}
}

function markResponse(type, fields, response_pre){
	console.log("marking response");
	fields = fields.split(",").map(x => x.trim());
	console.log("fields", fields)

	let response_data = JSON.parse(response_pre.innerText);
	console.log("response_data", response_data);

	let new_pre = doc.new("pre");
		new_pre.setClass("modified");

	let starting_span = doc.new("span");
		starting_span.innerText = "{";
		new_pre.appendChild(starting_span);

	let top_level_fields = fields;

	// Remove fields that are not top-level
	for(let response_key in response_data){
		if(typeof response_data[response_key] == "object"){
			response_key = response_key in field_db ? field_db[response_key] : response_key;

			if(top_level_fields.includes(response_key)){
				top_level_fields.splice(top_level_fields.indexOf(response_key), 1);
			}
		}
	}

	console.log("top_level_fields", top_level_fields);

	for(let response_key in response_data){
		if(typeof response_data[response_key] == "object" && !Array.isArray(response_data[response_key])){  // Object

			// New section
			let br = doc.new("br");
				new_pre.appendChild(br);
			let section_start = doc.new("span");
				section_start.innerText = `	"${getTrueField(response_key)}": {`;
				new_pre.appendChild(section_start);

			for(let key of Object.keys(response_data[getTrueField(response_key)])){
				let value = response_data[getTrueField(response_key)][key];
				let is_last = lastInList(key, Object.keys(response_data[getTrueField(response_key)]));
				let quotation_marks = typeof value == "string" ? true : false;

				let br = doc.new("br");
					new_pre.appendChild(br);

				let span = doc.new("span");
					if(quotation_marks){
						span.innerText = `		"${key}": "${value}"` + (is_last ? "":",");
					} else {
						span.innerText = `		"${key}": ${value}` + (is_last ? "":",");
					}
					
				if(response_key in in_use[type] || (response_key in field_db && field_db[response_key] in in_use[type])){
					let in_use_keys = in_use[type][response_key] || in_use[type][field_db[response_key]];
					if(in_use_keys.includes(key)){
						span.setClass("in-use");
					}
				}
				
				new_pre.appendChild(span);
			}

			let br2 = doc.new("br");
				new_pre.appendChild(br2);
			let section_end = doc.new("span");
				section_end.innerText = `	}` + (lastInList(response_key, Object.keys(response_data)) ? "":",");
				new_pre.appendChild(section_end);
		} else if (typeof response_data[response_key] == "object" && Array.isArray(response_data[response_key])) {  // Array

			// New section
			let br = doc.new("br");
				new_pre.appendChild(br);
			let section_start = doc.new("span");
				section_start.innerText = `	"${response_key}": [`;
				new_pre.appendChild(section_start);

			for(let item of response_data[response_key]){
				let is_last = lastInList(item, response_data[response_key]);

				let br = doc.new("br");
					new_pre.appendChild(br);

				if(typeof item == "object" && !Array.isArray(response_data[response_key][item])){
					let starting_span = doc.new("span");
						starting_span.innerText = `		{`;
						new_pre.appendChild(starting_span);

					for(let inner_key in item){
						let value = item[inner_key];
						let is_last = lastInList(inner_key, Object.keys(item));
						let quotation_marks = typeof value == "string" ? true : false;

						let inner_br = doc.new("br");
							new_pre.appendChild(inner_br);

						let inner_span = doc.new("span");
						if(quotation_marks){
							inner_span.innerText = `			"${inner_key}": "${value}"` + (is_last ? "":",");
						} else {
							inner_span.innerText = `			"${inner_key}": ${value}` + (is_last ? "":",");
						}
						new_pre.appendChild(inner_span);
					}

					let br2 = doc.new("br");
						new_pre.appendChild(br2);
					let ending_span = doc.new("span");
						ending_span.innerText = `		}` + (is_last ? "":",");
						new_pre.appendChild(ending_span);
				} else {
					let quotation_marks = typeof item == "string" ? true : false;
					let span = doc.new("span");
						if(quotation_marks){
							span.innerText = `		"${item}"` + (is_last ? "":",");
						} else {
							span.innerText = `		${item}` + (is_last ? "":",");
						}
					new_pre.appendChild(span);
				}
			}

			let br2 = doc.new("br");
				new_pre.appendChild(br2);
			let section_end = doc.new("span");
				section_end.innerText = `	]` + (lastInList(response_key, Object.keys(response_data)) ? "":",");
				new_pre.appendChild(section_end);
		} else {
			let value = response_data[response_key];
			let is_last = lastInList(response_key, Object.keys(response_data));
			let quotation_marks = typeof value == "string" ? true : false;

			let br = doc.new("br");
				new_pre.appendChild(br);
			let span = doc.new("span");
				if(quotation_marks){
					span.innerText = `	"${response_key}": "${value}"` + (is_last ? "":",");
				} else {
					span.innerText = `	"${response_key}": ${value}` + (is_last ? "":",");
				}

			for(let top_level_field of top_level_fields){
				if(top_level_field in in_use[type] || (top_level_field in field_db && top_level_field in in_use[type][field_db[top_level_field]])){
					let keys = in_use[type][top_level_field] || in_use[type][field_db[top_level_field]];
					if(keys.includes(response_key)){
						span.setClass("in-use");
					}
				}
			}

			new_pre.appendChild(span);
		}
	}

	let br = doc.new("br");
		new_pre.appendChild(br);
	let ending_span = doc.new("span");
		ending_span.innerText = "}";
		new_pre.appendChild(ending_span);

	console.log("NEW PRE", new_pre);
	response_pre.classList.add("original");
	response_pre.parentElement.insertBefore(new_pre, response_pre);

	// Add tabs
	let tabs = doc.new("div");
		tabs.setClass("tt-tabs");
	let tab_og = doc.new("div");
		tab_og.setClass("tt-tab");
		tab_og.innerText = "Original";
	let tab_mod = doc.new("div");
		tab_mod.setClass("tt-tab");
		tab_mod.innerText = "Modified";

	tabs.appendChild(tab_og);
	tabs.appendChild(tab_mod);

	tab_og.addEventListener("click", function(){
		!tab_og.classList.contains("active") ? tab_og.classList.add("active") : null;
		tab_mod.classList.remove("active");

		response_pre.classList.add("active");
		new_pre.classList.remove("active");
	});

	tab_mod.addEventListener("click", function(){
		!tab_mod.classList.contains("active") ? tab_mod.classList.add("active") : null;
		tab_og.classList.remove("active");

		new_pre.classList.add("active");
		response_pre.classList.remove("active");
	});

	response_pre.parentElement.insertBefore(tabs, new_pre);
	tab_mod.click();
}

var field_db = {
	"criminalrecord": "crimes",
	"medals_awarded": "medals"
}

var in_use = {
	"user": {
		"battlestats": [
			"strength", "speed", "dexterity", "defense", "total"
		],
		"crimes": [
			"theft", "auto_theft", "drug_deals", "computer_crimes", 
			"murder", "fraud_crimes", "other", "total"
		],
		"personalstats": [ 
			"cityfinds",
			"dumpfinds",
			"organisedcrimes",
			"respectforfaction",
			"awards",
			"pointssold",
			"useractivity",
			"bazaarcustomers",
			"daysbeendonator",
			"tokenrefills",
			"nerverefills",
			"refills",
			"networth",
			"revives",
			"pcptaken",
			"opitaken",
			"shrtaken",
			"spetaken",
			"kettaken",
			"victaken",
			"xantaken",
			"cantaken",
			"lsdtaken",
			"exttaken",
			"virusescoded",
			"bloodwithdrawn",
			"itemsdumped",
			"alcoholused",
			"candyused",
			"medicalitemsused",
			"energydrinkused",
			"stockpayouts",
			"peoplebusted",
			"peoplebought",
			"attackswon",
			"defendswon",
			"attacksassisted",
			"attacksstealthed",
			"defendsstalemated",
			"yourunaway",
			"unarmoredwon",
			"killstreak",
			"bestkillstreak",
			"attackhits",
			"attackcriticalhits",
			"bestdamage",
			"onehitkills",
			"roundsfired",
			"axehits",
			"pishits",
			"rifhits",
			"shohits",
			"smghits",
			"machits",
			"chahits",
			"piehits",
			"grehits",
			"heahits",
			"h2hhits",
			"slahits",
			"largestmug",
			"missioncreditsearned",
			"contractscompleted",
			"bountiescollected",
			"totalbountyreward",
			"raceswon",
			"racingskill",
			"racingpointsearned",
			"mextravel",
			"chitravel",
			"lontravel",
			"switravel",
			"cantravel",
			"argtravel",
			"dubtravel",
			"soutravel",
			"japtravel",
			"hawtravel",
			"caytravel",
			"traveltimes",
			"traveltime",
			"itemsboughtabroad",
		],
		"perks": ["*"],
		"profile": ["player_id", "married"],
		"workstats": ["*"],
		"stocks": ["*"],
		"networth": ["*"]
	},
	"torn": {
		"honors": [],
		"medals": []
	}
}

var markings = {
	"user": {
		"ammo": [],  // Owned ammo types and quantities
		"attacks": [],  // last 100
		"attacksfull": [],  // last 1000
		"bars": [
			"server_time", "happy", "life", "energy", "nerve", "chain"
		],
		"basic": [
			"level", "gender", "player_id", "name", "status"
		],
		"battlestats": [
			"strength", "speed", "dexterity", "defense", "total",
			"strength_modifier", "defense_modifier", "speed_modifier",
			"dexteritiy_modifier", "strength_info", "defense_info",
			"speed_info", "dexterity_info"
		],
		"bazaar": [],
		"cooldowns": [
			"drug", "medical", "booster"
		],
		"crimes": [
			"selling_illegal_products", "theft", "auto_theft", "drug_deals",
			"computer_crimes", "murder", "fraud_crimes", "other", "total"
		],
		"discord": [
			"userID", "discordID"
		],
		"display": [],  // Item display cabinet
		"education": [
			"education_current", "education_timeleft", "education_completed"
		],
		"events": [],
		"gym": [
			"active_gym"
		],
		"hof": [
			"attacks", "battlestats", "busts", "defends", "networth",
			"offences", "revives", "traveled", "workstats", "level",
			"rank", "respect"
		],
		"honors": [
			"honors_awarded", "honors_time"
		],
		"icons": [],
		"inventory": [], 
		"jobpoints": [
			"jobs", "companies"
		],
		"medals": [
			"medals_awarded", "medals_time"
		],
		"merits": [
			"Nerve Bar", "Critical Hit Rate", "Life Points", "Crime Experience",
			"Education Length", "Awareness", "Bank Interest", "Masterful Looting",
			"Stealth", "Hospitalizing", "Brawn", "Protection", "Sharpness", "Evasion",
			"Heavy Artillery Mastery", "Machine Gun Mastery", "Rifle Mastery", "SMG Mastery",
			"Shotgun Mastery", "Pistol Mastery", "Club Mastery", "Piercing Mastery", 
			"Slashing Mastery", "Mechanical Mastery", "Temporary Mastery"
		],
		"messages": [],
		"money": [
			"points", "cayman_bank", "vault_amount", "networth", 
			"money_onhand", "city_bank"
		],
		"networth": [
			"pending", "wallet", "bank", "points", "cayman",
			"vault", "piggybank", "items", "displaycase",
			"bazaar", "properties", "stockmarket", "auctionhouse",
			"company", "bookie", "loan", "unpaidfees", "total",
			"parsetime"
		],
		"notifications": [
			"messages", "events", "awards", "competition"
		],
		"perks": [
			"job_perks", "property_perks", "stock_perks", "merit_perks", 
			"education_perks", "enhancer_perks", "company_perks", "faction_perks", 
			"book_perks"
		],
		"personalstats": [
			"weaponsbought",
			"attackmisses",
			"attackdamage",
			"moneymugged",
			"highestbeaten",
			"dumpsearches",
			"logins",
			"hospital",
			"attackslost",
			"itemsbought",
			"mailssent",
			"dukecontractscompleted",
			"itemssent",
			"trainsreceived",
			"defendslost",
			"missionscompleted",
			"jailed",
			"bountiesplaced",
			"totalbountyspent",
			"pointsbought",
			"attacksdraw",
			"factionmailssent",
			"companymailssent",
			"friendmailssent",
			"bountiesreceived",
			"revivesreceived",
			"trades",
			"drugsused",
			"moneyinvested",
			"investedprofit",
			"overdosed",
			"peopleboughtspent",
			"failedbusts",
			"bazaarsales",
			"bazaarprofit",
			"consumablesused",
			"boostersused",
			"territorytime",
			"rehabs",
			"rehabcost",
			"classifiedadsplaced",
			"auctionsells",
			"racesentered",
			"receivedbountyvalue",
			"networthwallet",
			"networthbank",
			"networthpoints",
			"networthvault",
			"networthitems",
			"networthproperties",
			"networthstockmarket",
			"networthunpaidfees",
			"networthpending",
			"networthcayman",
			"networthdisplaycase",
			"networthauctionhouse",
			"networthcompany",
			"networthbookie",
			"networthloan",
			"cityitemsbought",
			"networthpiggybank",
			"networthbazaar",
			"specialammoused",
			"piercingammoused",
			"spousemailssent",
		],
		"profile": [
			"rank", "level", "gender", "property", "signup", "awards",
			"friends", "enemies", "forum_posts", "karma", "age",
			"role", "donator", "player_id", "name", "property_id",
			"life", "status", "job", "faction", "married", "basicicons", 
			"states", "last_action"
		],
		"properties": [],
		"receivedevents": [],
		"refills": [
			"energy_refill_used", "nerve_refill_used", "token_refill_used",
			"special_refills_available"
		],
		"revives": [],
		"revivesfull": [],
		"stocks": [],
		"timestamp": [],
		"travel": [
			"destination", "timestamp", "departed", "time_left"
		],
		"weaponexp": [],
		"workstats": [
			"manual_labor", "intelligence", "endurance"
		]
	}
}

function findFieldsContainer(id){
	for(let div of doc.findAll(`#${id} .panel-body>p`)){
		if(div.classList.length > 0 && div.classList[0].indexOf("fields") > -1){
			return div.find("small");
		}
	}
	return false;
}

function getTrueField(field){
	for(let key in field_db){
		if(field_db[key] == field){
			return key;
		}
	}
	return field;
}