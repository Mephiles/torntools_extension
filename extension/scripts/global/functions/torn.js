"use strict";

const ALL_ICONS = Array.from({ length: 86 }, (x, i) => `icon${i + 1}`);

const ALL_AREAS = [
	{ class: "home", text: "Home" },
	{ class: "items", text: "Items" },
	{ class: "city", text: "City" },
	{ class: "job", text: "Job" },
	{ class: "gym", text: "Gym" },
	{ class: "properties", text: "Properties" },
	{ class: "education", text: "Education" },
	{ class: "crimes", text: "Crimes" },
	{ class: "missions", text: "Missions" },
	{ class: "newspaper", text: "Newspaper" },
	{ class: "jail", text: "Jail" },
	{ class: "hospital", text: "Hospital" },
	{ class: "casino", text: "Casino" },
	{ class: "forums", text: "Forums" },
	{ class: "hall_of_fame", text: "Hall of Fame" },
	{ class: "my_faction", text: "My Faction" },
	{ class: "recruit_citizens", text: "Recruit Citizens" },
	{ class: "competitions", text: "Competitions" },
	{ class: "community_events", text: "Community Events" },
];

const ALLOWED_BLOOD = {
	"o+": [738, 739], // 738
	"o-": [739], // 739
	"a+": [732, 733, 738, 739], // 732
	"a-": [733, 739], // 733
	"b+": [734, 735, 738, 739], // 734
	"b-": [735, 739], // 735
	"ab+": [732, 733, 734, 735, 736, 737, 738, 739], // 736
	"ab-": [733, 735, 737, 739], // 737
};

const CASINO_GAMES = ["slots", "roulette", "high-low", "keno", "craps", "bookie", "lottery", "blackjack", "poker", "r-roulete", "spin-the-wheel"];

const DRUG_INFORMATION = {
	196: {
		pros: ["Increased crime success rate", "+2-3 Nerve"],
		cons: ["-20% Strength", "-25% Defense", "-35% Speed"],
		cooldown: "60-90 minutes",
		overdose: {
			bars: ["-100% Energy & Nerve"],
			hosp_time: "5 hours",
			extra: "'Spaced Out' honor bar",
		},
	},
	197: {
		pros: ["Doubles Happy"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy & Happy"],
		},
	},
	198: {
		pros: ["+50% Defense"],
		cons: ["-20% Strength & Speed"],
		cooldown: "45-60 minutes",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			stats: "-20% Strength & Speed",
			hosp_time: "16-17 hours",
			extra: "24-27 hours of cooldown",
		},
	},
	199: {
		pros: ["+30% Strength", "+50% Defense", "+50 Energy", "+200-500 Happy", "+5 Nerve"],
		cons: ["-30% Speed & Dexterity"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve", "-50% Happy"],
			stats: "-30% Speed & Dexterity",
		},
	},
	200: {
		pros: ["Removes all hospital time (except Radiation Sickness) and replenishes life to 66.6%", "+50-100 Happy"],
		cooldown: "3-4 hours",
	},
	201: {
		pros: ["+20% Strength & Dexterity", "+250 Happy"],
		cooldown: "4-7 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "27 hours",
			stats: "-10x(player level) Speed (permanent)",
		},
	},
	203: {
		pros: ["+500 Happy"],
		cons: ["-20% All Battle Stats", "-25 Energy (caps at 0)"],
		cooldown: "3-4 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "1h 40min",
		},
	},
	204: {
		pros: ["+20% Speed", "+50 Happy"],
		cons: ["-20% Dexterity"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			stats: "-6x(player level) Strength & Defense (permanent)",
			hosp_time: "7h 30min",
		},
	},
	205: {
		pros: ["+25% All Battle Stats", "+75 Happy"],
		cooldown: "4-6 hours",
		overdose: {
			bars: ["-150 Happy"],
		},
	},
	206: {
		pros: ["+250 Energy", "+75 Happy"],
		cons: ["-35% All Battle Stats"],
		cooldown: "6-8 hours",
		overdose: {
			bars: ["-100% Energy, Nerve & Happy"],
			hosp_time: "3 days 12 hours",
			extra: "24 hours of cooldown and increased addiction.",
		},
	},
	870: {
		pros: ["Cost of attacking and reviving reduced by 10 energy.", "+50% Speed", "+25% Dexterity"],
		cons: ["Only works on Valentine's Day"],
		cooldown: "5 hours",
	},
};

