const money_key_list = ["networth", "moneymugged", "largestmug", "peopleboughtspent", "receivedbountyvalue", "totalbountyspent", "totalbountyreward", "rehabcost"];
const key_dict = {
	basic: {
		awards: "Awards",
		logins: "Logins",
		networth: "Networth",
		useractivity: "User Activity",
		statenhancersused: "Stat Enhancers Used",
	},
	attacks: {
		attackswon: "Attacks: Won",
		attackslost: "Attacks: Lost",
		attacksdraw: "Attacks: Draw",
		attacksstealthed: "Attacks: Stealthed",
		attackhits: "Attacks: Total Hits",
		attackmisses: "Attacks: Misses",
		attacksassisted: "Attacks: Assisted",
		attackswonabroad: "Attacks: Won Abroad",
		highestbeaten: "Attacks: Highest Lvl Beaten",
		largestmug: "Attacks: Largest Mug",
		moneymugged: "Attacks: Money Mugged",
		onehitkills: "Attacks: One Hit Kills",
		attackdamage: "Attacks: Total Damage",
		yourunaway: "Attacks: Escaped",
		unarmoredwon: "Attacks: Unarmored Wins",
		weaponsbought: "Attacks: Weapons Bought",
		attackcriticalhits: "Attacks: Critical Hits",
		bestdamage: "Attacks: Best Damage",
		bestkillstreak: "Attacks: Best Killstreak",
		arrestsmade: "Attacks: Arrests",
		roundsfired: "Attacks: Ammo: Fired",
		incendiaryammoused: "Attacks: Ammo: Incendiary",
		piercingammoused: "Attacks: Ammo: Piercing",
		tracerammoused: "Attacks: Ammo: Tracer",
		specialammoused: "Attacks: Ammo: Special Total",
		hollowammoused: "Attacks: Ammo: Hollow Point",
	},
	bounties: {
		bountiesplaced: "Bounties: Placed",
		bountiescollected: "Bounties: Completed",
		totalbountyreward: "Bounties: Rewards",
		totalbountyspent: "Bounties: Spent On",
		receivedbountyvalue: "Bounties: Received",
		bountiesreceived: "Bounties: Times Bountied",
	},
	crimes: {
		selling_illegal_products: "Crimes: Sell illegal products",
		theft: "Crimes: Theft",
		auto_theft: "Crimes: Auto theft",
		drug_deals: "Crimes: Drug deals",
		computer_crimes: "Crimes: Computer",
		murder: "Crimes: Murder",
		fraud_crimes: "Crimes: Fraud",
		other: "Crimes: Other",
		total: "Crimes: Total",
		organisedcrimes: "Crimes: Organised Crimes",
	},
	consumables: {
		candyused: "Consumables: Candy",
		energydrinkused: "Consumables: Energy Drinks",
		consumablesused: "Consumables: Total",
		alcoholused: "Consumables: Alcohol",
		boostersused: "Consumables: Boosters",
	},
	contracts: {
		contractscompleted: "Contracts: Completed",
		dukecontractscompleted: "Contracts: Duke",
		missionscompleted: "Contracts: Missions Completed",
		missioncreditsearned: "Contracts: Miss. Credits Earned",
	},
	defends: {
		defendswon: "Defends: Won",
		defendslost: "Defends: Lost",
		defendsstalemated: "Defends: Stalemated",
		defendslostabroad: "Defends: Lost Abroad",
	},
	drugs: {
		cantaken: "Drugs: Cannabis",
		exttaken: "Drugs: Ecstasy",
		lsdtaken: "Drugs: LSD",
		shrtaken: "Drugs: Shrooms",
		xantaken: "Drugs: Xanax",
		victaken: "Drugs: Vicodin",
		drugsused: "Drugs: Total",
		kettaken: "Drugs: Ketamine",
		opitaken: "Drugs: Opium",
		spetaken: "Drugs: Speed",
		pcptaken: "Drugs: PCP",
		overdosed: "Drugs: Overdosed",
	},
	finishers: {
		chahits: "Finishers: Mechanical",
		axehits: "Finishers: Clubbing",
		grehits: "Finishers: Temporary",
		pishits: "Finishers: Pistol",
		rifhits: "Finishers: Rifle",
		smghits: "Finishers: SMG",
		piehits: "Finishers: Piercing",
		slahits: "Finishers: Slashing",
		shohits: "Finishers: Shotgun",
		heahits: "Finishers: Heavy Artillery",
		machits: "Finishers: Machine Guns",
		h2hhits: "Finishers: Unarmed",
	},
	items: {
		itemsbought: "Items: Bought",
		itemsboughtabroad: "Items: Bought Abroad",
		itemssent: "Items: Sent",
		auctionsells: "Items: Auctioned",
		cityfinds: "Items: Found in City",
		itemsdumped: "Items: Dumped",
	},
	refills: {
		nerverefills: "Refills: Nerve",
		tokenrefills: "Refills: Token",
		refills: "Refills: Energy",
	},
	revives: {
		revives: "Revives: Given",
		revivesreceived: "Revives: Received",
	},
	travel: {
		argtravel: "Travel: Argentina",
		mextravel: "Travel: Mexico",
		dubtravel: "Travel: UAE",
		hawtravel: "Travel: Hawaii",
		japtravel: "Travel: Japan",
		lontravel: "Travel: UK",
		soutravel: "Travel: South Africa",
		switravel: "Travel: Switzerland",
		chitravel: "Travel: China",
		cantravel: "Travel: Canada",
		caytravel: "Travel: Cayman Islands",
		traveltimes: "Travel: Total",
		traveltime: "Travel: Time Spent",
	},
	other: {
		auctionswon: "Auctions Won",

		peopleboughtspent: "Bail Fees Spent",
		booksread: "Books Read",
		bloodwithdrawn: "Blood Bags Filled",

		classifiedadsplaced: "Classified Ads Placed",
		companymailssent: "Company Mail Sent",

		dumpfinds: "Dump Finds",
		dumpsearches: "Dump Searches",
		daysbeendonator: "Days Been A Donator",

		failedbusts: "Failed Busts",
		theyrunaway: "Foes Escaped",
		friendmailssent: "Friend Mail Sent",
		factionmailssent: "Faction Mail Sent",

		peoplebusted: "Jail: Busted",
		peoplebought: "Jail: Bailed",
		jailed: "Jail: Total",

		medicalitemsused: "Meds Used",
		medstolen: "Meds Stolen",
		meritsbought: "Merits Bought",
		rehabcost: "Money Spent On Rehab",

		pointsbought: "Points Bought",
		personalsplaced: "Personal Ads Placed",

		respectforfaction: "Respect Earned",
		rehabs: "Rehabs Done",
		racingpointsearned: "Racing: Points Earned",
		raceswon: "Racing: Won",
		racesentered: "Racing: Entered",

		spousemailssent: "Spouse Mail Sent",
		spydone: "Spies Done",
		cityitemsbought: "Shop Purchases",

		trainsreceived: "Times Trained",
		mailssent: "Total Mail Sent",
		hospital: "Times In Hospital",
		territorytime: "Territory Time",

		virusescoded: "Viruses Coded",
	},
};
let userId;

