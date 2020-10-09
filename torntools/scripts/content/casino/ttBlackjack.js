casinoGameLoaded().then(() => {
	console.log("TT - Casino | Blackjack");

	if (!settings.pages.casino.global || !settings.pages.casino.blackjack) {
		return;
	}

	doc.find(".startGame").addEventListener("click", () => {
		if (doc.find(".bet-confirm").style.display !== "block") {
			setTimeout(Main, 3000);
		}
	});

	// bet confirm
	doc.find(".bet-confirm .yes").addEventListener("click", () => {
		setTimeout(Main, 3000);
	});

	// remove action when chosen option
	for (let li of doc.findAll(".d-buttons-wrap li")) {
		li.addEventListener("click", () => {
			if (doc.find(".tt-blackjack-action")) doc.find(".tt-blackjack-action").remove();
		});
	}
});

function Main() {
	let player_cards = getCards("player");
	let dealer_card = getCards("dealer");

	console.log("player", player_cards);
	console.log("dealer", dealer_card);

	let action = getAction(player_cards, dealer_card);

	const action_options = {
		S: "Stand",
		SP: "Split",
		D: "Double Down",
		H: "Hit",
	};

	// display action
	console.log(action_options[action]);
	let span = doc.new("span");
	span.setClass("tt-blackjack-action");
	span.style.display = "block";
	span.innerText = action_options[action];

	doc.find(".player-cards").appendChild(span);
}

function getCards(type) {
	let cards = doc.findAll(`.${type}-cards .inplace:not(.card-back)`);
	let type_cards = [];

	for (let card of cards) {
		let name_of_card = card.classList[0];
		let value_of_card = name_of_card.split("-")[2];

		if (isNaN(parseInt(value_of_card)) && value_of_card !== "A") value_of_card = 10;

		type_cards.push(value_of_card);
	}

	if (type_cards.length === 1) {
		return `${type_cards[0]}`;
	} else {
		if (type_cards[0] === type_cards[1]) {
			return `${type_cards[0]}, ${type_cards[1]}`;
		} else if (type_cards[1] === "A") {
			return `${type_cards[1]}, ${type_cards[0]}`;
		} else if (type_cards[0] === "A") {
			return `${type_cards[0]}, ${type_cards[1]}`;
		} else {
			let val = parseInt(type_cards[0]) + parseInt(type_cards[1]);
			if (val > 17) val = 17;
			return `${val}`;
		}
	}
}

function getAction(player_cards, dealer_card) {
	const action_table = {
		"2, 2": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "SP",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"3, 3": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "SP",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"4, 4": {
			2: "H",
			3: "H",
			4: "H",
			5: "SP",
			6: "SP",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"5, 5": {
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
		"6, 6": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"7, 7": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "SP",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		"8, 8": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "SP",
			8: "SP",
			9: "SP",
			10: "SP",
			A: "SP",
		},
		"9, 9": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "S",
			8: "SP",
			9: "SP",
			10: "S",
			A: "S",
		},
		"10, 10": {
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
		"A, A": {
			2: "SP",
			3: "SP",
			4: "SP",
			5: "SP",
			6: "SP",
			7: "SP",
			8: "SP",
			9: "SP",
			10: "SP",
			A: "SP",
		},
		"A, 2": {
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
		"A, 3": {
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
		"A, 4": {
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
		"A, 5": {
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
		"A, 6": {
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
		"A, 7": {
			2: "S",
			3: "D",
			4: "D",
			5: "D",
			6: "D",
			7: "S",
			8: "S",
			9: "H",
			10: "H",
			A: "H",
		},
		"A, 8": {
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
		"A, 9": {
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
		"A, 10": {
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
			A: "H",
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
			A: "H",
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
			A: "H",
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
			10: "D",
			A: "H",
		},
		12: {
			2: "H",
			3: "H",
			4: "S",
			5: "S",
			6: "S",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		13: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		14: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		15: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		16: {
			2: "S",
			3: "S",
			4: "S",
			5: "S",
			6: "S",
			7: "H",
			8: "H",
			9: "H",
			10: "H",
			A: "H",
		},
		17: {
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
	};

	return action_table[player_cards][dealer_card];
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
