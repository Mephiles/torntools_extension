"use strict";

(async () => {
	// if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"High-low Helper",
		"casino",
		() => settings.pages.casino.highlow,
		initialiseHelper,
		null,
		removeHelper,
		{
			storage: ["settings.pages.casino.highlow"],
		},
		null
	);

	let deck;
	shuffleDeck();

	function initialiseHelper() {
		addXHRListener(({ detail: { page, xhr, json } }) => {
			if (!feature.enabled()) return;

			if (page === "page") {
				const params = new URL(xhr.responseURL).searchParams;
				const sid = params.get("sid");

				if (sid === "highlowData" && json) {
					switch (json.status) {
						case "gameStarted":
							if (json.currentGame[0].result === "Incorrect") {
								removeHelper();
							} else {
								executeStrategy(json);
							}
							break;
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
				}
			}
		});
	}

	function executeStrategy(data) {
		const { value: dealerValue, suit: dealerSuit } = getCardWorth(data.currentGame[0].dealerCardInfo);
		removeCard(dealerSuit, dealerValue);

		let higher = 0;
		let lower = 0;
		for (const suit in deck) {
			for (const value of deck[suit]) {
				if (value > dealerValue) higher++;
				else if (value < dealerValue) lower++;
			}
		}

		let outcome;
		if (higher < lower) outcome = "lower";
		else if (higher > lower) outcome = "higher";
		else outcome = "50/50";

		const actions = document.find(".actions-wrap");
		if (settings.pages.casino.highlowMovement) {
			let action;
			if (outcome === "lower" || outcome === "higher") action = outcome;
			else if (outcome === "50/50") action = Math.random() < 0.5 ? "higher" : "lower";

			actions.dataset.outcome = action;
			document.find(".startGame").style.display = "none";
		} else {
			const element = actions.find(".tt-high-low");
			if (element) element.textContent = outcome;
			else actions.appendChild(document.newElement({ type: "span", class: "tt-high-low", text: capitalizeText(outcome) }));
		}
	}

	function getCardWorth({ classCode, nameShort }) {
		const suit = classCode.split("-")[0];

		let value;
		if (!isNaN(nameShort)) value = parseInt(nameShort);
		else if (nameShort === "J") value = 11;
		else if (nameShort === "Q") value = 12;
		else if (nameShort === "K") value = 13;
		else if (nameShort === "A") value = 14;
		else throw `Invalid card value (${nameShort}).`;

		return { value, suit };
	}

	function moveStart() {
		if (!settings.pages.casino.highlowMovement) return;

		const actionsWrap = document.find(".actions-wrap");
		const actions = document.find(".actions");
		const startButton = document.find(".startGame");
		const lowButton = document.find(".low");
		const highButton = document.find(".high");
		const continueButton = document.find(".continue");

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

	function removeCard(suit, value) {
		deck[suit].splice(deck[suit].indexOf(value), 1);
	}

	function removeHelper() {
		const actions = document.find(".actions-wrap");

		if (actions) {
			delete actions.dataset.outcome;
			actions.find(".tt-high-low")?.remove();
		}
	}
})();
