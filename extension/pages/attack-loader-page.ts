export interface TornInternalAttackData {
	DB: {
		currentClips: unknown[];
		attackerAmmo: Record<
			string,
			{
				ammoCategoryID: number;
				ammoTitle: string;
				categoryTitle: string;
				priceMultiplier: number;
				amount: number;
				price: number;
				ammoID: number;
			}[]
		>;
		attackerUser: {
			userID: number;
			playername: string;
			gender: string;
			level: number;
			status: string;
			life: number;
			maxlife: number;
			factionID: number;
			corp: number;
			featurebits: number;
			statsModifiers: {
				strength: {
					legend: string[];
					value: number;
				};
				speed: {
					legend: string[];
					value: number;
				};
				dexterity: {
					legend: string[];
					value: number;
				};
				defense: {
					legend: string[];
					value: number;
				};
				damage: {
					legend: string[];
					value: number;
				};
			};
			chain: number;
			chainEnd: number;
			lastAction: number;
		};
		defenderUser: {
			userID: number;
			playername: string;
			gender: string;
			level: number;
			status: string;
			life: number;
			maxlife: number;
			factionID: number;
			corp: number;
			featurebits: number;
		};
		attackerItems: Record<
			string,
			{
				item: {
					name: string;
					dmg: unknown;
					acc: number;
					ID: number;
				}[];
			}
		>;
		attackerAmmoStatus: Record<string, string>;
		defenderItems: unknown;
		startButtonTitle: string;
		additionalInfo: {
			defender: {
				model: string;
			};
		};
		viewStyle: string;
		usersLife: {
			attacker: {
				currentLife: number;
				maxLife: number;
				lifeBar: number;
			};
			defender: {
				currentLife: number;
				maxLife: number;
				lifeBar: number;
			};
		};
		currentTemporaryEffects: [];
		attackStatus: string;
		loadtime: string[];
		enablePoll: boolean;
		joinBoxColor: null;
		pollDelay: number;
		isHQ: boolean;
		queueTicket: null;
		queueCapacity: number;
	};
	viewStyle: string;
}

export function isAttackData(step: string, _json: any): _json is TornInternalAttackData {
	return step === "attackData";
}
