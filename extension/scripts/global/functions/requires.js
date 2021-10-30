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
		const checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, options.delay);

		function checkCondition() {
			const response = condition();
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
	if (attributes.invert) {
		return requireCondition(() => !attributes.parent.find(selector), attributes);
	} else {
		return requireCondition(() => attributes.parent.find(selector), attributes);
	}
}

function requireSidebar() {
	return requireElement("#sidebar");
}

function requireContent() {
	// return requireElement("#skip-to-content, #react-root");
	return requireElement(".content-wrapper");
}

function requireItemsLoaded() {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

function requireChatsLoaded() {
	return requireElement("[class*='overview_']");
}

function requireFeatureManager() {
	return new Promise((resolve) => {
		while (typeof featureManager === "undefined") {} // eslint-disable-line no-empty

		resolve();
	});
}
