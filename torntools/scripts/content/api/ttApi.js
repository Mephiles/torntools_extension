requireDatabase(false).then(() => {
	console.log("TT - API page");

	// auto-fill API key
	if (settings.pages.api.marking) {
		doc.find("#api_key").addEventListener("focusout", () => {
			for (let panel of doc.findAll(".panel-group")) {
				const name = panel.previousElementSibling.innerText.toLowerCase();
				const id = panel.find("div[role=tabpanel]").id;

				if (panel.find(".panel-collapse").classList.contains("in")) {
					requireCondition(() => !findFieldsContainer(id).classList.contains("tt-modified")).then(() => markFields(name, id));
				} else {
					panel.addEventListener("click", markFieldsTimeout);
				}
				panel.find("button").addEventListener("click", (event) => {
					let response_div = event.target.nextElementSibling;
					let responses_before = [...response_div.findAll("span")].length;

					responseLoaded(response_div, responses_before).then((loaded) => {
						if (!loaded) return;

						let type = panel.previousElementSibling.innerText.toLowerCase();
						let fields = panel.find(`#${type[0]}_selections`).value;
						markResponse(type, fields, response_div.firstElementChild.find("pre"));
					});
				});

				function markFieldsTimeout() {
					setTimeout(() => {
						markFields(name, id);
						panel.removeEventListener("click", markFieldsTimeout);
					}, 500);
				}
			}
		});
	}
	requireCondition(() => doc.find("#demo").style.display !== "none", { delay: 100 }).then(() => {
		if (settings.pages.api.key) {
			doc.find("#api_key").value = api_key;
			doc.find("#api_key").focus();
		}
		if (settings.pages.api.marking) {
			// Show fields in use
			for (let panel of doc.findAll(".panel-group")) {
				panel.addEventListener("click", markFieldsTimeout);
				panel.find("button").addEventListener("click", (event) => {
					let response_div = event.target.nextElementSibling;
					let responses_before = [...response_div.findAll("span")].length;

					responseLoaded(response_div, responses_before).then((loaded) => {
						if (!loaded) return;

						let type = panel.previousElementSibling.innerText.toLowerCase();
						let fields = panel.find(`#${type[0]}_selections`).value;
						markResponse(type, fields, response_div.firstElementChild.find("pre"));
					});
				});

				function markFieldsTimeout() {
					setTimeout(() => {
						let name = panel.previousElementSibling.innerText.toLowerCase();
						let id = panel.find("div[role=tabpanel]").id;
						markFields(name, id);
						panel.removeEventListener("click", markFieldsTimeout);
					}, 500);
				}
			}
		}
	});

	// auto-set all responses to Pretty
	if (settings.pages.api.pretty) {
		// set response type to pretty
		for (let type_pretty of doc.findAll("input[value=pretty]")) {
			type_pretty.checked = true;
		}
	}

	if (settings.pages.api.autoDemo) {
		setTimeout(() => {
			doc.find(".demoLink").click();
		}, 75);
	}
});

function responseLoaded(response_div, responses_before) {
	let promise = new Promise((resolve) => {
		let checker = setInterval(() => {
			console.log("checking");
			let responses_now = [...response_div.findAll("span")].length;

			if (responses_now > responses_before) {
				resolve(true);
				return clearInterval(checker);
			}
		}, 100);
	});

	return promise.then((data) => data);
}

function markFields(name, id) {
	let fields_container = findFieldsContainer(id);
	let strong = doc.new("strong");
	strong.innerText = "Available fields: ";

	fields_container.classList.add("tt-modified");
	let fields = fields_container.innerText
		.replace("Available fields: ", "")
		.split(",")
		.map((x) => x.trim());

	// Clear fields
	fields_container.innerText = "";

	// Add strong
	fields_container.appendChild(strong);

	// Add field spans
	for (let field of fields) {
		let span = doc.new({
			type: "span",
			text: field,
			class: `selection ${in_use[name] && in_use[name][field] ? "in-use" : ""}`,
		});

		// in_use[name] && in_use[name][field] ? span.setClass("in-use") : null;

		fields_container.appendChild(span);

		if (!lastInList(field, fields)) {
			let separator = doc.new("span");
			separator.innerText = ", ";

			fields_container.appendChild(separator);
		}
	}

	doc.findAll(".selection").forEach((selection) => {
		selection.addEventListener("click", (event) => {
			const panel = event.target.closest("div.panel-group");
			const selections_input = panel.querySelector("input[id*=selections]");

			if (event.ctrlKey) {
				if (selections_input.value === "") selections_input.value = event.target.innerText;
				else selections_input.value += "," + event.target.innerText;
			} else {
				selections_input.value = event.target.innerText;
				panel.find("button").click();
			}
		});
	});
}

