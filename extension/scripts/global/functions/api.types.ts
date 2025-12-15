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