requireDatabase().then(() => {
	profileLoaded().then(async () => {
		console.log("TT - Profile");

		userId = getUserId();
		let user_faction = userdata.faction.faction_name;

		if (settings.pages.profile.show_id) {
			showId();
		}

		if (settings.pages.profile.friendly_warning) {
			displayAlly(user_faction, allies);
		}

		if (settings.pages.profile.loot_times) {
			displayLootLevel(loot_times);
		}

		if (settings.pages.profile.status_indicator) {
			addStatusIndicator();
		}
		displayCreator();

		if (shouldDisable()) return;

		// noinspection EqualityComparisonWithCoercionJS
		if (userId == userdata.player_id) return;

		// Profile notes
		if (settings.pages.profile.notes) showProfileNotes();

		// Profile stats
		let info_container = content.newContainer("User Info", { next_element_heading: "Medals", id: "tt-target-info" });

		let section_profile_stats = doc.new({ type: "div", class: "tt-section", attributes: { name: "profile-stats" } });
		let profile_stats_div = doc.new({ type: "div", class: `profile-stats ${mobile ? "tt-mobile" : ""}` });
		section_profile_stats.appendChild(profile_stats_div);
		info_container.find(".content").appendChild(section_profile_stats);

		if (!filters.profile_stats.auto_fetch) {
			let button = doc.new({ type: "div", class: `fetch-button`, text: "Fetch Info via API" });
			profile_stats_div.appendChild(button);

			button.addEventListener("click", async () => {
				button.remove();
				await fetchStats();
			});
		} else {
			await fetchStats();
		}

		// Target info
		if (target_list.show) {
			displayTargetInfo(target_list.targets);
		}

		// Stakeout
		displayStakeoutOptions();

		// Make content sortable
		sortSections(doc.find("#tt-target-info .content"), "profile");
		new Sortable(doc.find("#tt-target-info .content"), {
			handle: ".uk-sortable-handle", // handle's class
			animation: 150,
			onMove: () => {
				setTimeout(() => {
					saveSortingOrder(doc.find("#tt-target-info .content"), "profile");
				}, 100);
			},
		});

		// Make profile stats sortable
		new Sortable(doc.find("#tt-target-info .tt-stats-table .col-chosen"), {
			animation: 150,
			onMove: () => {
				setTimeout(saveProfileStats, 100);
			},
		});

		// Add Edit button
		let edit_button = doc.new({
			type: "div",
			id: "tt-edit",
			class: "tt-option",
			children: [
				doc.new({ type: "i", class: "fas fa-cog" }),
				doc.new({ type: "span", class: "text", text: "Edit" }),
			],
		});
		doc.find("#tt-target-info .tt-options").appendChild(edit_button);

		edit_button.onclick = event => {
			event.stopPropagation();

			if (doc.find(".tt-black-overlay").classList.contains("active")) {
				doc.find(".tt-black-overlay").classList.remove("active");
				doc.find(".tt-stats-table .active").classList.remove("tt-highlight-sector");
				doc.find(".tt-title .tt-options .tt-option#tt-edit").classList.remove("tt-highlight-sector");

				for (let item of doc.findAll(".tt-stats-table .active .tt-row:not(.tt-header):not(.sub-heading)")) {
					item.onclick = undefined;
				}
			} else {
				doc.find(".tt-black-overlay").classList.add("active");
				doc.find(".tt-stats-table .active").classList.add("tt-highlight-sector");
				doc.find(".tt-title .tt-options .tt-option#tt-edit").classList.add("tt-highlight-sector");

				// Profile stats
				for (let row of doc.findAll(".tt-stats-table .active .tt-row:not(.tt-header):not(.sub-heading)")) {
					row.onclick = event => {
						event.stopPropagation();
						event.preventDefault();

						row.onclick = undefined;

						if (hasParent(row, { class: "col-chosen" })) {
							doc.find(".tt-stats-table .col-other").appendChild(row);
						} else if (hasParent(row, { class: "col-other" })) {
							doc.find(".tt-stats-table .col-chosen").appendChild(row);
						}

						saveProfileStats();
					};
				}
			}
		};

		// Add Relative/Whole value setting
		const checkbox_wrap = doc.new({ type: "div", class: "in-title tt-checkbox-wrap" });
		const checkbox = doc.new({ type: "input", attributes: { type: "checkbox" } });
		const text = doc.new({ type: "div", text: "Show relative values" });
		checkbox_wrap.appendChild(checkbox);
		checkbox_wrap.appendChild(text);

		doc.find("#tt-target-info .tt-options").appendChild(checkbox_wrap);

		checkbox_wrap.onclick = (event) => {
			event.stopPropagation();
		};

		checkbox.onclick = () => {
			for (let item of doc.findAll("#tt-target-info *[real-value-you]")) {
				const your_value = item.getAttribute("real-value-you");
				const your_value_relative = item.getAttribute("relative-value-you");

				if (!checkbox.checked) {
					item.innerText = your_value;
				} else {
					item.innerText = your_value_relative.includes("-") ? your_value_relative : "+" + your_value_relative;
				}
			}

			ttStorage.change({ filters: { profile_stats: { relative_values: checkbox.checked } } });
		};
		if (filters.profile_stats.relative_values) checkbox.click();

		async function fetchStats() {
			await displayProfileStats();
			section_profile_stats.appendChild(doc.new({ type: "hr" }));
			// Show Spy info
			await showSpyInfo();
		}
	});
});