function markResponse(type, fields, response_pre) {
	console.log("marking response");
	fields = fields.split(",").map((x) => x.trim());
	console.log("fields", fields);

	const response_data = JSON.parse(response_pre.innerText);

	let new_pre = doc.new({
		type: "pre",
		class: "modified",
	});

	new_pre.appendChild(
		doc.new({
			type: "span",
			text: "{",
		})
	);

	let top_level_fields = [...fields];

	// Remove fields that are not top-level
	for (let response_key in response_data) {
		console.log("1", response_key);
		if (typeof response_data[response_key] == "object") {
			console.log("2", field_db[response_key], top_level_fields);
			response_key = response_key in field_db ? field_db[response_key] : response_key;

			if (top_level_fields.includes(response_key)) {
				top_level_fields.splice(top_level_fields.indexOf(response_key), 1);
			}
		}
	}

	console.log("top_level_fields", top_level_fields);

	loadResponses(type, response_data, new_pre, 1, false, fields);

	new_pre.appendChild(
		doc.new({
			type: "div",
			text: "",
		})
	);

	response_pre.classList.add("original");
	response_pre.parentElement.insertBefore(new_pre, response_pre);

	// Add tabs
	let tabs = doc.new({ type: "div", class: "tt-tabs" });
	let tab_og = doc.new({ type: "div", class: "tt-tab", text: "Original" });
	let tab_mod = doc.new({ type: "div", class: "tt-tab", text: "Modified" });

	tabs.appendChild(tab_og);
	tabs.appendChild(tab_mod);

	tab_og.addEventListener("click", function () {
		!tab_og.classList.contains("active") ? tab_og.classList.add("active") : null;
		tab_mod.classList.remove("active");

		response_pre.classList.add("active");
		new_pre.classList.remove("active");
	});

	tab_mod.addEventListener("click", function () {
		!tab_mod.classList.contains("active") ? tab_mod.classList.add("active") : null;
		tab_og.classList.remove("active");

		new_pre.classList.add("active");
		response_pre.classList.remove("active");
	});

	response_pre.parentElement.insertBefore(tabs, new_pre);
	tab_mod.click();
}

function loadResponses(type, response, modifiedSection, level, skipFirstLine, selections) {
	const indent = getIndent(level);

	let skipLine = skipFirstLine;
	for (let responseField in response) {
		if (!response.hasOwnProperty(responseField)) continue;

		if (!skipLine) modifiedSection.appendChild(doc.new("br"));
		else skipLine = false;

		if (typeof response[responseField] === "object") {
			if (Array.isArray(response[responseField])) {
				modifiedSection.appendChild(
					doc.new({
						type: "span",
						text: `${indent}"${responseField}": [`,
					})
				);

				let skipLine = false;
				for (let item of response[responseField]) {
					const isLast = lastInList(item, response[responseField]);

					if (!skipLine) modifiedSection.appendChild(doc.new("br"));
					else skipLine = false;

					if (typeof item === "object") {
						if (Array.isArray(item)) {
							modifiedSection.appendChild(
								doc.new({
									type: "span",
									text: `${getIndent(level + 1)}NOT SUPPORTED`,
								})
							);
						} else {
							showObject({
								object: item,
								items: response[responseField],
								level: level + 1,
								isLast,
							});
							skipLine = true;
						}
					} else {
						showText({
							value: item,
							level: level + 1,
							isLast,
						});
					}
				}

				modifiedSection.appendChild(
					doc.new({
						type: "div",
						text: `${indent}]${lastInList(responseField, Object.keys(response)) ? "" : ","}`,
					})
				);
			} else {
				showObject({
					name: responseField,
					items: Object.keys(response),
					object: response[responseField],
				});
			}
			skipLine = true;
		} else {
			showText({
				name: responseField,
				value: response[responseField],
			});
		}
	}

	function getIndent(level) {
		let indent = "";

		for (let i = 0; i < level; i++) {
			indent += "        ";
		}

		return indent;
	}

	function showObject(attr) {
		const attributes = {
			level: level,
			...attr,
		};

		if (attributes.name && attributes.items) {
			if (!attributes.object) attributes.object = attributes.items[attributes.name];
			if (!attributes.isLast) attributes.isLast = lastInList(attributes.name, attributes.items);
		}

		const indent = getIndent(attributes.level);

		if (attributes.name) {
			modifiedSection.appendChild(
				doc.new({
					type: "div",
					text: `${indent}"${attributes.name}": {`,
				})
			);
		} else {
			modifiedSection.appendChild(
				doc.new({
					type: "div",
					text: `${indent}{`,
				})
			);
		}

		loadResponses(type, attributes.object, modifiedSection, attributes.level + 1, true, selections);

		modifiedSection.appendChild(
			doc.new({
				type: "div",
				text: `${indent}}${attributes.isLast ? "" : ","}`,
			})
		);
	}

	function showText(attr) {
		const attributes = {
			level: level,
			...attr,
		};

		if (attributes.name && attributes.items) {
			if (!attributes.value) attributes.value = attributes.items[attributes.name];
			if (!attributes.isLast) attributes.isLast = lastInList(attributes.name, attributes.items);
		}

		const quotation_marks = typeof attributes.value == "string";

		const indent = getIndent(attributes.level);
		let span;
		if (attributes.name) {
			span = doc.new({
				type: "span",
				text: `${indent}"${attributes.name}": ${quotation_marks ? `"${attributes.value}"` : attributes.value}${attributes.isLast ? "" : ","}`,
			});

			for (let selection in in_use[type]) {
				if (!in_use[type].hasOwnProperty(selection)) continue;
				if (!selections.includes(selection)) continue;

				const keys = in_use[type][selection];

				if (keys.includes("*") || keys.includes(attributes.name)) span.setClass("in-use");

				console.log("selection", selection, in_use[type][selection]);
			}
		} else {
			span = doc.new({
				type: "span",
				text: `${indent}${quotation_marks ? `"${attributes.value}"` : attributes.value}${attributes.isLast ? "" : ","}`,
			});
		}

		modifiedSection.appendChild(span);
	}
}

