"use strict";

function requireCondition(condition, options = {}) {
	options = {
		delay: 10,
		maxCycles: -1,
		...options,
	};

	return new Promise((resolve, reject) => {
		if (checkCondition()) return;

		let counter = 0;
		let checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, options.delay);

		function checkCondition() {
			let response = condition();
			if (!response) return false;

			if (typeof response === "boolean") {
				if (response) resolve();
				else reject();
			} else if (typeof response === "object") {
				if (response.hasOwnProperty("success")) {
					if (response.success === true) resolve(response.value);
					else reject(response.value);
				} else {
					resolve(response);
				}
			}
			return true;
		}

		function checkCounter(count) {
			if (options.maxCycles <= 0) return false;

			if (count > options.maxCycles) {
				reject("Maximum cycles reached.");
				return true;
			}
			return false;
		}
	});
}

function requireElement(selector, attributes) {
	attributes = {
		invert: false,
		parent: document,
		...attributes,
	};
	return requireCondition(
		() => (attributes.invert && !attributes.parent.find(selector)) || (!attributes.invert && attributes.parent.find(selector)),
		attributes
	);
}

function requireSidebar() {
	return requireElement("#sidebar");
}

function requireContent() {
	// return requireElement(".box-title, .title-black[role=heading], .title-black > div[role=heading], .travel-agency-travelling");
	return requireElement("#skip-to-content, #react-root");
}

function requireItemsLoaded() {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

function requireChatsLoaded() {
	return requireElement("[class*='overview_']");
}