function displayCreator() {
	let name = doc.find("#skip-to-content span, #skip-to-content");

	if (name.innerText === "Mephiles' Profile" || name.innerText === "Mephiles [2087524]") {
		name.appendChild(doc.new({
			type: "span",
			text: " - Thanks for using ",
			attributes: {
				style: "font-size: 17px;",
			},
			children: [doc.new({ type: "span", text: "TornTools", attributes: { style: "font-size: 17px; color: #6b8817;" } })],
		}));
	}
}

function profileLoaded() {
	let promise = new Promise((resolve) => {
		let counter = 0;
		let checker = setInterval(() => {
			if (document.querySelector(".basic-information ul.info-table li")) {
				resolve(true);
				return clearInterval(checker);
			} else if (counter > 10000) {
				resolve(false);
				return clearInterval(checker);
			} else
				counter++;
		}, 100);
	});

	return promise.then(data => data);
}

function displayAlly(user_faction, allies) {
	let faction_cell = doc.find(".basic-information ul.info-table li:nth-of-type(3) div:nth-of-type(2)");
	let profile_faction = faction_cell.find("a") ? faction_cell.find("a").innerText : "";

	if (profile_faction === "") return;

	if (user_faction === profile_faction) {
		showWarning("user");
		return;
	}

	for (let ally of allies) {
		if (ally.trim() === profile_faction) {
			showWarning("ally");
			return;
		}
	}
}

function showWarning(type) {
	let text;
	if (type === "user")
		text = "This user is in your faction!";
	else if (type === "ally")
		text = "This user is an ally!";

	doc.find(".profile-left-wrapper .title-black").appendChild(doc.new({
		type: "span",
		class: "tt-title-message",
		text,
		attributes: { color: "warning" },
	}));
}

