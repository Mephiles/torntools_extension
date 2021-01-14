casinoGameLoaded().then(() => {
	console.log("TT - Casino | HiLo");

	if (!settings.pages.casino.global || !settings.pages.casino.hilo) {
		return;
	}

	Main();
});

function Main() {
	const picture_cards = {
		J: 11,
		Q: 12,
		K: 13,
		A: 14,
	};

	let current_deck = {
		hearts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		diamonds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		clubs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		spades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
	};
	let last_dealer_card;
	let last_you_card;
	let cashed_in = false;

	// Start game button
	let start_button = doc.find(".startGame");
	start_button.addEventListener("click", () => {
		cashed_in = false;
		setTimeout(calculate, 1000);
	});

	// Continue game button
	let continue_button = doc.find(".action-c[data-step=continue]");
	continue_button.addEventListener("click", () => {
		if (cashed_in) {
			return;
		}

		if (doc.find(".main-message-wrap .message.red")) {
			console.log("Lost");
			last_dealer_card = undefined;
			last_you_card = undefined;
			current_deck = {
				hearts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				diamonds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				clubs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				spades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			};
		} else if (doc.find(".deck-wrap").style.display === "block") {
			console.log("Deck shuffled");
			current_deck = {
				hearts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				diamonds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				clubs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
				spades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			};
			setTimeout(calculate, 700);
		} else {
			setTimeout(calculate, 700);
		}
	});

	// Cash in button
	let cash_in_button = doc.find(".cashin");
	cash_in_button.addEventListener("click", () => {
		console.log("Cashed in");
		cashed_in = true;
		last_dealer_card = undefined;
		last_you_card = undefined;
		current_deck = {
			hearts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			diamonds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			clubs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
			spades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
		};
	});

	// remove action when chosen option
	for (let div of [doc.find(".actions-wrap .low"), doc.find(".actions-wrap .high")]) {
		div.addEventListener("click", () => {
			console.log("click");
			if (doc.find(".tt-hilo-action")) doc.find(".tt-hilo-action").remove();

			setTimeout(() => {
				let new_you_card = getCard("you-card", picture_cards, last_you_card);
				console.log("new_you_card", new_you_card);
				current_deck = removeCard(current_deck, new_you_card);
				console.log("new_deck_without_you_card", current_deck);
				last_you_card = new_you_card;
			}, 700);
		});
	}

	function calculate() {
		console.log("=====================================================");
		console.log("last_dealer_card", last_dealer_card);
		console.log("last_you_card", last_you_card);

		let new_dealer_card = getCard("dealer-card", picture_cards, last_dealer_card);
		console.log("new_dealer_card", new_dealer_card);

		current_deck = removeCard(current_deck, new_dealer_card);
		console.log("new_deck_without_dealer_card", current_deck);
		last_dealer_card = new_dealer_card;

		let action = getAction(current_deck, new_dealer_card);
		console.log("Action", action);

		// show action
		let span = doc.new("span");
		span.setClass("tt-hilo-action");
		span.innerText = action;
		doc.find(".actions-wrap").appendChild(span);
	}
}

function getCard(type, picture_cards, last_type_card) {
	let card_elements = doc.findAll(`.${type} .flipper *`);
	let possible_cards = [];

	console.log("card_elements", card_elements);

	for (let card_element of card_elements) {
		let name = card_element.classList[0];
		if (name.indexOf("back") > -1) continue;

		let suit = name.split("-")[1];
		let value = name.split("-")[2];

		if (isNaN(parseInt(value))) value = picture_cards[value];
		else value = parseInt(value);

		possible_cards.push({ [suit]: value });
	}

	console.log("possible cards", possible_cards);

	if (!last_type_card || possible_cards.length === 1) return possible_cards[0];
	else if (possible_cards[0][Object.keys(possible_cards[0])[0]] === last_type_card[Object.keys(last_type_card)[0]]) {
		return possible_cards[1];
	} else if (possible_cards[1][Object.keys(possible_cards[1])[0]] === last_type_card[Object.keys(last_type_card)[0]]) {
		return possible_cards[0];
	}
}

function removeCard(_deck, card) {
	let suit = Object.keys(card)[0];
	_deck[suit].splice(_deck[suit].indexOf(card[suit]), 1);

	return _deck;
}

function getAction(deck, _card) {
	let lower_cards = [];
	let higher_cards = [];

	let player_suit = Object.keys(_card)[0];

	// all cards
	for (let suit in deck) {
		for (let card of deck[suit]) {
			if (card > _card[player_suit]) higher_cards.push(card);
			else if (card < _card[player_suit]) lower_cards.push(card);
			else if (card === _card[player_suit]) {
				higher_cards.push(card);
				lower_cards.push(card);
			}
		}
	}

	let possibilities = lower_cards.length + higher_cards.length;
	let lower_possibility = lower_cards.length / possibilities;
	let higher_possibility = higher_cards.length / possibilities;

	console.log("--------------------------------");
	console.log("deck", deck);
	console.log("_card", _card);
	console.log("lower_possibilities", lower_possibility);
	console.log("higher_possibilities", higher_possibility);
	console.log("--------------------------------");

	if (lower_possibility < higher_possibility) return "Higher";
	else if (lower_possibility > higher_possibility) return "Lower";
	else return "50/50";
}

function casinoGameLoaded() {
	let promise = new Promise((resolve) => {
		let counter = 0;
		let checker = setInterval(() => {
			if (doc.find(".startGame")) {
				resolve(true);
				return clearInterval(checker);
			} else if (counter > 100) {
				resolve(false);
				return clearInterval(checker);
			}
		}, 100);
	});

	return promise.then((data) => data);
}
