import "./high-low-helper.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { capitalizeText } from "@common/utils/functions/formatting";
import { addXHRListener } from "@common/utils/functions/listeners";
import { Feature } from "@features/feature";

let deck: Record<string, number[]>;
shuffleDeck();

function initialiseHelper() {
	addXHRListener(({ detail: { page, xhr, json } }) => {
		if (page !== "page") return;

		const params = new URL(xhr.responseURL).searchParams;
		const sid = params.get("sid");
		if (!isInternalHighLowData(sid, json)) return;

		switch (json.status) {
			case "gameStarted": {
				const game = json.currentGame[0];
				if ("result" in game && game.result === "Incorrect") {
					const { suit, value } = getCardWorth(game.playerCardInfo);

					removeCard(suit, value);
					removeHelper();
				} else {
					executeStrategy(json);
				}
				break;
			}
			case "makeChoice":
				if (json.currentGame[0].playerCardInfo) {
					const { suit, value } = getCardWorth(json.currentGame[0].playerCardInfo);

					removeCard(suit, value);
				}

				removeHelper();
				break;
			case "startGame":
				removeHelper();
				moveStart();
				break;
			case "moneyTaken":
				removeHelper();
				break;
			default:
				break;
		}

		if (json.DB.deckShuffled) shuffleDeck();
	});
}

function executeStrategy(data: TornInternalHighLowData) {
	if (data.status === "startGame" || data.status === "moneyTaken") return;

	const { value: dealerValue, suit: dealerSuit } = getCardWorth(data.currentGame[0].dealerCardInfo);
	removeCard(dealerSuit, dealerValue);

	let higher = 0;
	let lower = 0;
	for (const suit in deck) {
		for (const value of deck[suit as keyof typeof deck]) {
			if (value > dealerValue) higher++;
			else if (value < dealerValue) lower++;
		}
	}

	let outcome: string;
	if (higher < lower) outcome = "lower";
	else if (higher > lower) outcome = "higher";
	else outcome = "50/50";

	const actions = findElement(".actions-wrap");
	if (settings.pages.casino.highlowMovement) {
		let action: string;
		if (outcome === "lower" || outcome === "higher") action = outcome;
		else if (outcome === "50/50") action = Math.random() < 0.5 ? "higher" : "lower";
		else return;

		actions.dataset.outcome = action;
		findElement(".startGame").style.display = "none";
	} else {
		const element = findElement(".tt-high-low", actions, true);
		if (element) element.textContent = outcome;
		else actions.appendChild(elementBuilder({ type: "span", class: "tt-high-low", text: capitalizeText(outcome) }));
	}
}

function getCardWorth({ classCode, nameShort }: { classCode: string; nameShort: string }) {
	const suit = classCode.split("-")[0];

	let value: number;
	if (!Number.isNaN(parseInt(nameShort))) value = parseInt(nameShort);
	else if (nameShort === "J") value = 11;
	else if (nameShort === "Q") value = 12;
	else if (nameShort === "K") value = 13;
	else if (nameShort === "A") value = 14;
	else throw `Invalid card value (${nameShort}).`;

	return { value, suit };
}

function moveStart() {
	if (!settings.pages.casino.highlowMovement) return;

	const actionsWrap = findElement(".actions-wrap");
	const actions = findElement(".actions");
	const startButton = findElement(".startGame");
	const lowButton = findElement(".low");
	const highButton = findElement(".high");
	const continueButton = findElement(".continue");

	actionsWrap.style.display = "block";
	actions.appendChild(startButton);
	startButton.style.display = "inline-block";
	lowButton.style.display = "none";
	highButton.style.display = "none";
	continueButton.style.display = "none";
}

function shuffleDeck() {
	deck = {
		hearts: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		diamonds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		clubs: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		spades: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
	};
}

function removeCard(suit: string, value: number) {
	deck[suit].splice(deck[suit].indexOf(value), 1);
}

function removeHelper() {
	const actions = findElement(".actions-wrap", true);

	if (actions) {
		delete actions.dataset.outcome;
		findElement(".tt-high-low", actions, true)?.remove();
	}
}

type TornInternalHighLowData = {
	currentLayoutType: string;
	user: { money: number; slotturns: number };
	DB: {
		deckShuffled: boolean;
		formulaStats: [{ ID: number; currentRatio: number; previousRatio: number; moneyWon: number; moneyLost: number; gamesAmount: number }];
		availableStakes: number[];
	};
} & (
	| { status: "startGame" }
	| { status: "gameStarted"; currentGame: [CurrentGameStarted | CurrentGameStartedIncorrect] }
	| { status: "makeChoice"; currentGame: [CurrentGameChoice] }
	| { status: "moneyTaken"; currentGame: [CurrentGameMoneyTaken] }
);

interface CurrentGameStarted {
	gameID: number;
	dealerCard: string;
	dealerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
}

interface CurrentGameStartedIncorrect {
	dealerCard: number;
	playerCard: string;
	lastDealerCard: number;
	lastPlayerCard: string;
	move: number;
	result: string;
	potToAdd: null;
	step: string;
	currentPot: number;
	actualResult: string;
	lastChoice: string;
	potUpdatedTo: number;
	winsInRow: number;
	lastDealerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	lastPlayerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	dealerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	playerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
}

interface CurrentGameChoice {
	dealerCard: number;
	playerCard: string;
	lastDealerCard: number;
	lastPlayerCard: string;
	move: number;
	result: string;
	potToAdd: number;
	step: string;
	currentPot: number;
	actualResult: string;
	lastChoice: string;
	potUpdatedTo: number;
	winsInRow: number;
	lastDealerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	lastPlayerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	dealerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	playerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
}

interface CurrentGameMoneyTaken {
	ID: number;
	userID: number;
	TimeCreated: string;
	currentStep: number;
	betAmount: number;
	currentPot: number;
	move: number;
	winsInRow: number;
	dealerCard: number;
	lastDealerCard: number;
	lastPlayerCard: number;
	potUpdatedTo: number;
	lastChoice: string;
	currentLayoutType: string;
	lastDealerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
	lastPlayerCardInfo: { fullName: string; name: string; classCode: string; nameShort: string };
}

function isInternalHighLowData(sid: string | null, json: unknown): json is TornInternalHighLowData {
	return sid === "highlowData" && !!json;
}

export default class HighLowHelperFeature extends Feature {
	constructor() {
		super("High-low Helper", "casino");
	}

	override isEnabled() {
		return settings.pages.casino.highlow;
	}

	override initialise() {
		initialiseHelper();
	}

	override storageKeys() {
		return ["settings.pages.casino.highlow"];
	}
}
