"use strict";

(async () => {
	// if (!getPageStatus().access) return;

	const ACTIONS = {
		H: "Hit",
		S: "Stand",
		D: "Double Down",
		P: "Split",
		R: "Surrender",
	};

	const SUGGESTIONS = {
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
			A: "H",
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
		addXHRListener(({ detail: { page, xhr, json } }) => {
			if (!feature.enabled()) return;

			if (page === "loader") {
				const params = new URL(xhr.responseURL).searchParams;
				const sid = params.get("sid");

				if (sid === "blackjackJson" && json) {
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

	function executeStrategy(data) {
		const cards = { dealer: getWorth(data.dealer.hand[0]), player: [] };

		for (const card of data.player.hand) {
			const worth = getWorth(card);

			cards.player.push(worth);
		}

		let suggestion;
		if (cards.player.length === 2) {
			if (cards.player.includes("A")) {
				const other = cards.player.find((worth) => worth !== "A");

				if (!other) suggestion = getSuggestion("A,A");
				else suggestion = getSuggestion(`A,${other}`);
			} else if (cards.player[0] === cards.player[1]) {
				suggestion = getSuggestion(`${cards.player[0]},${cards.player[1]}`);
			} else {
				suggestion = getSuggestion(data.player.score);
			}
		} else {
			if (cards.player.includes("A") && data.player.score !== data.player.lowestScore) {
				suggestion = getSuggestion(`A,${cards.player.filter((worth) => worth !== "A").totalSum()}`);
			} else {
				suggestion = getSuggestion(data.player.score);
			}
		}

		let element = document.find(".tt-blackjack-suggestion");
		if (element) element.textContent = suggestion;
		else {
			document.find(".player-cards").appendChild(document.newElement({ type: "span", class: "tt-blackjack-suggestion", text: suggestion }));
		}

		function getWorth(card) {
			const symbol = card.split("-").last();
			return isNaN(symbol) ? (symbol === "A" ? "A" : 10) : parseInt(symbol);
		}

		function getSuggestion(player) {
			let suggestion;
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

			function getAction(action, allowSelf) {
				if (action === "S3") return cards.player.length > 3 ? "H" : "S";
				else if (action === "S4") return cards.player.length > 4 ? "H" : "S";
				else if (action === "D" && !data.availableActions.includes("doubleDown")) return "H";
				else if (action === "DS3") return data.availableActions.includes("doubleDown") ? "D" : cards.player.length > 3 ? "H" : "S";
				else if (action === "R" && !data.availableActions.includes("surrender")) return "H";
				else if (action === "Rs") return data.availableActions.includes("surrender") ? "R" : "S";
				else if (action === "RS4") return data.availableActions.includes("surrender") ? "R" : cards.player.length > 4 ? "H" : "S";
				else if (action === "P" && !data.availableActions.includes("split")) {
					if (allowSelf) {
						const cards = player.split(",");
						if (cards[0] === cards[1]) {
							let value;
							if (!isNaN(cards[0])) {
								if (cards[0] === "A") value = 12;
								else value = 20;
							} else value = parseInt(cards[0]) * 2;

							const alternative = getAction(SUGGESTIONS[value][dealer], false);
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