function displayTargetInfo(targets) {
	let section = doc.new({ type: "div", class: "tt-section", attributes: { name: "target-info" } });
	doc.find("#tt-target-info .content").appendChild(section);

	if (!targets[userId]) {
		let span = doc.new({ type: "span", class: "no-btl-data", text: "No battle data on user." });
		section.appendChild(span);
	} else {
		let table = doc.new({ type: "div", class: `tt-table ${mobile ? "tt-mobile" : ""}` });

		let headings = [
			{ name: "Wins", type: "win", class: "good tt-item" },
			{ name: "Mugs", type: "mug", class: "good tt-item tt-advanced" },
			{ name: "Leaves", type: "leave", class: "good tt-item tt-advanced" },
			{ name: "Hosps", type: "hosp", class: "good tt-item tt-advanced" },
			{ name: "Arrests", type: "arrest", class: "good tt-item tt-advanced" },
			{ name: "Specials", type: "special", class: "good tt-item tt-advanced" },
			{ name: "Assists", type: "assist", class: "good tt-item tt-advanced" },
			{ name: "Defends", type: "defend", class: "good tt-item tt-advanced" },
			{ name: "Lost", type: "lose", class: "new-section bad tt-item" },
			{ name: "Defends lost", type: "defend_lose", class: "bad tt-item tt-advanced" },
			{ name: "Stalemates", type: "stalemate", class: "bad tt-item" },
			{ name: "Stealths", type: "stealth", class: "new-section neutral tt-item" },
			{ name: "Respect", type: "respect_base", class: "neutral tt-item" },
		];

		// header row
		let header_row = doc.new("div");
		header_row.setClass("tt-header-row tt-row");

		for (let heading of headings) {
			let th = doc.new("div");
			th.innerText = heading.name;
			th.setClass(heading.class);

			if (mobile) {
				th.classList.add("tt-mobile");
			}

			header_row.appendChild(th);
		}

		// data row
		let row = doc.new("div");
		row.setClass("tt-row");

		for (let heading of headings) {
			let td = doc.new("div");
			td.setClass(heading.class);

			if (mobile) {
				td.classList.add("tt-mobile");
			}

			if (heading.name === "Respect") {
				let [value, color] = getRespect(targets, userId);
				td.innerText = value;
				td.style.backgroundColor = color;
			} else {
				td.innerText = targets[userId][heading.type];
			}

			row.appendChild(td);
		}

		// compiling
		table.appendChild(header_row);
		table.appendChild(row);
		section.appendChild(table);
	}

	section.appendChild(doc.new({ type: "hr" }));

	// Add sortable icon
	section.appendChild(doc.new({ type: "i", class: "uk-sortable-handle fas fa-arrows-alt" }));
}

function getLevel() {
	const levelWrap = doc.find(".box-info .box-value");

	return (parseInt(levelWrap.find(".digit-r .digit").innerText) || 0) * 100 +
		(parseInt(levelWrap.find(".digit-m .digit").innerText) || 0) * 10 +
		parseInt(levelWrap.find(".digit-l .digit").innerText);
}