const SETS = {
	FLOWERS: [
		{ name: "Dahlia", id: 260 },
		{ name: "Crocus", id: 263 },
		{ name: "Orchid", id: 264 },
		{ name: "Heather", id: 267 },
		{ name: "Ceibo Flower", id: 271 },
		{ name: "Edelweiss", id: 272 },
		{ name: "Peony", id: 276 },
		{ name: "Cherry Blossom", id: 277 },
		{ name: "African Violet", id: 282 },
		{ name: "Tribulus Omanense", id: 385 },
		{ name: "Banana Orchid", id: 617 },
	],
	PLUSHIES: [
		{ name: "Sheep Plushie", id: 186 },
		{ name: "Teddy Bear Plushie", id: 187 },
		{ name: "Kitten Plushie", id: 215 },
		{ name: "Jaguar Plushie", id: 258 },
		{ name: "Wolverine Plushie", id: 261 },
		{ name: "Nessie Plushie", id: 266 },
		{ name: "Red Fox Plushie", id: 268 },
		{ name: "Monkey Plushie", id: 269 },
		{ name: "Chamois Plushie", id: 273 },
		{ name: "Panda Plushie", id: 274 },
		{ name: "Lion Plushie", id: 281 },
		{ name: "Camel Plushie", id: 384 },
		{ name: "Stingray Plushie", id: 618 },
	],
};

const SPECIAL_FILTER_ICONS = {
	isfedded: ["icon70_"],
	traveling: ["icon71_"],
	newplayer: ["icon72_"],
	onwall: ["icon75_", "icon76_"],
	incompany: ["icon21_", "icon22_", "icon23_", "icon24_", "icon25_", "icon26_", "icon27_", "icon73_", "icon83_"],
	infaction: ["icon9_", "icon74_", "icon81_"],
	isdonator: ["icon3_", "icon4_"],
};

const CHAIN_BONUSES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

const LINKS = {
	events: "https://www.torn.com/events.php#/step=all",
	messages: "https://www.torn.com/messages.php",
	stocks: "https://www.torn.com/stockexchange.php?step=portfolio",
	home: "https://www.torn.com/index.php",
	items: "https://www.torn.com/item.php",
	items_candy: "https://www.torn.com/item.php#candy-items",
	items_medical: "https://www.torn.com/item.php#medical-items",
	education: "https://www.torn.com/education.php#/step=main",
	chain: "https://www.torn.com/factions.php?step=your#/war/chain",
	hospital: "https://www.torn.com/hospitalview.php",
	organizedCrimes: "https://www.torn.com/factions.php?step=your#/tab=crimes",
	gym: "https://www.torn.com/gym.php",
};

function getNextChainBonus(current) {
	return CHAIN_BONUSES.find((bonus) => bonus > current);
}

function isSellable(id) {
	if (!torndata || !torndata.items) return true;

	const item = torndata.items[id];

	return (
		item &&
		!["Book", "Unused"].includes(item.type) &&
		![
			373, // Parcel
			374, // Present
			375, // Present
			376, // Present
			820, // Piggy Bank
			920, // Halloween Basket
			1003, // Halloween Basket
			1004, // Halloween Basket
			1005, // Halloween Basket
			1006, // Halloween Basket
			1007, // Halloween Basket
			1008, // Halloween Basket
			1009, // Halloween Basket
			1010, // Halloween Basket
			1011, // Halloween Basket
		].includes(item.id)
	);
}

function isFlying() {
	return document.body.dataset.traveling === "true" || document.body.dataset.traveling === true;
}

function isAbroad() {
	return (!isFlying() && document.body.dataset.abroad === "true") || document.body.dataset.abroad === true;
}

function getRFC() {
	const rfc = getCookie("rfc_v");
	if (!rfc) {
		for (let cookie of document.cookie.split("; ")) {
			cookie = cookie.split("=");
			if (cookie[0] === "rfc_v") {
				return cookie[1];
			}
		}
	}
	return rfc;
}

function addRFC(url) {
	url = url || "";
	url += (url.split("?").length > 1 ? "&" : "?") + "rfcv=" + getRFC();
	return url;
}

function getPage() {
	let page = location.pathname.substring(1);
	if (page.endsWith(".php")) page = page.substring(0, page.length - 4);
	else if (page.endsWith(".html")) page = page.substring(0, page.length - 3);

	switch (page) {
		case "index":
			page = "home";
			break;
	}

	return page;
}

function isCaptcha() {
	return !!document.find(".captcha");
}

function hasDarkMode() {
	return document.body.classList.contains("dark-mode");
}

const darkModeObserver = (() => {
	const listeners = new Set();
	let prevDarkModeState;

	const observer = new MutationObserver(() => {
		const darkModeState = hasDarkMode();

		if (darkModeState !== prevDarkModeState) {
			prevDarkModeState = darkModeState;
			_invokeListeners(darkModeState);
		}
	});

	function addListener(callback) {
		if (!prevDarkModeState) {
			prevDarkModeState = hasDarkMode();
		}

		listeners.add(callback);

		if (listeners.size === 1) {
			observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
		}
	}

	function removeListener(callback) {
		listeners.delete(callback);

		if (listeners.size === 0) {
			observer.disconnect();
		}
	}

	function _invokeListeners(isInDarkMode) {
		for (const listener of listeners.values()) {
			listener(isInDarkMode);
		}
	}

	return {
		addListener,
		removeListener,
	};
})();

