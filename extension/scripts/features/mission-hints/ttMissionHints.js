"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Mission Hints",
		"missions",
		() => settings.pages.missions.hints,
		initialise,
		showHints,
		removeHints,
		{
			storage: ["settings.pages.missions.hints"],
		},
		null
	);

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.MISSION_LOAD].push(() => {
			if (!feature.enabled()) return;

			showHints();
		});
	}

	async function showHints() {
		// Source: https://www.torn.com/forums.php#/p=threads&f=19&t=16130409&b=0&a=0&start=0&to=19915206
		const MISSION_HINTS = {
			a_good_day_to_get_hard: {
				task: "Achieve a killstreak of 3 - 10.",
				hint: "Buying losses is a valid strategy.",
			},
			a_kimpossible_task: {
				task: "Defeat (P) using only melee and temporary weapons.",
				hint: "Guns can stay equipped.",
			},
			a_problem_at_the_tracks: {
				task: "Defeat 3 (P) using only fist or melee weapons.",
				hint: "Other weapons can stay equipped. Using any other weapon will fail this mission!",
			},
			a_thor_loser: {
				task: "Use Duke's hammer to hit 8 - 14 unique body parts",
				hint: "Stalemating is a good way to achieve this.",
			},
			against_the_odds: {
				task: "Defeat 2 (P).",
			},
			an_honorary_degree: {
				task: "Defeat (P) without using any guns",
				hint: "Guns can stay equipped. Using a gun will fail this mission!",
			},
			army_of_one: {
				task: "Attack (P) 3 times with various masks.",
				hint: "Duke will send you the two masks to wear. Make sure that one of the attacks is without any mask. You just need to attack the target, defeating them isn't a requirement.",
			},
			bakeout_breakout: {
				task: "Combine a fruitcake and the lock pick, and send 'special fruitcake' to someone in jail.",
			},
			bare_knuckle: {
				task: "Defeat (P) with no weapons or armor equipped.",
				hint: "Unequip everything. Residual effects from previous fights will fail this mission!",
			},
			batshit_crazy: {
				task: "Inflict damage with Penelope.",
				hint: "You'll receive Penelope from Duke. Amount of damage is apparently based on your maximum life.",
			},
			battering_ram: {
				task: "Attack (P) 3 times.",
			},
			big_tub_of_muscle: {
				task: "Defeat (P) despite their gargantuan strength.",
			},
			birthday_surprise: {
				task: "Obtain and send a specific item as a present to Duke.",
				hint: "Place the item in an empty box, then gift wrap it to get it as a parcel.",
			},
			bonnie_and_clyde: {
				task: "Defeat (P), and their spouse.",
			},
			bountiful: {
				task: "Successfully claim 2 - 5 bounties",
				hint: "Make sure to hospitalize the target.",
			},
			bounty_on_the_mutiny: {
				task: "Bounty (P) and wait for the bounty to be claimed.",
				hint: "You cannot claim your own bounties.",
			},
			bring_it: {
				task: "Defeat Duke in a group attack",
				hint: "Unlike other missions, you'll have a week to finish this one. Doesn't have to be the finishing hit, so just join when people try to loot him.",
			},
			candy_from_babies: {
				task: "Collect $50,000 - $250,000 in bounties.",
				hint: "Doesn't have to be in a single bounty. Make sure to hospitalize the target(s).",
			},
			charity_work: {
				task: "Mug 2 (P)",
				hint: "Must be a successful mug. Sending them a small amount will guarantee a mug.",
			},
			cracking_up: {
				task: "Defeat and interrogate (P) for the code to unlock Duke's safe and send the content to Duke after opening it.",
				hint: "Can take a few times to get the code.",
			},
			critical_education: {
				task: "Achieve 3 - 9 critical hits",
			},
			cut_them_down_to_size: {
				task: "Defeat any player of your level or higher.",
			},
			dirty_little_secret: {
				task: "Put a bounty on (P), then attack the person who claimed it.",
				hint: "If the claimer is anonymous, their ID # still shows up in the mission screen.",
			},
			double_jeopardy: {
				task: "Put a bounty on someone and defeat them.",
				hint: "Bounty can be any amount as it doesn't have to be claimed.",
			},
			drug_problem: {
				task: "Defeat 4 - 7 (P).",
			},
			emotional_debt: {
				task: "Hit (P) with tear gas or pepper spray.",
			},
			estranged: {
				task: "Injure one of (P)'s legs.",
				// Source: https://www.torn.com/forums.php#/p=threads&f=19&t=16207483&b=0&a=0&start=0&to=21149672
				hint: "Feet count as legs in this instance.",
			},
			family_ties: {
				task: "Hospitalize (P) 3 times",
			},
			field_trip: {
				task: "Win $100 - $1,000,000 on 3 casino games.",
			},
			fireworks: {
				task: "Expend 250 - 1250 rounds of ammunition",
			},
			forgotten_bills: {
				task: "Defeat (P)",
			},
			frenzy: {
				task: "Defeat any 5 - 15 players.",
				hint: "You must initiate the attacks; buying losses will not work for this mission",
			},
			get_things_jumping: {
				task: "Deal and receive damage.",
				hint: "Values are apparently based on your maximum life.",
			},
			graffiti: {
				task: "Hit (P) with pepper spray.",
				hint: "Even if it's ineffective, it still counts.",
			},
			guardian: {
				task: "Defeat (P).",
			},
			hammer_time: {
				task: "Defeat (P) with a hammer.",
				hint: "Guns can stay equipped. Dual hammers don't count.",
			},
			hands_off: {
				task: "Defeat 3 - 5 (P).",
			},
			hare_meet_tortoise: {
				task: "Defeat (P) despite their lightning fast speed.",
				hint: "Flash and smoke grenades will reduce their speed.",
			},
			hide_and_seek: {
				task: "Find (P) from 3 - 5 listed and defeat them.",
				hint: "Given clues make it easy to identify the target.",
			},
			hiding_in_plain_view: {
				task: "Defeat (P) in a random country.",
			},
			high_fliers: {
				task: "Defeat 3 (P) in random countries",
			},
			hobgoblin: {
				task: "Defeat a player of your choice 5 times",
			},
			immovable_object: {
				task: "Defeat (P) despite their impenetrable defense.",
			},
			inside_job: {
				task: "Attack (P) and secrete an item on them.",
			},
			introduction_duke: {
				task: "Complete 10 Duke contracts.",
			},
			keeping_up_appearances: {
				task: "Mug (P) and send them back the money.",
				hint: "Must be a successful mug. Sending them a small amount will guarantee a mug.",
			},
			kiss_of_death: {
				task: "Defeat (P) and use the kiss option.",
			},
			lack_of_awareness: {
				task: "Defeat (P).",
			},
			lost_and_found: {
				task: "Put (P) in the hospital for 12 hours.",
			},
			loud_and_clear: {
				task: "Use 3 - 11 explosive grenades.",
			},
			loyal_customer: {
				task: "Defeat (P).",
			},
			make_it_slow: {
				task: "Defeat (P) in no fewer than 5 - 9 turns in a single attack.",
				hint: "Survive for at least 7 or 9 turns then defeat the target. You can keep retrying if it fails.",
			},
			marriage_counseling: {
				task: "Defeat (P)'s spouse.",
			},
			massacrist: {
				task: "Defeat (P).",
			},
			meeting_the_challenge: {
				task: "Mug people for a total of $10,000 - $16,000,000.",
			},
			motivator: {
				task: "Lose or stalemate to (P) on the first attempt.",
				hint: "You can get your health low by using the wrong blood bag. Make yourself weak by unequipping armor and equip a rusty sword. Timing out DOES fail this mission. ",
			},
			new_kid_on_the_block: {
				task: "Defeat 5 players.",
			},
			no_man_is_an_island: {
				task: "Mug 2 out of 3 (P).",
				hint: "You can select which of the targets to hit, as long as you mug 2 different ones.",
			},
			no_second_chances: {
				task: "Defeat (P) on the first attempt.",
			},
			out_of_the_frying_pan: {
				task: "Go to the jail, use Felovax to go to the hospital, then use Zylkene.",
			},
			painleth_dentitht: {
				task: "Defeat (P) with a baseball bat.",
				// Using any other weapon is allowed. https://www.torn.com/forums.php#/p=threads&f=19&t=16291785&b=0&a=0&start=0&to=22732030
				hint: "Other weapons can stay equipped.",
			},
			party_tricks: {
				task: "Defeat (P) despite their nimble dexterity.",
			},
			pass_the_word: {
				task: "Send a message including keyword to (P).",
				hint: "It's easy to achieve this by copying the mission description.",
			},
			peak_experience: {
				task: "Defeat (P).",
			},
			proof_of_the_pudding: {
				task: "Use a specific weapon on (P), then send the weapon to them.",
				hint: "You don't have to send the exact same gun you used to attack with, just same type.",
			},
			rabbit_response: {
				task: "Defeat 3 (P) within 30 - 10 minutes.",
				hint: "Timer starts after attacking one of the targets, so make sure they are all out of the hospital.",
			},
			reconstruction: {
				task: "Equip kitchen knife and leather gloves, defeat (P) then dump both items.",
				hint: "Don't have to actually use the kitchen knife.",
			},
			red_faced: {
				task: "Defeat (P) with a trout on the finishing hit.",
			},
			rising_costs: {
				task: "Hit (P) with a brick.",
				hint: "Brick has to hit, a miss won't count.",
			},
			rolling_in_it: {
				task: "Mug (P).",
				hint: "Must be a successful mug. Sending them a small amount will guarantee a mug.",
			},
			safari: {
				task: "Defeat (P) with a rifle in South Africa.",
			},
			scammer: {
				task: "Defeat (P).",
				hint: "Target might have some nice cash on them, mugging could be beneficial.",
			},
			sellout_slayer: {
				task: "Buy a gun, use the gun on any 2 - 6 players, then sell it again.",
				hint: "Not every non-melee weapon is a gun. As example, a blowgun might not work.",
			},
			sending_a_message: {
				task: "Defeat (P).",
			},
			show_some_muscle: {
				task: "Attack (P).",
				hint: "You just need to attack the target, defeating them isn't a requirement.",
			},
			sleep_aid: {
				task: "Defeat (P).",
			},
			some_people: {
				task: "Send any item as a parcel to (P).",
			},
			standard_routine: {
				task: "Defeat (P) with a clubbed weapon, fists or kick.",
			},
			stomach_upset: {
				task: "Injure (P)'s stomach.",
			},
			swan_step_too_far: {
				task: "Get an item from the dump and defeat its previous owner.",
				hint: "You can keep searching till you find an item previously owned by someone you can actually defeat.",
			},
			the_executive_game: {
				task: "Defeat (P) using only fists or kick.",
				hint: "Weapons can stay equipped.",
			},
			the_tattoo_artist: {
				task: "Defeat (P) using only a slashing or piercing weapon.",
				hint: "Guns can stay equipped.",
			},
			three_peat: {
				task: "Leave any player, mug any player and hospitalize any player.",
			},
			training_day: {
				task: "Use 250 - 1,250 energy in the gym.",
			},
			tree_huggers: {
				task: "Defeat 5 - 8 (P).",
			},
			undercutters: {
				task: "Defeat 3 (P).",
			},
			unwanted_attention: {
				task: "Hospitalize 4 (P).",
			},
			withdrawal: {
				task: "Injure (P)'s both arms.",
				hint: "Hands count as arms in this case.",
			},
			wrath_of_duke: {
				task: "Defeat 4 (P).",
			},
		};

		for (const context of document.findAll(".giver-cont-wrap > div[id^=mission]:not(.tt-modified)")) {
			const title = context.find(".title-black").childNodes[0].wholeText.replace(/\n/g, "").trim();

			const key = transformTitle(title);
			let task, hint;
			if (key in MISSION_HINTS) {
				const mission = MISSION_HINTS[key];

				task = mission.task;
				hint = mission.hint;
			} else {
				if (title.includes("{name}")) {
					task = "You are using a conflicting script.";
					hint = "Please remove the script that changes the mission title or contact the TornTools developers.";
				} else {
					task = "Couldn't find information for this mission.";
					hint = "Contact the TornTools developers.";
				}
			}

			let children = [
				document.newElement({ type: "h6", class: "tt-mission-title", text: "TornTools Mission Information" }),
				document.newElement({ type: "span", children: [document.newElement({ type: "b", text: "Task: " }), task] }),
			];
			if (hint) {
				children.push(
					document.newElement("br"),
					document.newElement({ type: "span", children: [document.newElement({ type: "b", text: "Hint: " }), hint] })
				);
			}

			context.find(".max-height-fix").appendChild(document.newElement({ type: "div", class: "tt-mission-information", children }));
			context.classList.add("tt-modified");
		}

		function transformTitle(title) {
			return title.toLowerCase().replaceAll(" ", "_").replaceAll(":", "").replaceAll("-", "_").replaceAll("!", "").replaceAll(",", "");
		}
	}

	function removeHints() {
		for (const context of document.findAll(".giver-cont-wrap > div[id^=mission].tt-modified")) context.classList.remove(".tt-modified");
		for (const information of document.findAll(".tt-mission-information")) information.remove();
	}
})();