async function displayProfileStats() {
	let userId = getUserId();
	let profile_stats = doc.find("#tt-target-info .profile-stats");

	let result;

	const level = getLevel();
	if (cache && cache.profileStats[userId] && cache.battleStatsEstimate[userId]) {
		result = {
			stats: cache.profileStats[userId].data,
			battleStatsEstimate: cache.battleStatsEstimate[userId].data,
		};
	} else {
		loadingPlaceholder(profile_stats, true);

		result = await new Promise((resolve) => {
			fetchApi_v2("torn", { section: "user", objectid: userId, selections: "profile,personalstats,crimes" })
				.then((result) => {
					const data = handleTornProfileData(result);
					const timestamp = new Date().getTime();

					ttStorage.change({
						cache: {
							profileStats: {
								[userId]: {
									timestamp,
									ttl: TO_MILLIS.DAYS,
									data: data.stats,
								},
							},
						},
					}, () => {
						if (!level || !settings.scripts.stats_estimate.max_level || settings.scripts.stats_estimate.max_level >= level) {
							if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.profile)
								cacheEstimate(userId, timestamp, data.battleStatsEstimate, result.last_action);

						}
					});

					resolve(data);
				})
				.catch(({ error }) => resolve({ error }));
		});

		loadingPlaceholder(profile_stats, false);
	}

	console.log("Profile Stats", result.stats, result.battleStatsEstimate);

	if (result.error) {
		profile_stats.appendChild(doc.new({ type: "div", class: "tt-error-message", text: result.error }));
		return;
	}

	profile_stats.classList.add("populated");
	let table = doc.new({ type: "div", class: `tt-stats-table ${mobile ? "tt-mobile" : ""}` });
	let col_chosen = doc.new({ type: "div", class: "col-chosen column active" });
	let col_other = doc.new({ type: "div", class: "col-other column" });
	const showExtra = doc.new({ type: "div", class: "show-extra", text: "Show More" });

	let header = doc.new({ type: "div", class: "tt-row tt-header" });
	for (let heading of ["Stat", "Them", "You"]) {
		let item = doc.new({ type: "div", class: "item", text: heading });
		header.appendChild(item);
	}
	let header_other = doc.new({ type: "div", class: "tt-row tt-header" });
	for (let heading of ["Stat", "Them", "You"]) {
		header_other.appendChild(doc.new({ type: "div", class: "item", text: heading }));
	}

	col_chosen.appendChild(header);
	col_other.appendChild(header_other);
	table.appendChild(col_chosen);
	table.appendChild(col_other);
	profile_stats.appendChild(showExtra);
	profile_stats.appendChild(table);

	showExtra.addEventListener("click", () => {
		if (col_chosen.classList.contains("active")) {
			col_chosen.classList.remove("active");
			col_other.classList.add("active");
			showExtra.innerText = "Show Less";
		} else {
			col_chosen.classList.add("active");
			col_other.classList.remove("active");
			showExtra.innerText = "Show More";
		}
	});

	// Add all to other column
	for (let section in key_dict) {
		let section_heading = doc.new({ type: "div", class: "tt-row sub-heading" });
		let inner_text = doc.new({ type: "div", class: "item", text: capitalize(section) });
		section_heading.appendChild(inner_text);
		col_other.appendChild(section_heading);

		let keys = Object.keys(key_dict[section]);
		keys.sort((a, b) => {
			if (key_dict[section][a] < key_dict[section][b]) return -1;
			if (key_dict[section][b] < key_dict[section][a]) return 1;
			return 0;
		});

		for (let key of keys) {
			let row_title = key_dict[section][key];

			let their_value = result.stats[key] || 0;
			let your_value = userdata.personalstats[key] || userdata.criminalrecord[key] || 0;
			const relative_value = your_value - their_value;

			let their_value_modified, your_value_modified, relative_value_modified;

			if (money_key_list.includes(key)) {
				let neg = their_value < 0;
				their_value_modified = `$${numberWithCommas(Math.abs(their_value), false)}`;
				if (neg) their_value_modified = "-" + their_value_modified;

				neg = your_value < 0;
				your_value_modified = `$${numberWithCommas(Math.abs(your_value), false)}`;
				if (neg) your_value_modified = "-" + your_value_modified;

				neg = relative_value < 0;
				relative_value_modified = `$${numberWithCommas(Math.abs(relative_value), false)}`;
				if (neg) relative_value_modified = "-" + relative_value_modified;
			} else {
				their_value_modified = numberWithCommas(their_value, false);
				your_value_modified = numberWithCommas(your_value, false);
				relative_value_modified = numberWithCommas(relative_value, false);
			}

			let row = doc.new({ type: "div", class: "tt-row", attributes: { key: key } });
			let key_cell = doc.new({ type: "div", text: row_title, class: "item" });
			let their_cell = doc.new({ type: "div", text: their_value_modified, class: "item" });
			let your_cell = doc.new({
				type: "div",
				text: your_value_modified,
				class: "item",
				attributes: { "real-value-you": your_value_modified, "relative-value-you": relative_value_modified },
			});

			if (their_value > your_value) {
				your_cell.classList.add("negative");
				their_cell.classList.add("positive");
			} else if (their_value < your_value) {
				their_cell.classList.add("negative");
				your_cell.classList.add("positive");
			}

			row.appendChild(key_cell);
			row.appendChild(their_cell);
			row.appendChild(your_cell);
			col_other.appendChild(row);
		}
	}

	// Move chosen ones
	for (let stat of filters.profile_stats.chosen_stats) {
		if (col_other.find(`:scope > [key='${stat}']`)) {
			col_chosen.appendChild(col_other.find(`:scope > [key='${stat}']`));
		}
	}

	// Footer
	let footer_div = doc.new({ type: "div", class: "tt-footer" });
	let footer_text = doc.new({ type: "div", text: "Automatically load info" });
	let footer_input = doc.new({ type: "input", attributes: { type: "checkbox" } });
	footer_div.appendChild(footer_text);
	footer_div.appendChild(footer_input);
	doc.find("#tt-target-info .content .tt-section[name='profile-stats']").insertBefore(footer_div, doc.find("#tt-target-info .content .profile-stats").nextElementSibling);

	if (filters.profile_stats.auto_fetch) {
		footer_input.checked = true;
	}

	footer_input.onclick = () => {
		ttStorage.change({ filters: { profile_stats: { auto_fetch: footer_input.checked } } });
	};

	// Fix overflows
	for (let el of table.findAll(".tt-row .item")) {
		if (isOverflownX(el)) {
			let money = el.innerText.indexOf("$") > -1;
			let negative = el.innerText.indexOf("-") > -1;
			let value = el.innerText.replace(/,/g, "").replace("$", "");

			el.setAttribute("true-value", value);

			if (money) {
				if (negative) {
					el.innerText = "-$" + numberWithCommas(value);
				} else {
					el.innerText = "$" + numberWithCommas(value);
				}
			} else {
				el.innerText = numberWithCommas(value);
			}
		}
	}

	// Add sortable icon
	profile_stats.appendChild(doc.new({ type: "i", class: "uk-sortable-handle fas fa-arrows-alt" }));

	if (!level || !settings.scripts.stats_estimate.max_level || settings.scripts.stats_estimate.max_level >= level) {
		if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.profile) {
			doc.find(".profile-right-wrapper > .profile-action .title-black").appendChild(doc.new({
				type: "span",
				class: "tt-title-message",
				text: result.battleStatsEstimate,
				attributes: { color: "info" },
			}));
		}
	}
}

