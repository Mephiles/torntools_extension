interface YATALoot {
	hosp_out: {
		[id: string]: number;
	};
	next_update: number;
	timestamp: number;
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
	// item_id: number;
	// item_name: string;
	// market_price: number;
	// bazaar_average: number;
	// total_listings: number;
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
