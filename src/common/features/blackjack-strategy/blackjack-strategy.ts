import "./blackjack-strategy.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { addXHRListener } from "@common/utils/functions/listeners";
import { SUGGESTIONS } from "@features/blackjack-strategy/blackjack-suggestions.ts";
import { Feature } from "@features/feature";

const ACTIONS: Record<string, string> = {
	H: "Hit",
	S: "Stand",
	D: "Double Down",
	P: "Split",
	R: "Surrender",
};

function initialiseStrategy() {
	addXHRListener(({ detail: { page, xhr, ...detail } }) => {
		if (!FEATURE_MANAGER.isEnabled(BlackjackStrategyFeature) || !("json" in detail)) return;
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

	let playerValue: string | number;
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
	} else if (cards.player.includes("A") && data.player.score !== data.player.lowestScore) {
		const leftOver = cards.player.filter((card) => card !== "A").map(getWorth) as number[];
		const leftOverWorth = leftOver.reduce((a, b) => a + b, 0) + (cards.player.length - 1 - leftOver.length);

		playerValue = `A,${leftOverWorth}`;
	} else {
		playerValue = data.player.score;
	}

	const suggestion = getSuggestion(playerValue);

	const element = document.querySelector(".tt-blackjack-suggestion");
	if (element) element.textContent = suggestion;
	else {
		document.querySelector(".player-cards").appendChild(elementBuilder({ type: "span", class: "tt-blackjack-suggestion", text: suggestion }));
	}

	function getWorth(card: string | number) {
		let symbol: string | number;
		if (typeof card === "string") symbol = card.split("-").at(-1);
		else symbol = card;

		return Number.isNaN(parseInt(symbol.toString())) ? (symbol === "A" ? "A" : 10) : parseInt(symbol.toString());
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

		function getAction(action: string, allowSelf: boolean): string {
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
						if (Number.isNaN(parseInt(hand[0]))) {
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
	const suggestion = document.querySelector(".tt-blackjack-suggestion");
	if (suggestion) suggestion.remove();
}

export default class BlackjackStrategyFeature extends Feature {
	constructor() {
		super("Blackjack Strategy", "casino");
	}

	override isEnabled() {
		return settings.pages.casino.blackjack;
	}

	override initialise() {
		initialiseStrategy();
	}

	override storageKeys() {
		return ["settings.pages.casino.blackjack"];
	}
}