async function showSpyInfo() {
	let userId = getUserId();
	let result;

	let spySection = doc.new({ type: "div", class: "tt-section", attributes: { name: "spy-info" } });
	if (doc.find("#tt-target-info .content .tt-section[name='target-info'")) {
		doc.find("#tt-target-info .content").insertBefore(spySection, doc.find("#tt-target-info .content .tt-section[name='target-info'"));
	} else {
		doc.find("#tt-target-info .content").appendChild(spySection);
	}

	if (cache && cache.spyReport[userId]) {
		result = cache.spyReport[userId].data;
	} else {
		loadingPlaceholder(spySection, true);
		result = await new Promise((resolve) => {
			fetch(`https://www.tornstats.com/api.php?key=${api_key}&action=spy&target=${userId}`)
				.then(async response => {
					let data = await response.json();

					return resolve(handleTornStatsData(data));
				});
		});

		if (!result.error) {
			ttStorage.change({
				cache: {
					spyReport: {
						[userId]: {
							timestamp: new Date().getTime(),
							ttl: TO_MILLIS.HOURS,
							data: result,
						},
					},
				},
			});
		}
		loadingPlaceholder(spySection, false);
	}

	console.log("Spy Information", result.spyreport);

	if (result.error) {
		spySection.appendChild(doc.new({ type: "div", class: "tt-spy-info tt-error-message", text: result.error }));
	} else if (!result.spyreport.status) {
		spySection.appendChild(doc.new({ type: "div", class: "tt-spy-info", text: result.spyreport.message }));
	} else {
		let heading = doc.new({
			type: "div",
			class: "spy-heading",
			text: `Spy type: ${result.spyreport.type} (${result.spyreport.difference})`,
		});
		spySection.appendChild(heading);

		let table = doc.new({ type: "div", class: "spy-table" });
		let header = doc.new({ type: "div", class: "tt-row tt-header" });
		let item_key = doc.new({ type: "div", class: "item", text: "Stat" });
		let item_them = doc.new({ type: "div", class: "item", text: "Them" });
		let item_you = doc.new({ type: "div", class: "item", text: "You" });
		header.appendChild(item_key);
		header.appendChild(item_them);
		header.appendChild(item_you);
		table.appendChild(header);

		for (let stat of ["strength", "defense", "speed", "dexterity", "total"]) {
			let row = doc.new({ type: "div", class: "tt-row" });
			let item_key = doc.new({ type: "div", class: "item", text: capitalize(stat) });
			let item_them = doc.new({
				type: "div",
				class: "item",
				text: numberWithCommas(parseInt(result.spyreport[stat]), false),
			});
			let item_you = doc.new({
				type: "div",
				class: "item",
				text: numberWithCommas(parseInt(userdata[stat]), false),
				attributes: {
					"real-value-you": numberWithCommas(parseInt(userdata[stat]), false),
					"relative-value-you": numberWithCommas(parseInt(userdata[stat]) - parseInt(result.spyreport[stat]), false),
				},
			});

			if (parseInt(result.spyreport[stat]) > parseInt(userdata[stat])) {
				item_you.classList.add("negative");
				item_them.classList.add("positive");
			} else if (parseInt(result.spyreport[stat]) < parseInt(userdata[stat])) {
				item_them.classList.add("negative");
				item_you.classList.add("positive");
			}

			row.appendChild(item_key);
			row.appendChild(item_them);
			row.appendChild(item_you);
			table.appendChild(row);
		}

		let score_row = doc.new({ type: "div", class: "tt-row" });
		let score_item_key = doc.new({ type: "div", class: "item", text: "Score" });
		let score_item_them = doc.new({
			type: "div",
			class: "item",
			text: numberWithCommas(parseInt(result.spyreport.target_score), false),
		});
		let score_item_you = doc.new({
			type: "div",
			class: "item",
			text: numberWithCommas(parseInt(result.spyreport.your_score), false),
			attributes: {
				"real-value-you": numberWithCommas(parseInt(result.spyreport.your_score), false),
				"relative-value-you": numberWithCommas(parseInt(result.spyreport.your_score) - parseInt(result.spyreport.target_score), false),
			},
		});

		if (parseInt(result.spyreport.target_score) > parseInt(result.spyreport.your_score)) {
			score_item_you.classList.add("negative");
			score_item_them.classList.add("positive");
		} else if (parseInt(result.spyreport.target_score) < parseInt(result.spyreport.your_score)) {
			score_item_them.classList.add("negative");
			score_item_you.classList.add("positive");
		}

		score_row.appendChild(score_item_key);
		score_row.appendChild(score_item_them);
		score_row.appendChild(score_item_you);
		table.appendChild(score_row);
		spySection.appendChild(table);
	}

	spySection.appendChild(doc.new({ type: "hr" }));

	// Add sortable icon
	spySection.appendChild(doc.new({ type: "i", class: "uk-sortable-handle fas fa-arrows-alt" }));
}

function getUserId() {
	if (!userId)
		userId = doc.find(".basic-information ul.info-table li:nth-of-type(1) div:nth-of-type(2)").innerText.split("[")[1].replace("]", "");

	return userId;
}

function getRespect(target_list, id) {
	let respect_type = "respect";
	let respect_value;
	let color;

	for (let list in target_list[id]["respect_base"]) {
		if (target_list[id]["respect_base"][list].length > 0) {
			respect_type = "respect_base";
			break;
		}
	}

	let leaves = target_list[id][respect_type]["leave"].length > 0;

	if (leaves)
		respect_value = getAverage(target_list[id][respect_type]["leave"]);
	else {
		let averages = [];

		for (let list in target_list[id][respect_type]) {
			let average = getAverage(target_list[id][respect_type][list]);

			if (average !== 0) averages.push(average);
		}
		respect_value = getAverage(averages);
	}

	if (respect_type === "respect")
		respect_value = respect_value + "*";
	else if (respect_type === "respect_base")
		color = leaves ? "#dfffdf" : "#fffdcc";

	if (respect_value === "0*")
		respect_value = "-";

	return [respect_value, color];
}

