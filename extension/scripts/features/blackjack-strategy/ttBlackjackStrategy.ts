(async () => {
	// if (!getPageStatus().access) return;

	const ACTIONS = {
		H: "Hit",
		S: "Stand",
		D: "Double Down",
		P: "Split",
		R: "Surrender",
	};

	/* these suggestions come from :
	https://www.beatingbonuses.com/bjstrategy.php?decks=8&soft17=stand&doubleon=any2cards&peek=off&das=on&dsa=on&charlie=on&surrender=earlyf&opt=1&btn=Generate+Strategy
	(8 decks, double on any 2 cards, Double after Split, Hit Split Aces, 6-Card charlie, No Resplits Allowed, Dealer Stands on Soft 17, Dealer does not peek, full early surrender)
	*/

	const SUGGESTIONS = {
		// 4 is only used in a very specific case : After 2,2 is split and you get dealt another 2. Re-splits are not allowed, and therefore you need a backup strategy (which is to always hit, based on the strategy for 2,2).
		4: {
			2: "H",
			3: "H",
			4: "H",
			5: "H",
			6: "H",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		5: {
			2: "H",
			3: "H",
			4: "H",
			5: "H",
			6: "H",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		6: {
			2: "H",
			3: "H",
			4: "H",
			5: "H",
			6: "H",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		7: {
			2: "H",
			3: "H",
			4: "H",
			5: "H",
			6: "H",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		8: {
			2: "H",
			3: "H",
			4: "H",
			5: "H",
			6: "H",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		9: {
			2: "H",
			3: "D",
			4: "D",
			5: "D",
			6: "D",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		10: {
			2: "D",
			3: "D",
			4: "D",
			5: "D",
			6: "D",
			7: "D",
			8: "D",
			9: "D",
			10: "H",
			A: "H",
		},
		11: {
			2: "D",
			3: "D",
			4: "D",
			5: "D",
			6: "D",
			7: "D",
			8: "D",
			9: "D",
			10: "H",
			A: "H",
		},
		12: {
			2: "H",
			3: "H",
			4: "S3",
			5: "S3",
			6: "S3",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		13: {
			2: "S3",
			3: "S3",
			4: "S4",
			5: "S4",
			6: "S4",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		14: {
			2: "S4",
			3: "S4",
			4: "S4",
			5: "S4",
			6: "S4",
			7: "H",
			8: "H",
			9: "H",
			10: "R",
			A: "R",
		},
		15: {
			2: "S4",
			3: "S4",
			4: "S4",
			5: "S4",
			6: "S4",
			7: "H",
			8: "H",
			9: "H",
			10: "R",
			A: "R",
		},
		16: {
			2: "S4",
			3: "S4",
			4: "S",
			5: "S",
			6: "S",
			7: "H",
			8: "H",
			9: "R",
			10: "Rs",
			A: "R",
		},
		17: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "S",
			8: "S",
			9: "S4",
			10: "S4",
			A: "RS4",
		},
		18: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "S",
			8: "S",
			9: "S",
			10: "S",
			A: "S",
		},
		19: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "S",
			8: "S",
			9: "S",
			10: "S",
			A: "S",
		},
		20: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "S",
			8: "S",
			9: "S",
			10: "S",
			A: "S",
		},
		21: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "S",
			8: "S",
			9: "S",
			10: "S",
			A: "S",
		},
		"A,2": {
			2: "H",
			3: "H",
			4: "H",
			5: "H",
			6: "D",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"A,3": {
			2: "H",
			3: "H",
			4: "H",
			5: "D",
			6: "D",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"A,4": {
			2: "H",
			3: "H",
			4: "H",
			5: "D",
			6: "D",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"A,5": {
			2: "H",
			3: "H",
			4: "D",
			5: "D",
			6: "D",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"A,6": {
			2: "H",
			3: "D",
			4: "D",
			5: "D",
			6: "D",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"A,7": {
			2: "S3",
			3: "DS3",
			4: "DS3",
			5: "DS3",
			6: "DS3",
			7: "S4",
			8: "S3",
			9: "H",
			10: "H",
			A: "H",
		},
		"A,8": {
			2: "S4",
			3: "S4",
			4: "S4",
			5: "S4",
			6: "S4",
			7: "S4",
			8: "S4",
			9: "S4",
			10: "S3",
			A: "S4",
		},
		"A,9": {
			2: "S4",
			3: "S4",
			4: "S4",
			5: "S4",
			6: "S4",
			7: "S4",
			8: "S4",
			9: "S4",
			10: "S4",
			A: "S4",
		},
		"A,10": {
			2: "S4",
			3: "S4",
			4: "S4",
			5: "S4",
			6: "S4",
			7: "S4",
			8: "S4",
			9: "S4",
			10: "S4",
			A: "S4",
		},
		"2,2": {
			2: "P",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "P",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"3,3": {
			2: "H",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "P",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		"4,4": {
			2: "H",
			3: "H",
			4: "H",
			5: "P",
			6: "P",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"5,5": {
			2: "D",
			3: "D",
			4: "D",
			5: "D",
			6: "D",
			7: "D",
			8: "D",
			9: "D",
			10: "H",
			A: "H",
		},
		"6,6": {
			2: "P",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "R",
		},
		"7,7": {
			2: "P",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "P",
			8: "H",
			9: "H",
			10: "R",
			A: "R",
		},
		"8,8": {
			2: "P",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "P",
			8: "H",
			9: "H",
			10: "Rs",
			A: "R",
		},
		"9,9": {
			2: "P",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "S",
			8: "P",
			9: "P",
			10: "S",
			A: "S",
		},
		"10,10": {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "S",
			8: "S",
			9: "S",
			10: "S",
			A: "S",
		},
		"A,A": {
			2: "P",
			3: "P",
			4: "P",
			5: "P",
			6: "P",
			7: "P",
			8: "P",
			9: "P",
			10: "P",
			A: "P",
		},
	};

	const feature = featureManager.registerFeature(
		"Blackjack Strategy",
		"casino",
		() => settings.pages.casino.blackjack,
		initialiseStrategy,
		null,
		removeSuggestion,
		{
			storage: ["settings.pages.casino.blackjack"],
		},
		null
	);

	function initialiseStrategy() {
		addXHRListener(({ detail: { page, xhr, ...detail } }) => {
			if (!feature.enabled() || !("json" in detail)) return;
			const { json } = detail;

			if (page === "page") {
				const params = new URL(xhr.responseURL).searchParams;
				const sid = params.get("sid");

				if (sid === "blackjackData" && json) {
					switch (json.DB.result) {
						// case undefined:
						case "gameStarted":
						case "chooseAction":
							executeStrategy(json.DB);
							break;
						case "startGame":
						case "won":
						case "wonNatural":
						case "lost":
						case "dealerLost":
						case "draw":
							removeSuggestion();
							break;
						default:
							if (json.DB.roundNotEnded && json.DB.nextGame) {
								executeStrategy(json.DB);
							}
							break;
					}
				}
			}
		});
	}

	function executeStrategy(data: any) {
		const cards = { dealer: getWorth(data.dealer.hand[0]), player: [] as (string | number)[] };

		for (const card of data.player.hand) {
			const worth = getWorth(card);

			cards.player.push(worth);
		}

		let playerValue: any;
		if (cards.player.length === 2) {
			if (cards.player.includes("A")) {
				const other = cards.player.find((worth) => worth !== "A");

				if (!other) playerValue = "A,A";
				else playerValue = `A,${other}`;
			} else if (cards.player[0] === cards.player[1]) {
				playerValue = `${cards.player[0]},${cards.player[1]}`;
			} else {
				playerValue = data.player.score;
			}
		} else {
			if (cards.player.includes("A") && data.player.score !== data.player.lowestScore) {
				const leftOver = cards.player.filter((card) => card !== "A").map(getWorth) as number[];
				const leftOverWorth = leftOver.reduce((a, b) => a + b, 0) + (cards.player.length - 1 - leftOver.length);

				playerValue = `A,${leftOverWorth}`;
			} else {
				playerValue = data.player.score;
			}
		}
		const suggestion = getSuggestion(playerValue);

		let element = document.find(".tt-blackjack-suggestion");
		if (element) element.textContent = suggestion;
		else {
			document.find(".player-cards").appendChild(elementBuilder({ type: "span", class: "tt-blackjack-suggestion", text: suggestion }));
		}

		function getWorth(card: any) {
			let symbol: any;
			if (typeof card === "string") symbol = card.split("-").at(-1);
			else symbol = card;

			return isNaN(symbol) ? (symbol === "A" ? "A" : 10) : parseInt(symbol);
		}

		function getSuggestion(player: any) {
			let suggestion: string;
			if (player in SUGGESTIONS) {
				const dealer = cards.dealer;

				if (dealer in SUGGESTIONS[player]) {
					const action = getAction(SUGGESTIONS[player][dealer], true);

					suggestion = action in ACTIONS ? ACTIONS[action] : `no action - ${action}`;
				} else {
					suggestion = "no suggestion - dealer";
				}
			} else {
				suggestion = "no suggestion";
			}

			return suggestion;

			function getAction(action: string, allowSelf: boolean) {
				if (action === "S3") return cards.player.length > 3 ? "H" : "S";
				else if (action === "S4") return cards.player.length > 4 ? "H" : "S";
				else if (action === "D" && !data.availableActions.includes("doubleDown")) return "H";
				else if (action === "DS3") return data.availableActions.includes("doubleDown") ? "D" : cards.player.length > 3 ? "H" : "S";
				else if (action === "R" && !data.availableActions.includes("surrender")) return "H";
				else if (action === "Rs") return data.availableActions.includes("surrender") ? "R" : "S";
				else if (action === "RS4") return data.availableActions.includes("surrender") ? "R" : cards.player.length > 4 ? "H" : "S";
				else if (action === "P" && !data.availableActions.includes("split")) {
					if (allowSelf) {
						const hand = player.split(",");
						if (hand[0] === hand[1]) {
							let value: number;
							if (isNaN(hand[0])) {
								if (hand[0] === "A")
									return "H"; // It's not in the suggestions array, but we should always hit A,A after split
								else value = 20;
							} else value = parseInt(hand[0]) * 2;

							const alternative = getAction(SUGGESTIONS[value][cards.dealer], false);
							if (alternative !== "P") return alternative;
						}
					}

					return "H";
				}

				return action;
			}
		}
	}

	function removeSuggestion() {
		const suggestion = document.find(".tt-blackjack-suggestion");
		if (suggestion) suggestion.remove();
	}
})();
