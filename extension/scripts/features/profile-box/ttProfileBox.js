"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isOwnProfile()) return;

	function numberCellRenderer(value) {
		let node;
		if (typeof value === "object") {
			const isRelative = filters.profile.relative;

			const actualValue = isRelative ? value.relative : value.value;
			const forceOperation = isRelative;

			const options = { decimals: 0, forceOperation };
			node = document.newElement({
				type: "span",
				class: "relative-field",
				text: formatNumber(actualValue, options),
				dataset: { value: value.value, relative: value.relative, options },
			});
		} else {
			node = document.createTextNode(formatNumber(value, { decimals: 0 }));
		}

		return {
			element: node,
			dispose: () => {},
		};
	}

	function currencyCellRenderer(data) {
		let node;
		if (typeof data === "object") {
			const isRelative = filters.profile.relative;

			const value = isRelative ? data.relative : data.value;
			const forceOperation = isRelative;

			const options = { decimals: 0, currency: true, forceOperation };
			node = document.newElement({
				type: "span",
				class: "relative-field",
				text: formatNumber(value, options),
				dataset: { value: data.value, relative: data.relative, options },
			});
		} else {
			node = document.createTextNode(formatNumber(data, { decimals: 0, currency: true }));
		}

		return {
			element: node,
			dispose: () => {},
		};
	}

	const STATS = [
		// Attacking
		{ name: "Attacks won", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.won },
		{ name: "Attacks lost", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.lost },
		{ name: "Attacks stalemated", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.stalemate },
		{ name: "Attacks assisted", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.assist },
		{ name: "Defends won", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.won },
		{ name: "Defends lost", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.lost },
		{ name: "Defends stalemated", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.stalemate },
		{ name: "Defends total", type: "attacking", v2Getter: (data) => data.personalstats.attacking.defends.total },
		{ name: "Elo rating", type: "attacking", v2Getter: (data) => data.personalstats.attacking.elo },
		{ name: "Times escaped", type: "attacking", v2Getter: (data) => data.personalstats.attacking.escapes.player },
		{ name: "Foes escaped", type: "attacking", v2Getter: (data) => data.personalstats.attacking.escapes.foes },
		{ name: "Unarmored fights won", type: "attacking", v2Getter: (data) => data.personalstats.attacking.unarmored_wins },
		{ name: "Best kill streak", type: "attacking", v2Getter: (data) => data.personalstats.attacking.killstreak.best },
		{ name: "Hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.success },
		{ name: "Misses", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.miss },
		{ name: "Total damage made", type: "attacking", v2Getter: (data) => data.personalstats.attacking.damage.total },
		{ name: "Best damage made", type: "attacking", v2Getter: (data) => data.personalstats.attacking.damage.best },
		{ name: "One hit kills", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.one_hit_kills },
		{ name: "Critical hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.hits.critical },
		{ name: "Rounds fired", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.total },
		{ name: "Special ammunition used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.special },
		{ name: "Hollow point ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.hollow_point },
		{ name: "Tracer ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.tracer },
		{ name: "Piercing ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.piercing },
		{ name: "Incendiary ammo used", type: "attacking", v2Getter: (data) => data.personalstats.attacking.ammunition.incendiary },
		{ name: "Stealth attacks", type: "attacking", v2Getter: (data) => data.personalstats.attacking.attacks.stealth },
		{ name: "Retaliations", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.retaliations },
		{ name: "Money mugged", type: "attacking", v2Getter: (data) => data.personalstats.attacking.networth.money_mugged, formatter: currencyCellRenderer },
		{ name: "Largest mug", type: "attacking", v2Getter: (data) => data.personalstats.attacking.networth.largest_mug, formatter: currencyCellRenderer },
		{ name: "Items looted", type: "attacking", v2Getter: (data) => data.personalstats.attacking.networth.items_looted },
		{ name: "Highest level beaten", type: "attacking", v2Getter: (data) => data.personalstats.attacking.highest_level_beaten },
		{ name: "Total respect", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.respect },
		{ name: "Ranked war hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.ranked_war_hits },
		{ name: "Raid hits", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.raid_hits },
		{ name: "Territory wall joins", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.territory.wall_joins },
		{ name: "Territory clears", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.territory.wall_clears },
		{ name: "Territory wall time", type: "attacking", v2Getter: (data) => data.personalstats.attacking.faction.territory.wall_time },

		// Jobs
		{ name: "Job points used", type: "jobs", v2Getter: (data) => data.personalstats.jobs.job_points_used },
		{ name: "Times trained by director", type: "jobs", v2Getter: (data) => data.personalstats.jobs.trains_received },

		// Trading
		{ name: "Items bought from market", type: "trading", v2Getter: (data) => data.personalstats.trading.items.bought.market },
		{ name: "Auctions won", type: "trading", v2Getter: (data) => data.personalstats.trading.items.auctions.won },
		{ name: "Items auctioned", type: "trading", v2Getter: (data) => data.personalstats.trading.items.auctions.sold },
		{ name: "Item sends", type: "trading", v2Getter: (data) => data.personalstats.trading.items.sent },
		{ name: "Trades made", type: "trading", v2Getter: (data) => data.personalstats.trading.trades },
		{ name: "Shop purchases", type: "trading", v2Getter: (data) => data.personalstats.trading.items.bought.shops },
		{ name: "Points bought", type: "trading", v2Getter: (data) => data.personalstats.trading.points.bought },
		{ name: "Points sold", type: "trading", v2Getter: (data) => data.personalstats.trading.points.sold },
		{ name: "Bazaar customers", type: "trading", v2Getter: (data) => data.personalstats.trading.bazaar.customers },
		{ name: "Bazaar sales", type: "trading", v2Getter: (data) => data.personalstats.trading.bazaar.sales },
		{ name: "Bazaar revenue", type: "trading", v2Getter: (data) => data.personalstats.trading.bazaar.profit },
		{ name: "Item Market customers", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.customers },
		{ name: "Item Market sales", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.sales },
		{ name: "Item Market revenue", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.revenue },
		{ name: "Item Market fees paid", type: "trading", v2Getter: (data) => data.personalstats.trading.item_market.fees },

		// Jail
		{ name: "Times jailed", type: "jail", v2Getter: (data) => data.personalstats.jail.times_jailed },
		{ name: "People busted", type: "jail", v2Getter: (data) => data.personalstats.jail.busts.success },
		{ name: "Failed busts", type: "jail", v2Getter: (data) => data.personalstats.jail.busts.fails },
		{ name: "People bailed", type: "jail", v2Getter: (data) => data.personalstats.jail.bails.amount },
		{ name: "Bail fees", type: "jail", v2Getter: (data) => data.personalstats.jail.bails.fees, formatter: currencyCellRenderer },

		// Hospital
		{ name: "Times in hospital", type: "hospital", v2Getter: (data) => data.personalstats.hospital.times_hospitalized },
		{ name: "Medical items used", type: "hospital", v2Getter: (data) => data.personalstats.hospital.medical_items_used },
		{ name: "Blood withdrawn", type: "hospital", v2Getter: (data) => data.personalstats.hospital.blood_withdrawn },
		{ name: "Revive skill", type: "hospital", v2Getter: (data) => data.personalstats.hospital.reviving.skill },
		{ name: "Revives given", type: "hospital", v2Getter: (data) => data.personalstats.hospital.reviving.revives },
		{ name: "Revives received", type: "hospital", v2Getter: (data) => data.personalstats.hospital.reviving.revives_received },

		// Finishing Hits
		{ name: "Heavy artillery", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.heavy_artillery },
		{ name: "Machine guns", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.machine_guns },
		{ name: "Rifles", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.rifles },
		{ name: "Sub machine guns", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.sub_machine_guns },
		{ name: "Shotguns", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.shotguns },
		{ name: "Pistols", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.pistols },
		{ name: "Temporary weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.temporary },
		{ name: "Piercing weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.piercing },
		{ name: "Slashing weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.slashing },
		{ name: "Clubbing weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.clubbing },
		{ name: "Mechanical weapons", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.mechanical },
		{ name: "Hand-to-hand", type: "finishing hits", v2Getter: (data) => data.personalstats.finishing_hits.hand_to_hand },

		// Communication
		{ name: "Mails sent", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.total },
		{ name: "Mails to friends", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.friends },
		{ name: "Mails to faction", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.faction },
		{ name: "Mails to colleagues", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.colleagues },
		{ name: "Mails to spouse", type: "communication", v2Getter: (data) => data.personalstats.communication.mails_sent.spouse },
		{ name: "Classified ads placed", type: "communication", v2Getter: (data) => data.personalstats.communication.classified_ads },
		{ name: "Personals placed", type: "communication", v2Getter: (data) => data.personalstats.communication.personals },

		// Criminal Offenses
		{
			name: "Total offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				(data) => data.personalstats.crimes.total,
				(data) => data.personalstats.crimes.offenses.total
			),
		},
		{
			name: "Vandalism offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.vandalism
			),
		},
		{
			name: "Theft offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.theft
			),
		},
		{
			name: "Counterfeiting offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.counterfeiting
			),
		},
		{
			name: "Fraud offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.fraud
			),
		},
		{
			name: "Illicit services offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.illicit_services
			),
		},
		{
			name: "Cybercrime offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.cybercrime
			),
		},
		{
			name: "Extortion offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.extortion
			),
		},
		{
			name: "Illegal production offenses",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.offenses.illegal_production
			),
		},
		{
			name: "Organized crimes",
			type: "criminal offenses",
			v2Getter: crimesStats(
				(data) => data.personalstats.crimes.organized_crimes,
				(data) => data.personalstats.crimes.offenses.organized_crimes
			),
		},
		{
			name: "Search for cash skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.search_for_cash
			),
		},
		{
			name: "Bootlegging skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.bootlegging
			),
		},
		{
			name: "Graffiti skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.graffiti
			),
		},
		{
			name: "Shoplifting skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.shoplifting
			),
		},
		{
			name: "Pickpocketing skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.pickpocketing
			),
		},
		{
			name: "Card Skimming skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.card_skimming
			),
		},
		{
			name: "Burglary skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.burglary
			),
		},
		{
			name: "Hustling skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.hustling
			),
		},
		{
			name: "Disposal skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.disposal
			),
		},
		{
			name: "Cracking skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.cracking
			),
		},
		{
			name: "Forgery skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.forgery
			),
		},
		{
			name: "Scamming skill",
			type: "criminal offenses",
			v2Getter: crimesStats(
				() => 0,
				(data) => data.personalstats.crimes.skills.scamming
			),
		},

		// Bounties
		{ name: "Bounties placed", type: "bounties", v2Getter: (data) => data.personalstats.bounties.placed.amount },
		{ name: "Spent on bounties", type: "bounties", v2Getter: (data) => data.personalstats.bounties.placed.value, formatter: currencyCellRenderer },
		{ name: "Bounties collected", type: "bounties", v2Getter: (data) => data.personalstats.bounties.collected.amount },
		{ name: "Money rewarded", type: "bounties", v2Getter: (data) => data.personalstats.bounties.collected.value, formatter: currencyCellRenderer },
		{ name: "Bounties received", type: "bounties", v2Getter: (data) => data.personalstats.bounties.received.amount },
		{ name: "Received value", type: "bounties", v2Getter: (data) => data.personalstats.bounties.received.value, formatter: currencyCellRenderer },

		// Items
		{ name: "Items found", type: "items", v2Getter: (data) => data.personalstats.items.found.city },
		{ name: "Items found in dump", type: "items", v2Getter: (data) => data.personalstats.items.found.dump },
		{ name: "Items trashed", type: "items", v2Getter: (data) => data.personalstats.items.trashed },
		{ name: "Books read", type: "items", v2Getter: (data) => data.personalstats.items.used.books },
		{ name: "Boosters used", type: "items", v2Getter: (data) => data.personalstats.items.used.boosters },
		{ name: "Consumables used", type: "items", v2Getter: (data) => data.personalstats.items.used.consumables },
		{ name: "Candy eaten", type: "items", v2Getter: (data) => data.personalstats.items.used.candy },
		{ name: "Alcohol drunk", type: "items", v2Getter: (data) => data.personalstats.items.used.alcohol },
		{ name: "Energy drinks drunk", type: "items", v2Getter: (data) => data.personalstats.items.used.energy_drinks },
		{ name: "Stat enhancers used", type: "items", v2Getter: (data) => data.personalstats.items.used.stat_enhancers },
		{ name: "Easter eggs found", type: "items", v2Getter: (data) => data.personalstats.items.found.easter_eggs },
		{ name: "Easter eggs used", type: "items", v2Getter: (data) => data.personalstats.items.used.easter_eggs },
		{ name: "Viruses coded", type: "items", v2Getter: (data) => data.personalstats.items.viruses_coded },

		// Travel
		{ name: "Times traveled", type: "travel", v2Getter: (data) => data.personalstats.travel.total },
		{ name: "Time spent traveling", type: "travel", v2Getter: (data) => data.personalstats.travel.time_spent },
		{ name: "Items bought abroad", type: "travel", v2Getter: (data) => data.personalstats.travel.items_bought },
		{ name: "Hunting skill", type: "travel", v2Getter: (data) => data.personalstats.travel.hunting.skill },
		{ name: "Attacks won abroad", type: "travel", v2Getter: (data) => data.personalstats.travel.attacks_won },
		{ name: "Defends lost abroad", type: "travel", v2Getter: (data) => data.personalstats.travel.defends_lost },
		{ name: "Argentina", type: "travel", v2Getter: (data) => data.personalstats.travel.argentina },
		{ name: "Mexico", type: "travel", v2Getter: (data) => data.personalstats.travel.mexico },
		{ name: "United Arab Emirates", type: "travel", v2Getter: (data) => data.personalstats.travel.united_arab_emirates },
		{ name: "Hawaii", type: "travel", v2Getter: (data) => data.personalstats.travel.hawaii },
		{ name: "Japan", type: "travel", v2Getter: (data) => data.personalstats.travel.japan },
		{ name: "United Kingdom", type: "travel", v2Getter: (data) => data.personalstats.travel.united_kingdom },
		{ name: "South Africa", type: "travel", v2Getter: (data) => data.personalstats.travel.south_africa },
		{ name: "Switzerland", type: "travel", v2Getter: (data) => data.personalstats.travel.switzerland },
		{ name: "China", type: "travel", v2Getter: (data) => data.personalstats.travel.china },
		{ name: "Canada", type: "travel", v2Getter: (data) => data.personalstats.travel.canada },
		{ name: "Cayman Islands", type: "travel", v2Getter: (data) => data.personalstats.travel.cayman_islands },

		// Drugs
		{ name: "Drugs used", type: "drugs", v2Getter: (data) => data.personalstats.drugs.total },
		{ name: "Times overdosed", type: "drugs", v2Getter: (data) => data.personalstats.drugs.overdoses },
		{ name: "Rehabilitations", type: "drugs", v2Getter: (data) => data.personalstats.drugs.rehabilitations.amount },
		{ name: "Rehabilitation fees", type: "drugs", v2Getter: (data) => data.personalstats.drugs.rehabilitations.fees, formatter: currencyCellRenderer },
		{ name: "Cannabis taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.cannabis },
		{ name: "Ecstasy taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.ecstasy },
		{ name: "Ketamine taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.ketamine },
		{ name: "LSD taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.lsd },
		{ name: "Opium taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.opium },
		{ name: "PCP taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.pcp },
		{ name: "Shrooms taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.shrooms },
		{ name: "Speed taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.speed },
		{ name: "Vicodin taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.vicodin },
		{ name: "Xanax taken", type: "drugs", v2Getter: (data) => data.personalstats.drugs.xanax },

		// Missions
		{ name: "Missions completed", type: "missions", v2Getter: (data) => data.personalstats.missions.missions },
		{ name: "Duke contracts completed", type: "missions", v2Getter: (data) => data.personalstats.missions.contracts.duke },
		{ name: "Contracts completed", type: "missions", v2Getter: (data) => data.personalstats.missions.contracts.total },
		{ name: "Mission credits earned", type: "missions", v2Getter: (data) => data.personalstats.missions.credits },

		// Racing
		{ name: "Racing skill", type: "racing", v2Getter: (data) => data.personalstats.racing.skill },
		{ name: "Racing points earned", type: "racing", v2Getter: (data) => data.personalstats.racing.points },
		{ name: "Races entered", type: "racing", v2Getter: (data) => data.personalstats.racing.races.entered },
		{ name: "Races won", type: "racing", v2Getter: (data) => data.personalstats.racing.races.won },

		// Networth
		{ name: "Networth", type: "networth", v2Getter: (data) => data.personalstats.networth.total, formatter: currencyCellRenderer },

		// Other
		{ name: "Time played", type: "other", v2Getter: (data) => data.personalstats.other.activity.time },
		{ name: "Current activity streak", type: "other", v2Getter: (data) => data.personalstats.other.activity.streak.current },
		{ name: "Best activity streak", type: "other", v2Getter: (data) => data.personalstats.other.activity.streak.best },
		{ name: "Awards", type: "other", v2Getter: (data) => data.personalstats.other.awards },
		{ name: "Energy refills", type: "other", v2Getter: (data) => data.personalstats.other.refills.energy },
		{ name: "Nerve refills", type: "other", v2Getter: (data) => data.personalstats.other.refills.nerve },
		{ name: "Token refills", type: "other", v2Getter: (data) => data.personalstats.other.refills.token },
		{ name: "Merits bought", type: "other", v2Getter: (data) => data.personalstats.other.merits_bought },
		{ name: "Days been a donator", type: "other", v2Getter: (data) => data.personalstats.other.donator_days },
		{ name: "Ranked warring wins", type: "other", v2Getter: (data) => data.personalstats.other.ranked_war_wins },
	];

	featureManager.registerFeature(
		"Profile Box",
		"profile",
		() =>
			settings.pages.profile.box &&
			(settings.pages.profile.boxStats || settings.pages.profile.boxSpy || settings.pages.profile.boxStakeout || settings.pages.profile.boxAttackHistory),
		null,
		showBox,
		removeBox,
		{
			storage: [
				"settings.pages.profile.box",
				"settings.pages.profile.boxStats",
				"settings.pages.profile.boxSpy",
				"settings.pages.profile.boxStakeout",
				"settings.pages.profile.boxAttackHistory",
				"settings.pages.global.keepAttackHistory",
			],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	let overlayStatus = false;

	async function showBox() {
		const userInfoValue = await requireElement(".basic-information .info-table .user-info-value > *:first-child");

		const id = parseInt(userInfoValue.textContent.trim().match(/\[(\d*)]/i)[1]);

		const { content, options } = createContainer("User Information", {
			nextElement: document.find(".medals-wrapper") || document.find(".basic-information")?.closest(".profile-wrapper"),
			class: "mt10",
		});

		if (settings.pages.profile.boxFetch) {
			showRelative();
			buildStats().catch((error) => console.log("TT - Couldn't build the stats part of the profile box.", error));
			buildSpy(false).catch((error) => console.log("TT - Couldn't build the spy part of the profile box.", error));
		} else {
			const button = document.newElement({
				type: "button",
				class: "tt-btn",
				text: "Fetch data from the API.",
				events: {
					async click() {
						showLoadingPlaceholder(section, true);
						button.classList.add("tt-hidden");

						let finished = 0;

						showRelative();
						buildStats()
							.catch((error) => console.log("TT - Couldn't build the stats part of the profile box.", error))
							.then(handleBuild);
						buildSpy(false)
							.catch((error) => console.log("TT - Couldn't build the spy part of the profile box.", error))
							.then(handleBuild);

						function handleBuild() {
							finished++;

							if (finished === 1) {
								section.remove();
							} else if (finished === 2) {
								for (const section of [...content.findAll(".section[order]")].sort(
									(a, b) => parseInt(a.getAttribute("order")) - parseInt(b.getAttribute("order"))
								))
									section.parentElement.appendChild(section);
							}
						}
					},
				},
			});

			const section = document.newElement({
				type: "div",
				class: "manually-fetch",
				children: [button],
			});

			content.appendChild(section);
		}

		buildStakeouts().catch((error) => console.log("TT - Couldn't build the stakeout part of the profile box.", error));
		buildAttackHistory().catch((error) => console.log("TT - Couldn't build the attack history part of the profile box.", error));

		function showRelative() {
			const relativeValue = createCheckbox({ description: "Relative values" });
			relativeValue.setChecked(filters.profile.relative);
			relativeValue.onChange(() => {
				const isRelative = relativeValue.isChecked();

				for (const field of content.findAll(".relative-field")) {
					const value = isRelative ? field.dataset.relative : field.dataset.value;

					// noinspection JSCheckFunctionSignatures
					const options = { ...(JSON.parse(field.dataset.options ?? false) || { decimals: 0 }), forceOperation: isRelative };

					field.textContent = formatNumber(value, options);
				}

				ttStorage.change({ filters: { profile: { relative: isRelative } } });
			});
			options.appendChild(relativeValue.element);
		}

		async function buildStats() {
			if (!settings.pages.profile.boxStats || !settings.apiUsage.user.personalstats || !settings.apiUsage.user.crimes) return;

			const section = document.newElement({ type: "div", class: "section user-stats" });
			content.appendChild(section);

			showLoadingPlaceholder(section, true);

			let data;
			if (ttCache.hasValue("personal-stats", id)) {
				data = ttCache.get("personal-stats", id);
			} else {
				try {
					data = await fetchData("tornv2", { section: "user", id, selections: ["personalstats"], params: { cat: ["all"] }, silent: true });

					triggerCustomListener(EVENT_CHANNELS.PROFILE_FETCHED, { data });

					ttCache.set({ [id]: data }, millisToNewDay(), "personal-stats").catch(() => {});
				} catch (error) {
					console.log("TT - Couldn't fetch users stats.", error);
				}
			}

			if (data) {
				buildCustom();
				buildOthers();

				// noinspection JSUnusedGlobalSymbols
				const sortable = new Sortable(section.find(".custom-stats .tt-table-body"), {
					animation: 150,
					disabled: true,
					onEnd: () => saveStats(),
				});

				const moveButton = document.newElement({
					type: "button",
					class: "move-stats",
					children: [document.newElement({ type: "i", class: "fa-solid fa-up-down-left-right" })],
					events: {
						click() {
							if (moveButton.classList.toggle("active")) {
								// Enable movement.
								section.find(".other-stats-button").setAttribute("disabled", "");
								section.findAll(".custom-stats .tt-table-row").forEach((row) => row.classList.add("tt-sortable"));

								sortable.option("disabled", false);
							} else {
								// Disable movement.
								section.find(".other-stats-button").removeAttribute("disabled");
								section.findAll(".custom-stats .tt-table-row").forEach((row) => row.classList.remove("tt-sortable"));

								sortable.option("disabled", true);
							}
						},
					},
				});

				const otherList = document.newElement({
					type: "button",
					class: "tt-btn other-stats-button",
					text: "View other stats.",
					events: {
						click() {
							const isCustom = !content.find(".custom-stats").classList.toggle("tt-hidden");

							if (isCustom) {
								content.find(".other-stats").classList.add("tt-hidden");
								content.find(".move-stats").classList.remove("tt-hidden");
								otherList.textContent = "View other stats.";
							} else {
								content.find(".other-stats").classList.remove("tt-hidden");
								content.find(".move-stats").classList.add("tt-hidden");
								otherList.textContent = "View custom list.";
							}
						},
					},
				});

				const editButton = document.newElement({
					type: "button",
					class: "edit-stats",
					children: [document.newElement({ type: "i", class: "fa-solid fa-gear" })],
					events: {
						click() {
							const overlay = document.find(".tt-overlay");

							const button = section.find(".edit-stats");
							const otherStatsButton = section.find(".other-stats-button");

							const customStats = section.find(".custom-stats");
							const otherStats = section.find(".other-stats");

							if (overlay.classList.toggle("tt-hidden")) {
								// Overlay is now hidden.
								[button, otherStatsButton, customStats, otherStats].forEach((element) => element.classList.remove("tt-overlay-item"));
								section.findAll(".tt-table-row:not(.tt-table-row-header)").forEach((row) => row.removeEventListener("click", onStatClick));
								overlayStatus = false;
							} else {
								// Overlay is now shown.
								[button, otherStatsButton, customStats, otherStats].forEach((element) => element.classList.add("tt-overlay-item"));
								section.findAll(".tt-table-row:not(.tt-table-row-header)").forEach((row) => row.addEventListener("click", onStatClick));
								overlayStatus = true;
							}
						},
					},
				});

				const actions = document.newElement({ type: "div", class: "stat-actions", children: [moveButton, otherList, editButton] });
				section.appendChild(actions);
			} else {
				section.appendChild(document.newElement({ type: "div", class: "stats-error-message", text: "Failed to fetch data." }));
			}

			showLoadingPlaceholder(section, false);

			async function onStatClick(event) {
				const row = event.target.closest(".tt-table-row");
				if (!row) return;

				const table = row.closest(".tt-table");
				const isCustom = table.classList.contains("custom-stats");
				if (isCustom) {
					row.remove();
					await saveStats();
					buildOthers(true);
				} else {
					const otherTable = table.previousElementSibling.find(".tt-table-body");

					otherTable.appendChild(row);
					await saveStats();
				}
			}

			function saveStats() {
				const stats = [...section.findAll(".custom-stats .tt-table-row")].map((row) => row.children[0].textContent);

				return ttStorage.change({ filters: { profile: { stats } } });
			}

			function createStatsTable(id, rows, hidden = false, hasHeaders = false) {
				return createTable(
					[
						{ id: "stat", title: "Stat", width: 140, cellRenderer: stringCellRenderer },
						{ id: "them", title: "Them", class: "their-stat", width: 80, cellRenderer: numberCellRenderer },
						{ id: "you", title: "You", class: "your-stat", width: 80, cellRenderer: numberCellRenderer },
					],
					rows,
					{
						tableClass: `${id} ${hidden ? "tt-hidden" : ""}`,
						rowClass: (rowData) => {
							if (rowData.them === "N/A" || rowData.you?.value === "N/A" || rowData.them === rowData.you?.value) return "";

							return rowData.them > rowData.you?.value ? "superior-them" : "superior-you";
						},
						stretchColumns: true,
						rowGroupInfo: hasHeaders
							? {
									groupBy: "type",
									cellRenderer: stringCellRenderer,
							  }
							: undefined,
					}
				);
			}

			function buildCustom() {
				const stats = filters.profile.stats;

				const rows = stats
					.map((name) => {
						const stat = STATS.find((_stat) => _stat.name === name);
						if (!stat) return false;

						const them = stat.v2Getter(data);
						const you = stat.v2Getter(userdata);
						if (isNaN(them) || isNaN(you)) return false;

						const row = {
							stat: stat.name,
							them: them,
							you: { value: you, relative: you - them },
						};

						if (stat.formatter) row.cellRenderer = stat.formatter;

						return row;
					})
					.filter((value) => !!value);

				const table = createStatsTable("custom-stats", rows, false, false);
				section.appendChild(table.element);
			}

			function buildOthers(requireCleanup) {
				const stats = filters.profile.stats;

				const _stats = STATS.filter((stat) => !stats.includes(stat.name))
					.map((stat) => {
						const them = stat.v2Getter(data);
						const you = stat.v2Getter(userdata);
						if (isNaN(them) || isNaN(you)) return false;

						const row = {
							stat: stat.name,
							them: them,
							you: { value: you, relative: you - them },
							type: stat.type,
						};

						if (stat.formatter) row.cellRenderer = stat.formatter;

						return row;
					})
					.filter((value) => !!value);
				const table = createStatsTable("other-stats", _stats, true, true);

				if (requireCleanup) {
					section.find(".other-stats")?.remove();

					if (overlayStatus) {
						table.element.classList.add("tt-overlay-item");
						table.element.findAll(".tt-table-row:not(.tt-table-row-header)").forEach((row) => row.removeEventListener("click", onStatClick));
					}

					const actions = section.find(".stat-actions");
					actions.parentElement.insertBefore(table.element, actions);
				} else {
					section.appendChild(table.element);
				}
			}
		}

		async function buildSpy(ignoreCache) {
			if (!settings.pages.profile.boxSpy || !settings.apiUsage.user.battlestats) return;

			const section = document.newElement({ type: "div", class: "section spy-information" });
			content.appendChild(section);

			showLoadingPlaceholder(section, true);

			const errors = [];
			let spy = false,
				isCached = false;
			if (settings.external.yata) {
				try {
					let result;
					if (!ignoreCache && ttCache.hasValue("yata-spy", id)) {
						result = ttCache.get("yata-spy", id);
						isCached = true;
					} else {
						result = (await fetchData(FETCH_PLATFORMS.yata, { relay: true, section: "spy", id, includeKey: true, silent: true }))?.spies[id];

						if (result) {
							result = {
								...result,
								update: result.update * 1000,
							};
						}

						ttCache.set({ [id]: result || false }, getCacheTime(!result, result?.update * 1000), "yata-spy").then(() => {});
						isCached = false;
					}

					if (result) {
						spy = {
							defense: result.defense,
							dexterity: result.dexterity,
							speed: result.speed,
							strength: result.strength,
							total: result.total,

							type: false,
							timestamp: result.update,
							updated: formatTime(result.update, { type: "ago" }),
							source: "YATA",
						};
					}
				} catch (error) {
					if (typeof error.error === "object") {
						const { code, error: message } = error.error;

						if (code === 2 && message === "Player not found") errors.push({ service: "YATA", message: "You don't have an account." });
						else if (code === 429) errors.push({ service: "YATA", message: "Due to server overload, YATA is imposing a rate limit." });
						else if (code === 502) errors.push({ service: "YATA", message: "YATA appears to be down." });
						else errors.push({ service: "YATA", message: `Unknown (${code}) - ${message}` });
					} else if (error.code === 502) {
						errors.push({ service: "YATA", message: "YATA appears to be down." });
					} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK || error.code === CUSTOM_API_ERROR.CANCELLED) {
						errors.push({ service: "YATA", message: "Network issues. You likely have no internet at this moment." });
					} else if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
						errors.push({ service: "YATA", message: "Permission not granted. Please make sure YATA has permission to run." });
					} else errors.push({ service: "YATA", message: `Unknown - ${JSON.stringify(error)}` });

					console.log("Couldn't load stat spy from YATA.", error);
				}
			}
			if (settings.external.tornstats) {
				try {
					let result;
					if (!ignoreCache && ttCache.hasValue("tornstats-spy", id)) {
						result = ttCache.get("tornstats-spy", id);
						isCached = true;
					} else {
						result = await fetchData(FETCH_PLATFORMS.tornstats, { section: "spy/user", id, silent: true, relay: true });

						result = {
							status: result.status,
							message: result.message,
							spy: result.spy,
						};

						ttCache.set({ [id]: result }, getCacheTime(result.spy?.status, result.spy?.timestamp * 1000), "tornstats-spy").then(() => {});
						isCached = false;
					}

					if (result.spy?.status) {
						const timestamp = result.spy.timestamp * 1000;

						if (!spy || timestamp > spy.timestamp) {
							spy = {
								defense: result.spy.defense,
								dexterity: result.spy.dexterity,
								speed: result.spy.speed,
								strength: result.spy.strength,
								total: result.spy.total,

								type: result.spy.type,
								timestamp,
								updated: result.spy.difference,
								source: "TornStats",
							};
						}
					} else {
						if (!result.status) {
							if (result.message) {
								if (result.message.includes("User not found.")) errors.push({ service: "TornStats", message: "You don't have an account." });
								else if (result.spy.message.includes("Spy not found.")) errors.push({ service: "TornStats", message: "No spy found." });
								else errors.push({ service: "TornStats", message: `Unknown - ${result.message}` });
							} else {
								errors.push({ service: "TornStats", message: `Unknown - ${JSON.stringify(result)}` });
							}
						}
					}
				} catch (error) {
					if (typeof error.error === "object") {
						const { code, error: message } = error.error;

						if (code === 429) errors.push({ service: "TornStats", message: "You've exceeded your API limit. Try again in a minute." });
						else errors.push({ service: "TornStats", message: `Unknown (${code}) - ${message}` });
					} else if (error.code === 502) {
						errors.push({ service: "TornStats", message: "TornStats appears to be down." });
					} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK || error.code === CUSTOM_API_ERROR.CANCELLED) {
						errors.push({ service: "TornStats", message: "Network issues. You likely have no internet at this moment." });
					} else if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
						errors.push({ service: "TornStats", message: "Permission not granted. Please make sure TornStats has permission to run." });
					} else errors.push({ service: "TornStats", message: `Unknown - ${JSON.stringify(error)}` });

					console.log("Couldn't load stat spy from TornStats.", error);
				}
			}

			showLoadingPlaceholder(section, false);

			if (spy) {
				const table = createTable(
					[
						{ id: "stat", title: "Stat", width: 60, cellRenderer: stringCellRenderer },
						{ id: "them", title: "Them", class: "their-stat", width: 80, cellRenderer: numberCellRenderer },
						{ id: "you", title: "You", class: "your-stat", width: 80, cellRenderer: numberCellRenderer },
					],
					[
						{ stat: "Strength", them: spy.strength, you: { value: userdata.strength, relative: getRelative(spy.strength, userdata.strength) } },
						{ stat: "Defense", them: spy.defense, you: { value: userdata.defense, relative: getRelative(spy.defense, userdata.defense) } },
						{ stat: "Speed", them: spy.speed, you: { value: userdata.speed, relative: getRelative(spy.speed, userdata.speed) } },
						{
							stat: "Dexterity",
							them: spy.dexterity,
							you: { value: userdata.dexterity, relative: getRelative(spy.dexterity, userdata.dexterity) },
						},
						{ stat: "Total", them: spy.total, you: { value: userdata.total, relative: getRelative(spy.total, userdata.total) } },
					],
					{
						rowClass: (rowData) => {
							if (rowData.them === "N/A" || rowData.you.value === "N/A") return "";

							return rowData.them > rowData.you.value ? "superior-them" : "superior-you";
						},
						stretchColumns: true,
					}
				);
				section.appendChild(table.element);

				let sourceText;
				if (spy.source) {
					if (isCached) sourceText = "Cached Source: ";
					else sourceText = "Source: ";

					sourceText += spy.source;
					if (spy.type) sourceText += `(${spy.type})`;
					sourceText += `, ${spy.updated}`;
				}

				const footer = document.newElement({ type: "div", class: "spy-footer" });

				if (sourceText) footer.appendChild(document.newElement({ type: "p", class: "spy-source", html: sourceText }));
				footer.appendChild(
					document.newElement({
						type: "i",
						class: "fa-solid fa-arrow-rotate-right",
						events: {
							click: () => {
								section.remove();
								buildSpy(true);
							},
						},
					})
				);

				section.appendChild(footer);
			} else {
				const footer = document.newElement({ type: "div", class: "spy-footer" });

				footer.appendChild(document.newElement({ type: "span", class: "no-spy", text: "There is no spy report." }));
				footer.appendChild(
					document.newElement({
						type: "i",
						class: "fa-solid fa-arrow-rotate-right",
						events: {
							click: () => {
								section.remove();
								buildSpy(true);
							},
						},
					})
				);
				section.appendChild(footer);
				if (errors.length) {
					section.appendChild(
						document.newElement({
							type: "p",
							class: "no-spy-errors",
							html: errors.map(({ service, message }) => `${service} - ${message}`).join("<br>"),
						})
					);
				}
			}

			function getRelative(them, your) {
				return them === "N/A" || your === "N/A" ? "N/A" : your - them;
			}

			function getCacheTime(hasSpy, timestamp) {
				if (!hasSpy) {
					return TO_MILLIS.HOURS * 1;
				}

				const days = timestamp / TO_MILLIS.DAYS;

				if (days > 31) return TO_MILLIS.HOURS * 6;
				else return TO_MILLIS.DAYS;
			}
		}

		async function buildStakeouts() {
			if (!settings.pages.profile.boxStakeout) return;

			const hasStakeout = id in stakeouts && typeof stakeouts[id] !== "undefined";

			const checkbox = createCheckbox({ description: "Stakeout this user." });
			checkbox.setChecked(hasStakeout);
			checkbox.onChange(() => {
				if (checkbox.isChecked()) {
					stakeouts[id] = { alerts: { okay: false, hospital: false, landing: false, online: false, life: false } };
					stakeouts.order = Object.keys(stakeouts).filter((stakeoutID) => !isNaN(parseInt(stakeoutID)));
					ttStorage.set({ stakeouts });

					alerts.classList.remove("tt-hidden");
				} else {
					delete stakeouts[id];
					stakeouts.order = Object.keys(stakeouts).filter((stakeoutID) => !isNaN(parseInt(stakeoutID)));
					ttStorage.set({ stakeouts });

					alerts.classList.add("tt-hidden");
					content.findAll("input[type='text'], input[type='number']").forEach((input) => (input.value = ""));
					content.findAll("input[type='checkbox']").forEach((input) => (input.checked = false));
				}
			});

			const isOkay = createCheckbox({ description: "is okay" });
			isOkay.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { okay: isOkay.isChecked() } } } });
			});

			const isInHospital = createCheckbox({ description: "is in hospital" });
			isInHospital.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { hospital: isInHospital.isChecked() } } } });
			});

			const lands = createCheckbox({ description: "lands" });
			lands.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { landing: lands.isChecked() } } } });
			});

			const comesOnline = createCheckbox({ description: "comes online" });
			comesOnline.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { online: comesOnline.isChecked() } } } });
			});

			const lifeDrops = createTextbox({ description: { before: "life drops below", after: "%" }, type: "number", attributes: { min: 1, max: 100 } });
			lifeDrops.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { life: parseInt(lifeDrops.getValue()) || false } } } });
			});

			const offlineFor = createTextbox({ description: { before: "offline for over", after: "hours" }, type: "number", attributes: { min: 1 } });
			offlineFor.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { offline: parseInt(offlineFor.getValue()) || false } } } });
			});

			const isRevivable = createCheckbox({ description: "is revivable" });
			isRevivable.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { revivable: isRevivable.isChecked() } } } });
			});

			const alerts = document.newElement({
				type: "div",
				class: "alerts",
				children: [
					isOkay.element,
					isInHospital.element,
					lands.element,
					comesOnline.element,
					lifeDrops.element,
					offlineFor.element,
					isRevivable.element,
				],
			});

			if (hasStakeout) {
				isOkay.setChecked(stakeouts[id].alerts.okay);
				isInHospital.setChecked(stakeouts[id].alerts.hospital);
				lands.setChecked(stakeouts[id].alerts.landing);
				comesOnline.setChecked(stakeouts[id].alerts.online);
				lifeDrops.setValue(stakeouts[id].alerts.life === false ? "" : stakeouts[id].alerts.life);
				offlineFor.setValue(stakeouts[id].alerts.offline === false ? "" : stakeouts[id].alerts.offline);
				isRevivable.setChecked(stakeouts[id].alerts.revivable);
			} else {
				alerts.classList.add("tt-hidden");
			}

			content.appendChild(document.newElement({ type: "div", class: "section stakeout", children: [checkbox.element, alerts] }));
		}

		async function buildAttackHistory() {
			if (!settings.pages.profile.boxAttackHistory || !settings.pages.global.keepAttackHistory) return;

			const section = document.newElement({ type: "div", class: "section attack-history" });

			if (id in attackHistory.history) {
				const history = attackHistory.history[id];

				function respectCellRenderer(respectArray) {
					let respect = respectArray.length ? respectArray.totalSum() / respectArray.length : 0;
					if (respect > 0) respect = formatNumber(respect, { decimals: 2 });
					else respect = "-";

					return {
						element: document.createTextNode(respect),
						dispose: () => {},
					};
				}

				function ffCellRenderer(modifier) {
					let ff;
					if (modifier > 0) ff = formatNumber(modifier, { decimals: 2 });
					else ff = "-";

					return {
						element: document.createTextNode(ff),
						dispose: () => {},
					};
				}

				const table = createTable(
					[
						{ id: "win", title: "Wins", class: "positive", width: 40, cellRenderer: stringCellRenderer },
						{ id: "defend", title: "Defends", class: "positive last-cell", width: 60, cellRenderer: stringCellRenderer },
						{ id: "lose", title: "Lost", class: "negative", width: 30, cellRenderer: stringCellRenderer },
						{ id: "defend_lost", title: "Defends lost", class: "negative", width: 80, cellRenderer: stringCellRenderer },
						{ id: "stalemate", title: "Stalemates", class: "negative", width: 70, cellRenderer: stringCellRenderer },
						{ id: "escapes", title: "Escapes", class: "negative last-cell", width: 60, cellRenderer: stringCellRenderer },
						{ id: "respect_base", title: "Respect", class: "neutral", width: 50, cellRenderer: respectCellRenderer },
						{ id: "latestFairFightModifier", title: "FF", class: "neutral", width: 50, cellRenderer: ffCellRenderer },
					],
					[history],
					{
						stretchColumns: true,
					}
				);

				section.appendChild(table.element);
			} else {
				section.appendChild(document.newElement({ type: "span", class: "no-history", text: "There is no attack history." }));
			}

			content.appendChild(section);
		}
	}

	function removeBox() {
		removeContainer("User Information");
	}

	function crimesStats(c1Getter, c2Getter) {
		return (data) => {
			const cVersion = data.personalstats.crimes.version;
			if (cVersion === "v1") return c1Getter(data);
			else if (cVersion === "v2") return c2Getter(data);
			else throw new Error(`Unsupported crimes version '${cVersion}'!`);
		};
	}
})();