function getAverage(arr) {
	if (arr.length === 0)
		return 0;

	let sum = 0;
	for (let item of arr) {
		sum += item;
	}
	return parseFloat((sum / arr.length).toFixed(2));
}

function showId() {
	doc.find("#skip-to-content").innerText = doc.find(".profile-container .info-table > li .user-info-value").innerText;
}

function displayLootLevel(loot_times) {
	console.log(loot_times);
	let profile_id = doc.find(`.profile-container .info-table > li .user-info-value`).innerText.split(" [")[1].replace("]", "");

	if (profile_id in loot_times) {
		let current_time = parseInt(((new Date().getTime()) / 1000).toFixed(0));
		let next_level = loot_times[profile_id].levels.next;
		let next_loot_time = loot_times[profile_id].timings[next_level].ts;
		let time_left;

		if (next_loot_time - current_time <= 60) {  // New info hasn't been fetched yet
			next_level = next_level + 1 > 5 ? 1 : next_level + 1;
			next_loot_time = loot_times[profile_id].timings[next_level].ts;
			time_left = timeUntil((next_loot_time - current_time) * 1000);
		} else {
			time_left = timeUntil((next_loot_time - current_time) * 1000);
		}

		let span = doc.new("span");
		span.setClass("tt-loot-time");
		span.innerText = `Next loot level in: ${time_left}`;
		span.setAttribute("seconds", (next_loot_time - current_time));

		doc.find(".profile-wrapper .profile-status .description .sub-desc").appendChild(span);

		// Time decrease
		setInterval(() => {
			let seconds = parseInt(span.getAttribute("seconds"));
			let time_left = timeUntil((seconds - 1) * 1000);

			span.innerText = `Next loot level in: ${time_left}`;
			span.setAttribute("seconds", seconds - 1);
		}, 1000);
	}
}

function addStatusIndicator() {
	let status_icon = doc.find(".icons ul>li");
	let icon_span = doc.new({
		type: "div",
		class: status_icon.classList[0],
		attributes: {
			style: `margin-right: 3px; float: left; background-position: ${window.getComputedStyle(status_icon).getPropertyValue("background-position")};`,
		},
	});
	if (!mobile) icon_span.style.marginTop = "1px";
	let text_span = doc.new({
		type: "span",
		text: doc.find("#skip-to-content").innerText,
		attributes: {
			style: mobile ? "font-size: 17px; color: #333" : "font-size: 22px; color: #333",
		},
	});

	doc.find("#skip-to-content").innerText = "";
	doc.find("#skip-to-content").appendChild(icon_span);
	doc.find("#skip-to-content").appendChild(text_span);

	// Event listener
	let status_observer = new MutationObserver(mutationsList => {
		for (let mutation of mutationsList) {
			if (mutation.type === "childList") {
				console.log(doc.find(".icons ul>li"));
				icon_span.setAttribute("class", doc.find(".icons ul>li").classList[0]);
				icon_span.style.backgroundPosition = window.getComputedStyle(doc.find(".icons ul>li")).getPropertyValue("background-position");
			}
		}
	});
	status_observer.observe(status_icon.parentElement, { childList: true });
}