async function createMessageBox(content, options = {}) {
	options = {
		class: "",
		...options,
	};

	const icon = await (await fetch(chrome.runtime.getURL("resources/images/svg-icons/icon_128.svg"))).text();

	return document.newElement({
		type: "div",
		class: `tt-message-box ${options.class}`,
		html: `
			<div class="tt-message-icon-wrap">
				<div class="tt-message-icon">${icon}</div>
			</div>
			<div class="tt-message-wrap">
				<div class="tt-message">${content}</div>
			</div>
		`,
	});
}

const REACT_UPDATE_VERSIONS = {
	DEFAULT: "default",
	NATIVE_SETTER: "nativeSetter",
};

function updateReactInput(input, value, options = {}) {
	options = {
		version: REACT_UPDATE_VERSIONS.DEFAULT,
		...options,
	};

	switch (options.version) {
		case "complex-please-never-be-needed":
			const lastValue = input.value;
			input.value = value;
			const event = new Event("input", { bubbles: true, simulated: true });
			// Probably needs to be moved to a script tag.
			const tracker = input._valueTracker;
			// Another try can be made by setting the value tracker to null.
			if (tracker) {
				tracker.setValue(lastValue);
			}
			console.log("TT DEBUG - Updating react input.", { input, value, lastValue, tracker });
			input.dispatchEvent(event);
			break;
		case REACT_UPDATE_VERSIONS.NATIVE_SETTER:
			const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
			nativeSetter.call(input, value);

			input.dispatchEvent(new Event("input", { bubbles: true }));
			break;
		case REACT_UPDATE_VERSIONS.DEFAULT:
		default:
			input.value = value;
			input.dispatchEvent(new Event("input", { bubbles: true }));
			break;
	}
}

function isDividendStock(id) {
	if (isIntNumber(id)) return [1, 4, 5, 6, 7, 9, 10, 12, 15, 16, 17, 18, 19, 22, 24, 27, 28, 29, 31, 32].includes(id);

	return false;
}

function getRequiredStocks(required, increment) {
	return (Math.pow(2, increment) - 1) * required;
}

function getStockIncrement(required, stocks) {
	return Math.log2(Math.floor(stocks / required) + 1);
}

function getStockReward(reward, increment) {
	let value;
	if (reward.startsWith("$")) {
		const cash = parseInt(reward.replace("$", "").replaceAll(",", "")) * increment;

		value = formatNumber(cash, { currency: true });
	} else if (reward.match(/^[0-9]+x? /i)) {
		const splitBenefit = reward.split(" ");
		const hasX = splitBenefit[0].endsWith("x");
		const amount = parseInt(splitBenefit.shift().replace("x", "")) * increment;
		const item = splitBenefit.join(" ");

		value = `${formatNumber(amount)}${hasX ? "x" : ""} ${item}`;
	} else {
		value = "Unknown, please report this!";
	}

	return value;
}

function getRewardValue(reward) {
	let value;
	if (reward.startsWith("$")) {
		value = parseInt(reward.replace("$", "").replaceAll(",", ""));
	} else if (reward.match(/^[0-9]+x? /i)) {
		const rewardItem = reward.split(" ").slice(1).join(" ");

		const item = findItemsInObject(torndata.items, { name: rewardItem }, { single: true });

		if (item) value = item ? item.market_value : -1;
		else {
			let prices;

			switch (rewardItem) {
				case "Ammunition Pack":
					break;
				case "Clothing Cache":
					prices = [1057, 1112, 1113, 1114, 1115, 1116, 1117].map((id) => torndata.items[id].market_value);
					break;
				case "Random Property":
					prices = Object.values(torndata.properties)
						.map((property) => property.cost)
						.filter((price) => !!price)
						.map((price) => price * 0.75);
					break;
				case "Happiness":
					break;
				case "Energy":
					break;
				default:
					value = -1;
					break;
			}

			if (Array.isArray(prices)) value = prices.totalSum() / prices.length;
		}
	} else {
		value = -1;
	}

	return value;
}

function getStockBoughtPrice(stock) {
	const boughtTotal = Object.values(stock.transactions).reduce((prev, trans) => prev + trans.bought_price * trans.shares, 0);

	return { boughtTotal, boughtPrice: boughtTotal / stock.total_shares };
}

function getPageStatus() {
	const infoMessage = document.find(".content-wrapper .info-msg-cont");
	if (infoMessage && infoMessage.classList.contains("red")) return { access: false, message: infoMessage.innerText };

	if (document.find(".captcha")) return { access: false, message: "Captcha required" };

	return { access: true };
}

function millisToNewDay() {
	const now = new Date();
	const newDate = new Date();
	newDate.setUTCHours(0, 0, 0);
	newDate.setUTCDate(newDate.getUTCDate() + 1);

	return newDate - now;
}