const field_db = {
	criminalrecord: "crimes",
	medals_awarded: "medals",
};

const in_use = {
	user: {
		ammo: ["*"],
		battlestats: ["strength", "speed", "dexterity", "defense", "total"],
		crimes: ["selling_illegal_products", "theft", "auto_theft", "drug_deals", "computer_crimes", "murder", "fraud_crimes", "other", "total"],
		personalstats: [
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
		perks: ["*"],
		profile: ["player_id", "married"],
		workstats: ["*"],
		stocks: ["*"],
		networth: ["*"],
	},
	torn: {
		honors: [],
		medals: [],
	},
};

const markings = {
	user: {
		ammo: [], // Owned ammo types and quantities
		attacks: [], // last 100
		attacksfull: [], // last 1000
		bars: ["server_time", "happy", "life", "energy", "nerve", "chain"],
		basic: ["level", "gender", "player_id", "name", "status"],
		battlestats: [
			"strength",
			"speed",
			"dexterity",
			"defense",
			"total",
			"strength_modifier",
			"defense_modifier",
			"speed_modifier",
			"dexterity_modifier",
			"strength_info",
			"defense_info",
			"speed_info",
			"dexterity_info",
		],
		bazaar: [],
		cooldowns: ["drug", "medical", "booster"],
		crimes: ["selling_illegal_products", "theft", "auto_theft", "drug_deals", "computer_crimes", "murder", "fraud_crimes", "other", "total"],
		discord: ["userID", "discordID"],
		display: [], // Item display cabinet
		education: ["education_current", "education_timeleft", "education_completed"],
		events: [],
		gym: ["active_gym"],
		hof: ["attacks", "battlestats", "busts", "defends", "networth", "offences", "revives", "traveled", "workstats", "level", "rank", "respect"],
		honors: ["honors_awarded", "honors_time"],
		icons: [],
		inventory: [],
		jobpoints: ["jobs", "companies"],
		medals: ["medals_awarded", "medals_time"],
		merits: [
			"Nerve Bar",
			"Critical Hit Rate",
			"Life Points",
			"Crime Experience",
			"Education Length",
			"Awareness",
			"Bank Interest",
			"Masterful Looting",
			"Stealth",
			"Hospitalizing",
			"Brawn",
			"Protection",
			"Sharpness",
			"Evasion",
			"Heavy Artillery Mastery",
			"Machine Gun Mastery",
			"Rifle Mastery",
			"SMG Mastery",
			"Shotgun Mastery",
			"Pistol Mastery",
			"Club Mastery",
			"Piercing Mastery",
			"Slashing Mastery",
			"Mechanical Mastery",
			"Temporary Mastery",
		],
		messages: [],
		money: ["points", "cayman_bank", "vault_amount", "networth", "money_onhand", "city_bank"],
		networth: [
			"pending",
			"wallet",
			"bank",
			"points",
			"cayman",
			"vault",
			"piggybank",
			"items",
			"displaycase",
			"bazaar",
			"properties",
			"stockmarket",
			"auctionhouse",
			"company",
			"bookie",
			"loan",
			"unpaidfees",
			"total",
			"parsetime",
		],
		notifications: ["messages", "events", "awards", "competition"],
		perks: [
			"job_perks",
			"property_perks",
			"stock_perks",
			"merit_perks",
			"education_perks",
			"enhancer_perks",
			"company_perks",
			"faction_perks",
			"book_perks",
		],
		personalstats: [
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
		profile: [
			"rank",
			"level",
			"gender",
			"property",
			"signup",
			"awards",
			"friends",
			"enemies",
			"forum_posts",
			"karma",
			"age",
			"role",
			"donator",
			"player_id",
			"name",
			"property_id",
			"life",
			"status",
			"job",
			"faction",
			"married",
			"basicicons",
			"states",
			"last_action",
		],
		properties: [],
		receivedevents: [],
		refills: ["energy_refill_used", "nerve_refill_used", "token_refill_used", "special_refills_available"],
		revives: [],
		revivesfull: [],
		stocks: [],
		timestamp: [],
		travel: ["destination", "timestamp", "departed", "time_left"],
		weaponexp: [],
		workstats: ["manual_labor", "intelligence", "endurance"],
	},
};

function findFieldsContainer(id) {
	for (let div of doc.findAll(`#${id} .panel-body>p`)) {
		if (div.classList.length > 0 && div.classList[0].indexOf("fields") > -1) {
			return div.find("small");
		}
	}
	return false;
}