function displayStakeoutOptions() {
	let userId = getUserId();

	let stakeout_div = doc.new({ type: "div", class: "tt-section", attributes: { name: "stakeouts" } });
	doc.find("#tt-target-info .content").appendChild(stakeout_div);

	let watchlist_wrap = doc.new({ type: "div", class: "tt-checkbox-wrap" });
	let addToStakeoutsInput = doc.new({ type: "input", attributes: { type: "checkbox" } });
	let text = doc.new({ type: "div", text: "Add this player to Stakeouts (no notifications needed)" });
	watchlist_wrap.appendChild(addToStakeoutsInput);
	watchlist_wrap.appendChild(text);
	stakeout_div.appendChild(watchlist_wrap);

	if (stakeouts[userId]) {
		addToStakeoutsInput.checked = true;
	}

	addToStakeoutsInput.onclick = () => {
		saveStakeoutSettings();
	};

	let heading = doc.new({ type: "div", class: "tt-sub-heading", text: "Let me know when this player:" });
	stakeout_div.appendChild(heading);

	let option_okay = doc.new({ type: "div", class: "tt-checkbox-wrap" });
	let checkbox_okay = doc.new({ type: "input", attributes: { type: "checkbox" } });
	let text_okay = doc.new({ type: "div", text: "is okay" });
	option_okay.appendChild(checkbox_okay);
	option_okay.appendChild(text_okay);

	let option_lands = doc.new({ type: "div", class: "tt-checkbox-wrap" });
	let checkbox_lands = doc.new({ type: "input", attributes: { type: "checkbox" } });
	let text_lands = doc.new({ type: "div", text: "lands" });
	option_lands.appendChild(checkbox_lands);
	option_lands.appendChild(text_lands);

	let option_online = doc.new({ type: "div", class: "tt-checkbox-wrap" });
	let checkbox_online = doc.new({ type: "input", attributes: { type: "checkbox" } });
	let text_online = doc.new({ type: "div", text: "comes online" });
	option_online.appendChild(checkbox_online);
	option_online.appendChild(text_online);

	let option_hospital = doc.new({ type: "div", class: "tt-checkbox-wrap" });
	let checkbox_hospital = doc.new({ type: "input", attributes: { type: "checkbox" } });
	let text_hospital = doc.new({ type: "div", text: "is in hospital" });
	option_hospital.appendChild(checkbox_hospital);
	option_hospital.appendChild(text_hospital);

	if (stakeouts[userId]) {
		checkbox_okay.checked = stakeouts[userId].notifications.okay;
		checkbox_lands.checked = stakeouts[userId].notifications.lands;
		checkbox_online.checked = stakeouts[userId].notifications.online;
		checkbox_hospital.checked = stakeouts[userId].notifications.hospital;
	}

	stakeout_div.appendChild(option_okay);
	stakeout_div.appendChild(option_lands);
	stakeout_div.appendChild(option_online);
	stakeout_div.appendChild(option_hospital);

	checkbox_okay.onclick = () => {
		saveStakeoutSettings();
	};
	checkbox_lands.onclick = () => {
		saveStakeoutSettings();
	};
	checkbox_online.onclick = () => {
		saveStakeoutSettings();
	};
	checkbox_hospital.onclick = () => {
		saveStakeoutSettings();
	};

	// Add hr
	stakeout_div.appendChild(doc.new({ type: "hr" }));

	// Add sortable icon
	stakeout_div.appendChild(doc.new({ type: "i", class: "uk-sortable-handle fas fa-arrows-alt" }));

	function saveStakeoutSettings() {
		if (addToStakeoutsInput.checked === true || checkbox_okay.checked === true || checkbox_lands.checked === true || checkbox_online.checked === true || checkbox_hospital.checked === true) {
			ttStorage.change({
				stakeouts: {
					[userId]: {
						info: {},
						notifications: {
							okay: checkbox_okay.checked,
							lands: checkbox_lands.checked,
							online: checkbox_online.checked,
							hospital: checkbox_hospital.checked,
						},
					},
				},
			});
		} else {
			ttStorage.get("stakeouts", stakeouts => {
				delete stakeouts[userId];
				ttStorage.set({ stakeouts });
			});
		}
	}
}

function getUsername() {
	return doc.find(".basic-information ul.info-table li:nth-of-type(1) div:nth-of-type(2)").innerText.split(" [")[0].trim();
}

function getStatus() {
	let desc = doc.find(".main-desc").innerText;

	if (desc.indexOf("Okay") > -1) {
		return "okay";
	} else if (desc.indexOf("hospital") > -1) {
		return "hospital";
	} else if (desc.indexOf("jail") > -1) {
		return "jail";
	}
}

function getTraveling() {
	let desc = doc.find(".main-desc").innerText;

	return desc.indexOf("Traveling") > -1 || desc.indexOf("Returning") > -1;
}

function handleTornStatsData(data) {
	let response = {};

	if (!data.error) {
		response.spyreport = { ...data.spy };
	} else {
		response.error = data.error.includes("User not found") ? "Can't display stat spies because no TornStats account was found. Please register an account @ www.tornstats.com" : data.error;
	}

	return response;
}

function saveProfileStats() {
	let chosen_keys = [];

	for (let row of doc.findAll(".col-chosen .tt-row:not(.header):not(.sub-heading)")) {
		if (row.getAttribute("key")) {
			chosen_keys.push(row.getAttribute("key"));
		}
	}

	ttStorage.change({ filters: { profile_stats: { chosen_stats: chosen_keys } } });
}

function showProfileNotes() {
	const textbox = doc.new({ type: "textarea", class: "tt-profile-notes-textarea", attributes: { maxLength: 1024 } });

	const profile = profile_notes.profiles[userId];
	textbox.style.height = profile ? profile.height : "17px";
	textbox.value = profile ? profile.notes : "";

	const container = content.newContainer("Profile Notes", {
		next_element_heading: "Medals",
		id: "tt-target-notes",
		collapseId: 1,
	}).find(".content");
	container.appendChild(doc.new({
		type: "div",
		class: "tt-section",
		attributes: { name: "profile-notes" },
		children: [textbox],
	}));

	let save_button = doc.new({
		type: "div",
		id: "tt-profile-notes-save",
		class: "tt-option",
		children: [
			doc.new({ type: "i", class: "fas fa-save" }),
			doc.new({ type: "span", class: "text", text: "Save" }),
		],
	});
	doc.find("#tt-target-notes .tt-options").appendChild(save_button);

	save_button.onclick = event => {
		event.stopPropagation();

		ttStorage.change({
			profile_notes: {
				profiles: {
					[userId]: {
						height: textbox.style.height,
						notes: textbox.value,
					},
				},
			},
		}, () => {
			console.log("Saved profile notes", {
				height: textbox.style.height,
				notes: textbox.value,
			});

			if (!doc.find("#tt-target-notes .saved-note")) {
				const note = doc.new({ type: "span", class: "saved-note", text: "Saved note." });

				doc.find("#tt-target-notes .tt-title").insertBefore(note, doc.find("#tt-target-notes .tt-title .tt-options"));
				setTimeout(() => note.remove(), 2500);
			}
		});
	};
}