interface YATALoot {
	hosp_out: {
		[id: string]: number;
	};
	next_update: number;
	timestamp: number;
}

interface YATAFactionMembers {
	members: {
		[id: string]: {
			id: number;
			name: string;
			status: string;
			last_action: number;
			dif: number;
			crimes_rank: number;
			bonus_score: number;
			nnb_share: number;
			nnb: number;
			energy_share: number;
			energy: number;
			refill: boolean;
			drug_cd: number;
			revive: boolean;
			carnage: number;
			stats_share: number;
			stats_dexterity: number;
			stats_defense: number;
			stats_speed: number;
			stats_strength: number;
			stats_total: number;
		};
	};
}

interface YATASpyResponse {
	spies: {
		[id: string]: {
			strength: number; // -1 if unknown
			speed: number; // -1 if unknown
			defense: number; // -1 if unknown
			dexterity: number; // -1 if unknown
			total: number; // -1 if unknown
			strength_timestamp: number; // 0 if unknown
			speed_timestamp: number; // 0 if unknown
			defense_timestamp: number; // 0 if unknown
			dexterity_timestamp: number; // 0 if unknown
			total_timestamp: number; // 0 if unknown
			update: number; // max of all timestamps
			target_name: string; // Player if unknown
			target_faction_name: string; // 0 if unknown or not in a faction
			target_faction_id: number; // None if unknown or not in a faction
		};
	};
}

interface YATATravelResponse {
	stocks: {
		[country: string]: {
			update: number;
			stocks: {
				id: number;
				name: string;
				quantity: number;
				cost: number;
			}[];
		};
	};
	timestamp: number;
}

interface TornstatsError {
	status: false;
	message: string;
}

interface TornstatsLoot {
	[id: string]: {
		name: string;
		torn_id: number;
		status: string;
		hosp_out: number;
		loot_2: number;
		loot_3: number;
		loot_4: number;
		loot_5: number;
		updated: number;
	};
}

type TornstatsFactionCrimes =
	| {
			status: true;
			message: string;
			members: {
				[id: string]: {
					natural_nerve: 60;
					crime_success: 9;
					psych_degree: 1;
					federal_judge: 1;
					verified: 1;
				};
			};
	  }
	| TornstatsError;

interface TornstatsSpy {
	status: true;
	message: string;
	compare: unknown;
	spy:
		| {
				type: string;
				status: true;
				message: string;
				player_name: string;
				player_id: string;
				player_level: number;
				player_faction: string;
				target_score: number;
				your_score: number;
				fair_fight_bonus: number;
				difference: string;
				timestamp: number;
				strength: number;
				deltaStrength: number;
				strength_timestamp: number;
				defense: number;
				deltaDefense: number;
				defense_timestamp: number;
				speed: number;
				deltaSpeed: number;
				speed_timestamp: number;
				dexterity: number;
				deltaDexterity: number;
				dexterity_timestamp: number;
				total: number;
				deltaTotal: number;
				total_timestamp: number;
		  }
		| TornstatsError;
	attacks: unknown | TornstatsError;
}

type TornstatsFactionSpyResponse =
	| {
			status: true;
			message: string;
			faction: {
				ID: number;
				name: string;
				tag: string;
				tag_image: string;
				leader: number;
				"co-leader": number;
				respect: number;
				age: number;
				capacity: number;
				best_chain: number;
				ranked_wars: unknown[];
				territory_wars: unknown[];
				raid_wars: unknown[];
				peace: unknown[];
				rank: {
					level: number;
					name: string;
					division: number;
					position: number;
					wins: number;
				};
				members: {
					[id: string]: {
						name: string;
						level: number;
						days_in_faction: number;
						last_action: {
							status: string;
							timestamp: number;
							relative: string;
						};
						status: unknown;
						spy?: {
							strength: number;
							defense: number;
							speed: number;
							dexterity: number;
							total: number;
							timestamp: number;
						};
						position: string;
						id: number;
						personalstats: unknown;
					};
				};
				spies: number[];
			};
	  }
	| TornstatsError;

interface LootRangersLoot {
	time: {
		clear: number;
		current: number;
		attack: boolean;
		reason: string;
	};
	npcs: {
		[id: string]: {
			name: string;
			hosp_out: number;
			next: true;
			life: {
				current: number;
				max: number;
			};
		};
	};
	order: number[];
}

type FFScouterResult = {
	player_id: number;
	fair_fight: number | null;
	bs_estimate: number | null;
	bs_estimate_human: string | null;
	last_updated: number | null;
}[];

type TornW3BResult = {
	listings: {
		item_id: number;
		player_id: number;
		player_name: string;
		quantity: number;
		price: number;
		content_updated: number;
		last_checked: number;
		content_updated_relative: string;
		last_checked_relative: string;
	}[];
};

type TornDirectPostItemResult = { success: false; text: string };

interface PrometheusTravelResponse {
	stocks: {
		[country: string]: {
			update: number;
			stocks: {
				id: number;
				name: string;
				quantity: number;
				cost: number;
				nextRestock: string | null;
			}[];
		};
	};
	timestamp: number;
}
